import type { Contact } from "../types";

interface FieldDef {
  id: keyof Contact;
  label: string;
  placeholder: string;
  full?: boolean;
  multiline?: boolean;
}

const FIELDS: FieldDef[] = [
  { id: "first", label: "First name", placeholder: "Amara" },
  { id: "last", label: "Last name", placeholder: "Okoye" },
  { id: "org", label: "Company / organisation", placeholder: "InversePay" },
  { id: "title", label: "Job title", placeholder: "Partnerships Lead" },
  { id: "mobile", label: "Mobile", placeholder: "+250 788 000 000" },
  { id: "work", label: "Work phone", placeholder: "+250 788 000 001" },
  { id: "email", label: "Email", placeholder: "amara@inversepay.com" },
  { id: "url", label: "Website", placeholder: "inversepay.com" },
  { id: "address", label: "Address", placeholder: "Kigali, Rwanda", full: true },
  {
    id: "note",
    label: "Note",
    placeholder: "Anything extra, like a department or the best time to call",
    full: true,
    multiline: true,
  },
];

interface ContactFormProps {
  contact: Contact;
  onChange: (contact: Contact) => void;
}

export function ContactForm({ contact, onChange }: ContactFormProps) {
  const set = (id: keyof Contact, value: string) =>
    onChange({ ...contact, [id]: value });

  return (
    <div className="field-grid">
      {FIELDS.map((f) => (
        <div className={f.full ? "field full" : "field"} key={f.id}>
          <label htmlFor={f.id}>{f.label}</label>
          {f.multiline ? (
            <textarea
              id={f.id}
              placeholder={f.placeholder}
              value={contact[f.id]}
              onChange={(e) => set(f.id, e.target.value)}
            />
          ) : (
            <input
              id={f.id}
              type="text"
              autoComplete="off"
              placeholder={f.placeholder}
              value={contact[f.id]}
              onChange={(e) => set(f.id, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
