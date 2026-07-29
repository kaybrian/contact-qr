import type { Contact, Ecc, Format } from "../types";
import { fullName, roleLine } from "../types";
import { QRCanvas } from "./QRCanvas";

interface PreviewCardProps {
  contact: Contact;
  payload: string;
  ecc: Ecc;
  fmt: Format;
  photo?: string | null;
  /** Non-null when the code should be drawn as a halftone of the photo. */
  halftone?: { strength: number; contrast: number } | null;
}

const LINES: Array<{ tag: string; id: keyof Contact; full?: boolean }> = [
  { tag: "Mobile", id: "mobile" },
  { tag: "Work phone", id: "work" },
  { tag: "Email", id: "email" },
  { tag: "Website", id: "url" },
  { tag: "Company", id: "org" },
  { tag: "Job title", id: "title" },
  { tag: "Address", id: "address", full: true },
];

function initials(contact: Contact): string {
  const chars = [contact.first.trim()[0], contact.last.trim()[0]]
    .filter(Boolean)
    .join("");
  return chars.toUpperCase() || "QR";
}

export function PreviewCard({
  contact,
  payload,
  ecc,
  fmt,
  photo,
  halftone,
}: PreviewCardProps) {
  const name = fullName(contact);
  const role = roleLine(contact);
  const lines = LINES.filter((l) => contact[l.id].trim());

  return (
    <div className="doc">
      <div className="doc-head">
        {photo ? (
          <img className="doc-avatar photo" src={photo} alt="" />
        ) : (
          <span className="doc-avatar">{initials(contact)}</span>
        )}
        <p className={name ? "doc-name" : "doc-name placeholder"}>
          {name || "New contact"}
        </p>
        {role ? <p className="doc-role">{role}</p> : null}
        <p className="doc-intro">
          Point a phone camera at the code below and it opens{" "}
          <b>Add to Contacts</b> instantly.
        </p>
      </div>

      <div className="doc-meta">
        <span className="doc-meta-label">
          Contact card<span>Live preview</span>
        </span>
        <span className="doc-badge">
          {fmt === "vcard" ? "vCard 3.0" : "MECARD"} · {ecc}
        </span>
      </div>

      <div className="qr-stage">
        <QRCanvas
          text={payload}
          ecc={ecc}
          photo={halftone ? photo : null}
          strength={halftone?.strength}
          contrast={halftone?.contrast}
        />
      </div>

      {lines.length > 0 ? (
        <div className="doc-lines">
          {lines.map((l) => (
            <div className={l.full ? "doc-line full" : "doc-line"} key={l.id}>
              <span className="tag">{l.tag}</span>
              <span className="value">{contact[l.id]}</span>
            </div>
          ))}
        </div>
      ) : null}

      <p className="doc-foot">Scan to save this contact</p>
    </div>
  );
}
