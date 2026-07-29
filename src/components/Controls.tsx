import type { Ecc, Format } from "../types";

const FORMATS: Array<{ value: Format; label: string; hint: string }> = [
  { value: "vcard", label: "vCard", hint: "full details" },
  { value: "mecard", label: "MECARD", hint: "smallest code" },
];

const ECC_LEVELS: Ecc[] = ["L", "M", "Q", "H"];

function densityNote(bytes: number): { className: string; text: string } {
  if (bytes < 180) return { className: "size-good", text: "roomy — scans easily" };
  if (bytes < 330)
    return {
      className: "size-warn",
      text: "moderate — fine on screen & normal print",
    };
  return { className: "size-tight", text: "dense — trim fields for small prints" };
}

interface ControlsProps {
  fmt: Format;
  ecc: Ecc;
  bytes: number;
  payload: string;
  onFmtChange: (fmt: Format) => void;
  onEccChange: (ecc: Ecc) => void;
  onDownloadQr: () => void;
  onDownloadCard: () => void;
}

export function Controls({
  fmt,
  ecc,
  bytes,
  payload,
  onFmtChange,
  onEccChange,
  onDownloadQr,
  onDownloadCard,
}: ControlsProps) {
  const density = densityNote(bytes);

  return (
    <section className="panel controls">
      <div className="panel-pad">
        <div className="ctrl-row">
          <span className="ctrl-label">Format</span>
          <div className="segmented" role="group" aria-label="QR data format">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={fmt === f.value ? "seg active" : "seg"}
                aria-pressed={fmt === f.value}
                onClick={() => onFmtChange(f.value)}
              >
                {f.label}
                <small>{f.hint}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="ctrl-row">
          <span className="ctrl-label">
            Error correction <span className="ctrl-note">lower = smaller code</span>
          </span>
          <div className="segmented" role="group" aria-label="Error correction level">
            {ECC_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className={ecc === level ? "seg active" : "seg"}
                aria-pressed={ecc === level}
                onClick={() => onEccChange(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="meta">
          <span>
            Encoded size:{" "}
            <b>
              {bytes} {bytes === 1 ? "byte" : "bytes"}
            </b>
          </span>
          <span className={density.className}>{density.text}</span>
        </div>

        <div className="actions">
          <button className="btn btn-primary" type="button" onClick={onDownloadQr}>
            Download QR (PNG)
          </button>
          <button className="btn btn-secondary" type="button" onClick={onDownloadCard}>
            Download card (PNG)
          </button>
        </div>

        <details className="raw">
          <summary>Show the raw encoded data</summary>
          <pre className="raw-out">{payload}</pre>
        </details>
      </div>
    </section>
  );
}
