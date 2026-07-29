import QRCode from "qrcode";
import type { Contact, Ecc } from "../types";
import { fullName, roleLine } from "../types";

const INK = "#171A26";
const MUTED = "#5C6577";
const FAINT = "#98A0AF";
const ACCENT = "#2B5CE6";
const LINE = "#E6E8EE";

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

export async function downloadQrPng(
  payload: string,
  ecc: Ecc,
  contact: Contact,
): Promise<void> {
  const url = await QRCode.toDataURL(payload || " ", {
    errorCorrectionLevel: ecc,
    margin: 4,
    width: 1024,
    color: { dark: INK, light: "#FFFFFF" },
  });
  triggerDownload(url, `${fileBase(contact)}.png`);
}

/** Draws the full contact card onto a canvas and downloads it as a PNG. */
export async function downloadCardPng(
  payload: string,
  ecc: Ecc,
  contact: Contact,
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

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, payload || " ", {
    errorCorrectionLevel: ecc,
    margin: 2,
    width: 360,
    color: { dark: INK, light: "#FFFFFF" },
  });

  const qSize = 300;
  const qx = 70;
  const qy = (H - qSize) / 2;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(qx - 14, qy - 14, qSize + 28, qSize + 28);
  ctx.drawImage(qrCanvas, qx, qy, qSize, qSize);

  const tx = qx + qSize + 64;
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
