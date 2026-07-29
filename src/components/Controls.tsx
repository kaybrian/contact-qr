import type { Ecc, Format } from "../types";

const FORMATS: Array<{ value: Format; label: string; hint: string }> = [
  { value: "vcard", label: "vCard", hint: "full details" },
  { value: "mecard", label: "MECARD", hint: "smallest code" },
];

const ECC_LEVELS: Ecc[] = ["L", "M", "Q", "H"];

function densityNote(bytes: number): { className: string; text: string } {
  if (bytes < 180) return { className: "size-good", text: "scans easily" };
  if (bytes < 330)
    return { className: "size-warn", text: "fine on screen and normal print" };
  return { className: "size-tight", text: "dense, trim fields for small prints" };
}

interface ControlsProps {
  fmt: Format;
  ecc: Ecc;
  bytes: number;
  payload: string;
  onFmtChange: (fmt: Format) => void;
  onEccChange: (ecc: Ecc) => void;
}

export function Controls({
  fmt,
  ecc,
  bytes,
  payload,
  onFmtChange,
  onEccChange,
}: ControlsProps) {
  const density = densityNote(bytes);

  return (
    <section className="settings">
      <h2 className="settings-title">QR settings</h2>

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
          Error correction
          <span className="ctrl-note">lower makes a smaller code</span>
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

      <div className={`status-row ${density.className}`}>
        <span className="status-dot" />
        <span>
          <b>
            {bytes} {bytes === 1 ? "byte" : "bytes"}
          </b>{" "}
          encoded, {density.text}
        </span>
      </div>

      <details className="raw">
        <summary>View encoded data</summary>
        <pre className="raw-out">{payload}</pre>
      </details>

      <details className="tips">
        <summary>Tips for scannable codes</summary>
        <ul>
          <li>
            Fewer fields and lower error correction make a simpler grid that
            scans reliably even when printed small.
          </li>
          <li>
            MECARD makes the tightest code but cannot carry a company or job
            title. Use vCard when those matter.
          </li>
          <li>
            Use full international phone format, like +250 788 000 000, so the
            contact works from any country.
          </li>
        </ul>
      </details>
    </section>
  );
}
