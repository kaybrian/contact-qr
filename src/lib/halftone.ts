import QRCode from "qrcode";
import type { Ecc } from "../types";

/**
 * Halftone QR rendering.
 *
 * Each QR module is split into a 3x3 grid of sub-modules. The centre sub-module
 * keeps the value a decoder samples; the surrounding eight carry a dithered
 * rendering of the photo. Function patterns (finders, separators, timing,
 * alignment, format and version info) always render solid — dithering those
 * breaks detection outright.
 *
 * The photo is never added to the QR payload, so the encoded contact data is
 * completely unchanged. This is a visual treatment only.
 */

/** Luminance source, row-major, values 0..1. */
export interface GraySource {
  gray: Float32Array;
  width: number;
  height: number;
}

export interface HalftoneResult {
  /** Sub-module bitmap, row-major, 1 = dark. Side length is `subSize`. */
  sub: Uint8Array;
  subSize: number;
  moduleCount: number;
  version: number;
}

export const HALFTONE_DEFAULTS = {
  /** Measured safe ceiling: decodes reliably through heavy blur. See scripts/verify-halftone.mjs. */
  strength: 0.7,
  contrast: 1.7,
} as const;

/** Sub-modules per module, per axis. */
const SUB = 3;

/**
 * Alignment-pattern centre coordinates for a version, per ISO/IEC 18004.
 * Verified to match `qrcode`'s internal table for versions 1-40.
 */
function alignmentCentres(version: number): Array<[number, number]> {
  if (version === 1) return [];
  const size = version * 4 + 17;
  const count = Math.floor(version / 7) + 2;
  const interval = size === 145 ? 26 : Math.ceil((size - 13) / (2 * count - 2)) * 2;

  const axis = [size - 7];
  for (let i = 1; i < count - 1; i++) axis[i] = axis[i - 1] - interval;
  axis.push(6);
  axis.reverse();

  const out: Array<[number, number]> = [];
  for (const r of axis) {
    for (const c of axis) {
      const overlapsFinder =
        (r <= 6 && c <= 6) || (r <= 6 && c >= size - 7) || (r >= size - 7 && c <= 6);
      if (!overlapsFinder) out.push([r, c]);
    }
  }
  return out;
}

/** Modules that must render solid. 1 = protected. */
function protectedMask(size: number, version: number): Uint8Array {
  const mask = new Uint8Array(size * size);
  const rect = (r0: number, c0: number, h: number, w: number) => {
    for (let r = r0; r < r0 + h; r++) {
      if (r < 0 || r >= size) continue;
      for (let c = c0; c < c0 + w; c++) {
        if (c < 0 || c >= size) continue;
        mask[r * size + c] = 1;
      }
    }
  };

  // Finder patterns, separators and the format-info strips beside them.
  rect(0, 0, 9, 9);
  rect(0, size - 8, 9, 8);
  rect(size - 8, 0, 8, 9);

  // Timing patterns.
  for (let i = 0; i < size; i++) {
    mask[6 * size + i] = 1;
    mask[i * size + 6] = 1;
  }

  // Alignment patterns (5x5 centred on each position).
  for (const [r, c] of alignmentCentres(version)) rect(r - 2, c - 2, 5, 5);

  // Version-info blocks.
  if (version >= 7) {
    rect(size - 11, 0, 3, 6);
    rect(0, size - 11, 6, 3);
  }

  return mask;
}

/** Bilinear resample of a luminance plane. */
function resample(
  src: Float32Array,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
): Float32Array {
  const out = new Float32Array(dw * dh);
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, ((y + 0.5) * sh) / dh - 0.5);
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(sh - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, ((x + 0.5) * sw) / dw - 0.5);
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(sw - 1, x0 + 1);
      const fx = sx - x0;
      const a = src[y0 * sw + x0];
      const b = src[y0 * sw + x1];
      const c = src[y1 * sw + x0];
      const d = src[y1 * sw + x1];
      out[y * dw + x] =
        a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
    }
  }
  return out;
}

