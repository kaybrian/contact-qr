import { useMemo, useState } from "react";
import type { Contact, Ecc, Format } from "./types";
import { emptyContact, sampleContact } from "./types";
import { buildPayload, byteLength } from "./lib/encoders";
import { downloadQrPng, downloadCardPng } from "./lib/download";
import { ContactForm } from "./components/ContactForm";
import { PreviewCard } from "./components/PreviewCard";
import { Controls } from "./components/Controls";
import { HowTo } from "./components/HowTo";

export default function App() {
  const [contact, setContact] = useState<Contact>(sampleContact);
  const [fmt, setFmt] = useState<Format>("vcard");
  const [ecc, setEcc] = useState<Ecc>("M");

  const payload = useMemo(() => buildPayload(contact, fmt), [contact, fmt]);
  const bytes = useMemo(() => byteLength(payload), [payload]);

  return (
    <div className="wrap">
      <header className="masthead">
        <p className="eyebrow">Contact QR generator</p>
        <h1>One scan, straight into the phone book.</h1>
        <p>
          Fill in a person's details, and the QR encodes them as a vCard. When
          someone points their phone camera at it, the phone recognises the
          contact and opens its <b>Add to Contacts</b> screen — no app, no
          typing.
        </p>
      </header>

      <div className="layout">
        <ContactForm
          contact={contact}
          onChange={setContact}
          onClear={() => setContact(emptyContact)}
        />

        <div className="preview-col">
          <PreviewCard contact={contact} payload={payload} ecc={ecc} />
          <Controls
            fmt={fmt}
            ecc={ecc}
            bytes={bytes}
            payload={payload}
            onFmtChange={setFmt}
            onEccChange={setEcc}
            onDownloadQr={() => void downloadQrPng(payload, ecc, contact)}
            onDownloadCard={() => void downloadCardPng(payload, ecc, contact)}
          />
        </div>
      </div>

      <HowTo />

      <footer className="footer">
        <p>
          Open source under the MIT licence ·{" "}
          <a
            href="https://github.com/kaybrian/contact-qr"
            target="_blank"
            rel="noreferrer"
          >
            View on GitHub
          </a>{" "}
          · Everything runs in your browser — no data leaves this page.
        </p>
      </footer>
    </div>
  );
}
