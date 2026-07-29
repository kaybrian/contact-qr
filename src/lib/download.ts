import QRCode from "qrcode";
import type { Contact, Ecc } from "../types";
import { fullName, roleLine } from "../types";
import { buildHalftone, drawHalftone, photoToGray } from "./halftone";

/** Photo treatment shared by both exports. `photo` null renders an ordinary QR. */
export interface PhotoOptions {
  photo?: string | null;
  strength?: number;
  contrast?: number;
}

const INK = "#171A26";
const MUTED = "#5C6577";
const FAINT = "#98A0AF";
const ACCENT = "#2B5CE6";
const LINE = "#E6E8EE";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}

function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function fileBase(contact: Contact): string {
  const name = fullName(contact) || "contact";
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-qr"
  );
}

/** Renders the QR to an offscreen canvas, halftoned if a photo is supplied. */
async function renderQrCanvas(
  payload: string,
  ecc: Ecc,
  widthPx: number,
  margin: number,
  { photo, strength, contrast }: PhotoOptions,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  if (photo) {
    const result = buildHalftone({
      payload: payload || " ",
      ecc,
      source: await photoToGray(photo, 512),
      strength,
      contrast,
    });
    drawHalftone(canvas, result, {
      targetPx: widthPx,
      dark: INK,
      quietModules: margin,
    });
  } else {
    await QRCode.toCanvas(canvas, payload || " ", {
      errorCorrectionLevel: ecc,
      margin,
      width: widthPx,
      color: { dark: INK, light: "#FFFFFF" },
    });
  }
  return canvas;
}

export async function downloadQrPng(
  payload: string,
  ecc: Ecc,
  contact: Contact,
  photoOpts: PhotoOptions = {},
): Promise<void> {
  const canvas = await renderQrCanvas(payload, ecc, 1024, 4, photoOpts);
  triggerDownload(canvas.toDataURL("image/png"), `${fileBase(contact)}.png`);
}

/** Draws the full contact card onto a canvas and downloads it as a PNG. */
export async function downloadCardPng(
  payload: string,
  ecc: Ecc,
  contact: Contact,
  photoOpts: PhotoOptions = {},
): Promise<void> {
  const scale = 3; // crisp export
  const W = 1000;
  const H = 560;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);

  // background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);
  // accent edge
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, 10, H);

  const qrCanvas = await renderQrCanvas(payload, ecc, 360, 2, photoOpts);

  const qSize = 300;
  const qx = 70;
  const qy = (H - qSize) / 2;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(qx - 14, qy - 14, qSize + 28, qSize + 28);
  ctx.drawImage(qrCanvas, qx, qy, qSize, qSize);

  const tx = qx + qSize + 64;

  // Circular avatar above the name, when a photo is set.
  if (photoOpts.photo) {
    const avatar = await loadImage(photoOpts.photo);
    const r = 36;
    const cx = tx + r;
    const cy = 108;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const side = Math.min(avatar.width, avatar.height);
    ctx.drawImage(
      avatar,
      (avatar.width - side) / 2,
      (avatar.height - side) / 2,
      side,
      side,
      cx - r,
      cy - r,
      r * 2,
      r * 2,
    );
    ctx.restore();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const name = fullName(contact) || "New contact";
  ctx.fillStyle = INK;
  ctx.font = "700 44px 'Inter', system-ui, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(name, tx, 176, W - tx - 50);

  const role = roleLine(contact);
  if (role) {
    ctx.fillStyle = MUTED;
    ctx.font = "500 20px 'Inter', system-ui, sans-serif";
    ctx.fillText(role, tx, 210, W - tx - 50);
  }

  // accent rule
  ctx.fillStyle = ACCENT;
  ctx.fillRect(tx, 238, 46, 3);

  let y = 292;
  const line = (tag: string, value: string) => {
    if (!value) return;
    ctx.fillStyle = FAINT;
    ctx.font = "700 12px 'Inter', system-ui, sans-serif";
    ctx.fillText(tag.toUpperCase(), tx, y);
    ctx.fillStyle = INK;
    ctx.font = "500 19px 'Inter', system-ui, sans-serif";
    ctx.fillText(value, tx + 90, y, W - tx - 90 - 50);
    y += 40;
  };
  line("Mobile", contact.mobile);
  line("Work", contact.work);
  line("Email", contact.email);
  line("Web", contact.url);
  line("Addr", contact.address);

  ctx.fillStyle = FAINT;
  ctx.font = "500 14px 'Inter', system-ui, sans-serif";
  ctx.fillText("Scan to save this contact", tx, H - 60);

  triggerDownload(canvas.toDataURL("image/png"), `${fileBase(contact)}-card.png`);
}