/** Floyd–Steinberg error diffusion. Returns 1 = dark. */
function dither(target: Float32Array, w: number, h: number): Uint8Array {
  const buf = Float32Array.from(target);
  const out = new Uint8Array(w * h);
  const spread = (x: number, y: number, err: number, f: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    buf[y * w + x] += err * f;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = buf[i];
      const next = old < 0.5 ? 0 : 1;
      out[i] = next === 0 ? 1 : 0;
      const err = old - next;
      spread(x + 1, y, err, 7 / 16);
      spread(x - 1, y + 1, err, 3 / 16);
      spread(x, y + 1, err, 5 / 16);
      spread(x + 1, y + 1, err, 1 / 16);
    }
  }
  return out;
}

export interface HalftoneOptions {
  payload: string;
  ecc: Ecc;
  source: GraySource;
  /** 0 renders an ordinary QR; 1 is maximum photo fidelity. */
  strength?: number;
  contrast?: number;
}

/**
 * Builds the sub-module bitmap. Pure computation — no DOM access, so the
 * verification script can call it under Node.
 */
export function buildHalftone({
  payload,
  ecc,
  source,
  strength = HALFTONE_DEFAULTS.strength,
  contrast = HALFTONE_DEFAULTS.contrast,
}: HalftoneOptions): HalftoneResult {
  const qr = QRCode.create(payload, { errorCorrectionLevel: ecc });
  const n = qr.modules.size;
  const version = qr.version;
  const modules = qr.modules.data;
  const mask = protectedMask(n, version);
  const subSize = n * SUB;

  const image = resample(source.gray, source.width, source.height, subSize, subSize);
  for (let i = 0; i < image.length; i++) {
    image[i] = Math.min(1, Math.max(0, (image[i] - 0.5) * contrast + 0.5));
  }

  // Blend each sub-pixel toward its parent module's tone before dithering, so
  // strength=0 collapses to an exact QR and protected modules stay untouched.
  const target = new Float32Array(subSize * subSize);
  for (let y = 0; y < subSize; y++) {
    const mr = (y / SUB) | 0;
    for (let x = 0; x < subSize; x++) {
      const mc = (x / SUB) | 0;
      const dark = modules[mr * n + mc];
      const moduleLum = dark ? 0 : 1;
      const s = mask[mr * n + mc] ? 0 : strength;
      target[y * subSize + x] = moduleLum * (1 - s) + image[y * subSize + x] * s;
    }
  }

  const sub = dither(target, subSize, subSize);

  // Restore the values a decoder actually samples.
  for (let mr = 0; mr < n; mr++) {
    for (let mc = 0; mc < n; mc++) {
      const dark = modules[mr * n + mc];
      if (mask[mr * n + mc]) {
        for (let dy = 0; dy < SUB; dy++) {
          for (let dx = 0; dx < SUB; dx++) {
            sub[(mr * SUB + dy) * subSize + mc * SUB + dx] = dark;
          }
        }
      } else {
        sub[(mr * SUB + 1) * subSize + mc * SUB + 1] = dark;
      }
    }
  }

  return { sub, subSize, moduleCount: n, version };
}

/** Reads a data URL into a square luminance plane, cover-cropped. */
export async function photoToGray(dataUrl: string, size: number): Promise<GraySource> {
  const img = new Image();
  img.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable.");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, size, size);

  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

  const { data } = ctx.getImageData(0, 0, size, size);
  const gray = new Float32Array(size * size);
  for (let i = 0; i < gray.length; i++) {
    gray[i] =
      (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
  }
  return { gray, width: size, height: size };
}

export interface DrawOptions {
  /** Approximate target width in device pixels, including the quiet zone. */
  targetPx: number;
  dark?: string;
  light?: string;
  /** Quiet-zone width in modules. */
  quietModules?: number;
}

/** Paints a halftone result onto a canvas, sizing it to whole sub-module pixels. */
export function drawHalftone(
  canvas: HTMLCanvasElement,
  result: HalftoneResult,
  { targetPx, dark = "#171A26", light = "#FFFFFF", quietModules = 4 }: DrawOptions,
): void {
  const quietSub = quietModules * SUB;
  const fullSub = result.subSize + quietSub * 2;
  const px = Math.max(1, Math.round(targetPx / fullSub));
  const size = fullSub * px;

  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = light;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = dark;
  for (let y = 0; y < result.subSize; y++) {
    for (let x = 0; x < result.subSize; x++) {
      if (!result.sub[y * result.subSize + x]) continue;
      ctx.fillRect((x + quietSub) * px, (y + quietSub) * px, px, px);
    }
  }
}
