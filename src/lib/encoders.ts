import type { Contact, Format } from "../types";
import { fullName } from "../types";

function escVCard(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function escMecard(s: string): string {
  return s.replace(/([\\;:,])/g, "\\$1");
}

export function buildVCard(d: Contact): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  if (d.first || d.last) {
    lines.push(`N:${escVCard(d.last)};${escVCard(d.first)};;;`);
  }
  const fn = fullName(d);
  if (fn) lines.push(`FN:${escVCard(fn)}`);
  if (d.org) lines.push(`ORG:${escVCard(d.org)}`);
  if (d.title) lines.push(`TITLE:${escVCard(d.title)}`);
  if (d.mobile) lines.push(`TEL;TYPE=CELL:${d.mobile}`);
  if (d.work) lines.push(`TEL;TYPE=WORK,VOICE:${d.work}`);
  if (d.email) lines.push(`EMAIL;TYPE=INTERNET:${escVCard(d.email)}`);
  if (d.url) lines.push(`URL:${d.url}`);
  if (d.address) lines.push(`ADR;TYPE=WORK:;;${escVCard(d.address)};;;;`);
  if (d.note) lines.push(`NOTE:${escVCard(d.note)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function buildMecard(d: Contact): string {
  const segs: string[] = [];
  if (d.first || d.last) {
    segs.push(`N:${escMecard(d.last)},${escMecard(d.first)};`);
  }
  if (d.mobile) segs.push(`TEL:${d.mobile};`);
  if (d.work) segs.push(`TEL:${d.work};`);
  if (d.email) segs.push(`EMAIL:${escMecard(d.email)};`);
  if (d.url) segs.push(`URL:${escMecard(d.url)};`);
  if (d.address) segs.push(`ADR:${escMecard(d.address)};`);
  if (d.note) segs.push(`NOTE:${escMecard(d.note)};`);
  return `MECARD:${segs.join("")};`;
}

export function buildPayload(d: Contact, fmt: Format): string {
  const trimmed = Object.fromEntries(
    Object.entries(d).map(([k, v]) => [k, v.trim()]),
  ) as unknown as Contact;
  return fmt === "mecard" ? buildMecard(trimmed) : buildVCard(trimmed);
}

export function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}
