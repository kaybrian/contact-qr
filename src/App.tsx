import { useMemo, useState } from "react";
import type { Contact, Ecc, Format } from "./types";
import { emptyContact, sampleContact } from "./types";
import { buildPayload, byteLength } from "./lib/encoders";
import { downloadQrPng, downloadCardPng } from "./lib/download";
import { HALFTONE_DEFAULTS } from "./lib/halftone";
import { ContactForm } from "./components/ContactForm";
import { PhotoInput } from "./components/PhotoInput";
import { PreviewCard } from "./components/PreviewCard";
import { Controls } from "./components/Controls";

const REPO_URL = "https://github.com/kaybrian/contact-qr";

function QrGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M1 1h6v6H1V1zm2 2v2h2V3H3zm6-2h6v6H9V1zm2 2v2h2V3h-2zM1 9h6v6H1V9zm2 2v2h2v-2H3zm8-2h2v2h-2V9zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2z" />
    </svg>
  );
}

function GithubGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export default function App() {
  const [contact, setContact] = useState<Contact>(sampleContact);
  const [fmt, setFmt] = useState<Format>("vcard");
  const [ecc, setEcc] = useState<Ecc>("M");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoQr, setPhotoQr] = useState(true);
  const [strength, setStrength] = useState<number>(HALFTONE_DEFAULTS.strength);
  const [contrast, setContrast] = useState<number>(HALFTONE_DEFAULTS.contrast);

  const payload = useMemo(() => buildPayload(contact, fmt), [contact, fmt]);
  const bytes = useMemo(() => byteLength(payload), [payload]);

  // The halftone needs the error-correction headroom, so it pins ECC to H.
  const halftoneOn = Boolean(photo) && photoQr;
  const activeEcc: Ecc = halftoneOn ? "H" : ecc;
  const photoOpts = halftoneOn ? { photo, strength, contrast } : {};

  return (
    <div className="page">
      <div className="shell">
        <header className="topbar">
          <span className="brand">
            <span className="brand-mark">
              <QrGlyph />
            </span>
            ContactQR
          </span>
          <span className="topbar-divider" />
          <span className="topbar-title">Create contact card</span>
          <div className="topbar-right">
            <a
              className="topbar-link"
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
            >
              <GithubGlyph />
              Star on GitHub
            </a>
          </div>
        </header>

        <div className="body">
          <section className="form-col">
            <h1 className="form-title">Contact details</h1>
            <p className="form-sub">
              Fill in the details and the QR code updates live. One scan opens
              the phone's Add to Contacts screen.
            </p>

            <ContactForm contact={contact} onChange={setContact} />

            <PhotoInput photo={photo} onChange={setPhoto} />

            <Controls
              fmt={fmt}
              ecc={activeEcc}
              bytes={bytes}
              payload={payload}
              hasPhoto={Boolean(photo)}
              photoQr={photoQr}
              strength={strength}
              contrast={contrast}
              onFmtChange={setFmt}
              onEccChange={setEcc}
              onPhotoQrChange={setPhotoQr}
              onStrengthChange={setStrength}
              onContrastChange={setContrast}
            />

            <footer className="form-footer">
              <span className="saved-note">
                Everything runs in your browser. Nothing is uploaded.
              </span>
              <button
                className="btn-link"
                type="button"
                onClick={() => {
                  setContact(emptyContact);
                  setPhoto(null);
                }}
              >
                Clear
              </button>
              <button
                className="btn-primary"
                type="button"
                onClick={() => void downloadQrPng(payload, activeEcc, contact, photoOpts)}
              >
                Download QR
              </button>
            </footer>
          </section>

          <aside className="preview-col">
            <div className="preview-panel">
              <div className="preview-head">
                <span className="preview-title">Preview</span>
                <div className="preview-actions">
                  <button
                    className="chip"
                    type="button"
                    onClick={() => void downloadQrPng(payload, activeEcc, contact, photoOpts)}
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M8 1a.75.75 0 0 1 .75.75v6.44l2.22-2.22a.75.75 0 1 1 1.06 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 0 1 1.06-1.06l2.22 2.22V1.75A.75.75 0 0 1 8 1zM2 11.75a.75.75 0 0 1 1.5 0v1.5h9v-1.5a.75.75 0 0 1 1.5 0v2.25a.75.75 0 0 1-.75.75H2.75a.75.75 0 0 1-.75-.75v-2.25z" />
                    </svg>
                    QR PNG
                  </button>
                  <button
                    className="chip"
                    type="button"
                    onClick={() => void downloadCardPng(payload, activeEcc, contact, photoOpts)}
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M1.75 3A.75.75 0 0 0 1 3.75v8.5c0 .414.336.75.75.75h12.5a.75.75 0 0 0 .75-.75v-8.5A.75.75 0 0 0 14.25 3H1.75zM2.5 4.5h11v7h-11v-7zM4 6.25c0-.414.336-.75.75-.75h2.5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-.75.75h-2.5A.75.75 0 0 1 4 8.75v-2.5zM9.5 6h2.75v1.5H9.5V6zm0 2.5h2.75V10H9.5V8.5z" />
                    </svg>
                    Card PNG
                  </button>
                </div>
              </div>
              <PreviewCard
                contact={contact}
                payload={payload}
                ecc={activeEcc}
                fmt={fmt}
                photo={photo}
                halftone={halftoneOn ? { strength, contrast } : null}
              />
            </div>
          </aside>
        </div>
      </div>

      <p className="page-foot">
        Open source under the MIT licence ·{" "}
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          View on GitHub
        </a>
      </p>
    </div>
  );
}
