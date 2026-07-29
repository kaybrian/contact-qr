/**
 * Decode-verification for the halftone QR renderer.
 *
 *   npm run verify:halftone
 *
 * Renders halftone codes across a matrix of photo strengths and simulated camera
 * blur, then decodes each one with jsQR and requires an exact payload match. This
 * is what backs the "safe strength" figure in the UI — rerun it after touching
 * src/lib/halftone.ts.
 *
 * Test images are generated procedurally so there are no binary fixtures to keep
 * in the repo, and so the run is deterministic.
 *
 * Caveat: jsQR is a proxy for a real phone decoder, not a substitute. A passing
 * run means the code is well-formed, not that every handset will read it.
 */
import jsQR from "jsqr";
import { buildHalftone, type GraySource } from "../src/lib/halftone.ts";

const PAYLOAD = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  "N:Okoye;Amara;;;",
  "FN:Amara Okoye",
  "ORG:InversePay",
  "TITLE:Partnerships Lead",
  "TEL;TYPE=CELL:+250 788 123 456",
  "EMAIL;TYPE=INTERNET:amara@inversepay.com",
  "URL:inversepay.com",
  "END:VCARD",
].join("\r\n");

const SIZE = 256;

/** Deterministic pseudo-random, so runs are reproducible. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function makeSource(kind: string): GraySource {
  const gray = new Float32Array(SIZE * SIZE);
  const rand = rng(42);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const nx = x / SIZE;
      const ny = y / SIZE;
      let v: number;
      switch (kind) {
        case "gradient":
          v = (nx + ny) / 2;
          break;
        case "dark":
          // Mostly dark with a bright subject, like a backlit portrait.
          v = 0.15 + 0.7 * Math.exp(-(((nx - 0.5) ** 2 + (ny - 0.4) ** 2) / 0.05));
          break;
        case "light":
          v = 0.85 - 0.6 * Math.exp(-(((nx - 0.5) ** 2 + (ny - 0.55) ** 2) / 0.04));
          break;
        case "noise":
          // Worst case: high-frequency detail with no smooth regions.
          v = rand();
          break;
        case "portrait":
        default: {
          // Rough head-and-shoulders: bright oval on a mid background.
          const head = Math.exp(-(((nx - 0.5) / 0.22) ** 2 + ((ny - 0.42) / 0.28) ** 2));
          const body = Math.exp(-(((nx - 0.5) / 0.45) ** 2 + ((ny - 1.05) / 0.35) ** 2));
          v = 0.35 + 0.5 * head + 0.25 * body;
          break;
        }
      }
      gray[y * SIZE + x] = Math.min(1, Math.max(0, v));
    }
  }
  return { gray, width: SIZE, height: SIZE };
}

function rasterise(
  sub: Uint8Array,
  subSize: number,
  targetPx: number,
): { data: Uint8ClampedArray; width: number } {
  const quiet = 12;
  const full = subSize + quiet * 2;
  const px = Math.max(1, Math.round(targetPx / full));
  const width = full * px;
  const data = new Uint8ClampedArray(width * width * 4).fill(255);
  for (let y = 0; y < subSize; y++) {
    for (let x = 0; x < subSize; x++) {
      if (!sub[y * subSize + x]) continue;
      const ox = (x + quiet) * px;
      const oy = (y + quiet) * px;
      for (let dy = 0; dy < px; dy++) {
        for (let dx = 0; dx < px; dx++) {
          const i = ((oy + dy) * width + ox + dx) * 4;
          data[i] = data[i + 1] = data[i + 2] = 0;
        }
      }
    }
  }
  return { data, width };
}

/** Separable gaussian, emulating camera optics and print bleed. */
function blur(data: Uint8ClampedArray, w: number, sigma: number): Uint8ClampedArray {
  if (sigma <= 0) return data;
  const rad = Math.ceil(sigma * 3);
  const k: number[] = [];
  let sum = 0;
  for (let i = -rad; i <= rad; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    k.push(v);
    sum += v;
  }
  for (let i = 0; i < k.length; i++) k[i] /= sum;

  const tmp = new Float32Array(w * w);
  const out = new Uint8ClampedArray(data.length).fill(255);
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      let a = 0;
      for (let i = -rad; i <= rad; i++) {
        const xx = Math.min(w - 1, Math.max(0, x + i));
        a += data[(y * w + xx) * 4] * k[i + rad];
      }
      tmp[y * w + x] = a;
    }
  }
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      let a = 0;
      for (let i = -rad; i <= rad; i++) {
        const yy = Math.min(w - 1, Math.max(0, y + i));
        a += tmp[yy * w + x] * k[i + rad];
      }
      const i4 = (y * w + x) * 4;
      out[i4] = out[i4 + 1] = out[i4 + 2] = a;
      out[i4 + 3] = 255;
    }
  }
  return out;
}

const KINDS = ["portrait", "gradient", "dark", "light", "noise"];
const STRENGTHS = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
const SIGMAS = [0, 0.8, 1.2, 1.8, 2.5];
const TARGET_PX = 1024;
/** Strength the UI presents as safe. The run fails if it stops decoding cleanly. */
const SAFE_STRENGTH = 0.7;

const sources = KINDS.map((k) => makeSource(k));
let failedSafe = 0;

console.log(`payload ${Buffer.byteLength(PAYLOAD)} bytes | ECC H | rendered at ${TARGET_PX}px`);
console.log(`${sources.length} images: ${KINDS.join(", ")}\n`);
console.log("           blur sigma (px)");
console.log("strength |" + SIGMAS.map((s) => String(s).padStart(7)).join(""));

for (const strength of STRENGTHS) {
  const cells: string[] = [];
  for (const sigma of SIGMAS) {
    let ok = 0;
    for (const source of sources) {
      const result = buildHalftone({ payload: PAYLOAD, ecc: "H", source, strength });
      const { data, width } = rasterise(result.sub, result.subSize, TARGET_PX);
      const decoded = jsQR(blur(data, width, sigma), width, width, {
        inversionAttempts: "dontInvert",
      });
      if (decoded?.data === PAYLOAD) ok++;
    }
    if (strength <= SAFE_STRENGTH && ok < sources.length) failedSafe++;
    cells.push(`${ok}/${sources.length}`.padStart(7));
  }
  const flag = strength === SAFE_STRENGTH ? "  <- UI default" : "";
  console.log(`  ${strength.toFixed(2)}   |${cells.join("")}${flag}`);
}

if (failedSafe > 0) {
  console.error(
    `\nFAIL: ${failedSafe} case(s) at or below the ${SAFE_STRENGTH} default did not decode.`,
  );
  process.exit(1);
}
console.log(`\nOK: every case at or below strength ${SAFE_STRENGTH} decoded cleanly.`);
