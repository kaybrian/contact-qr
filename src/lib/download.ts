import QRCode from "qrcode";
import type { Contact, Ecc } from "../types";
import { fullName, roleLine } from "../types";

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
    color: { dark: "#171B24", light: "#FFFFFF" },
  });
  triggerDownload(url, `${fileBase(contact)}.png`);
}

/** Draws the full business card onto a canvas and downloads it as a PNG. */
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

  // background + foil edge
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#C99A3B";
  ctx.fillRect(0, 0, 14, H);

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, payload || " ", {
    errorCorrectionLevel: ecc,
    margin: 2,
    width: 360,
    color: { dark: "#171B24", light: "#FFFFFF" },
  });

  const qSize = 300;
  const qx = 70;
  const qy = (H - qSize) / 2;
  ctx.drawImage(qrCanvas, qx, qy, qSize, qSize);

  const tx = qx + qSize + 60;
  const name = fullName(contact) || "New contact";
  ctx.fillStyle = "#171B24";
  ctx.font = "600 46px 'Fraunces', Georgia, serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(name, tx, 190, W - tx - 50);

  const role = roleLine(contact).replace(" · ", "  ·  ");
  if (role) {
    ctx.fillStyle = "#5B6472";
    ctx.font = "500 20px 'Archivo', sans-serif";
    ctx.fillText(role, tx, 224, W - tx - 50);
  }

  // foil rule
  ctx.fillStyle = "#C99A3B";
  ctx.fillRect(tx, 250, 52, 2);

  let y = 296;
  const line = (tag: string, value: string) => {
    if (!value) return;
    ctx.fillStyle = "#8A93A2";
    ctx.font = "700 12px 'Archivo', sans-serif";
    ctx.fillText(tag.toUpperCase(), tx, y);
    ctx.fillStyle = "#171B24";
    ctx.font = "500 19px 'Archivo', sans-serif";
    ctx.fillText(value, tx + 66, y, W - tx - 66 - 50);
    y += 40;
  };
  line("Cell", contact.mobile);
  line("Work", contact.work);
  line("Mail", contact.email);
  line("Web", contact.url);
  line("Addr", contact.address);

  triggerDownload(canvas.toDataURL("image/png"), `${fileBase(contact)}-card.png`);
}
