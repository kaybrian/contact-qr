import type { Contact, Ecc } from "../types";
import { fullName, roleLine } from "../types";
import { QRCanvas } from "./QRCanvas";

interface PreviewCardProps {
  contact: Contact;
  payload: string;
  ecc: Ecc;
}

const LINES: Array<{ tag: string; id: keyof Contact }> = [
  { tag: "Cell", id: "mobile" },
  { tag: "Work", id: "work" },
  { tag: "Mail", id: "email" },
  { tag: "Web", id: "url" },
  { tag: "Addr", id: "address" },
];

export function PreviewCard({ contact, payload, ecc }: PreviewCardProps) {
  const name = fullName(contact);
  const role = roleLine(contact);

  return (
    <div className="card">
      <QRCanvas text={payload} ecc={ecc} />
      <div className="card-info">
        <p className={name ? "card-name" : "card-name placeholder"}>
          {name || "New contact"}
        </p>
        {role ? <p className="card-role">{role}</p> : null}
        <div className="foil-rule" />
        <ul className="card-lines">
          {LINES.filter((l) => contact[l.id].trim()).map((l) => (
            <li key={l.id}>
              <span className="tag">{l.tag}</span>
              <span>{contact[l.id]}</span>
            </li>
          ))}
        </ul>
        <p className="scan-hint">Scan to save this contact</p>
      </div>
    </div>
  );
}
