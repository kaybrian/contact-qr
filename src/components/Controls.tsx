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
  hasPhoto: boolean;
  photoQr: boolean;
  strength: number;
  contrast: number;
  onFmtChange: (fmt: Format) => void;
  onEccChange: (ecc: Ecc) => void;
  onPhotoQrChange: (on: boolean) => void;
  onStrengthChange: (v: number) => void;
  onContrastChange: (v: number) => void;
}

export function Controls({
  fmt,
  ecc,
  bytes,
  payload,
  hasPhoto,
  photoQr,
  strength,
  contrast,
  onFmtChange,
  onEccChange,
  onPhotoQrChange,
  onStrengthChange,
  onContrastChange,
}: ControlsProps) {
  const density = densityNote(bytes);
  const halftoneOn = hasPhoto && photoQr;

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
          <span className="ctrl-note">
            {halftoneOn ? "fixed at H for the photo QR" : "lower makes a smaller code"}
          </span>
        </span>
        <div className="segmented" role="group" aria-label="Error correction level">
          {ECC_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              className={ecc === level ? "seg active" : "seg"}
              aria-pressed={ecc === level}
              disabled={halftoneOn}
              onClick={() => onEccChange(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="ctrl-row">
        <span className="ctrl-label">
          Photo QR
          <span className="ctrl-note">
            {hasPhoto
              ? "draw the photo into the code itself"
              : "add a photo above to enable this"}
          </span>
        </span>
        <label className="switch">
          <input
            type="checkbox"
            checked={halftoneOn}
            disabled={!hasPhoto}
            onChange={(e) => onPhotoQrChange(e.target.checked)}
          />
          <span className="switch-track" aria-hidden="true">
            <span className="switch-thumb" />
          </span>
          <span className="switch-text">{halftoneOn ? "On" : "Off"}</span>
        </label>
      </div>

      {halftoneOn ? (
        <>
          <div className="ctrl-row">
            <label className="ctrl-label" htmlFor="halftone-strength">
              Photo strength
              <span className="ctrl-note">
                higher shows more of the photo, and scans less easily
              </span>
            </label>
            <div className="slider-wrap">
              <input
                id="halftone-strength"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={strength}
                onChange={(e) => onStrengthChange(Number(e.target.value))}
              />
              <output>{Math.round(strength * 100)}%</output>
            </div>
          </div>

          <div className="ctrl-row">
            <label className="ctrl-label" htmlFor="halftone-contrast">
              Photo contrast
              <span className="ctrl-note">punchier photos read better as dots</span>
            </label>
            <div className="slider-wrap">
              <input
                id="halftone-contrast"
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={contrast}
                onChange={(e) => onContrastChange(Number(e.target.value))}
              />
              <output>{contrast.toFixed(1)}×</output>
            </div>
          </div>

          <div className={strength > 0.7 ? "status-row size-tight" : "status-row size-good"}>
            <span className="status-dot" />
            <span>
              {strength > 0.7
                ? "Above 70% the code gets fragile — test it before printing."
                : "Tested to scan reliably at this strength."}
            </span>
          </div>
        </>
      ) : null}

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
          <li>
            A photo QR only changes how the code looks — the photo is not part of
            the contact data, so it will not be saved to the phone book. Show it
            larger than a plain code, and scan-test before printing.
          </li>
        </ul>
      </details>
    </section>
  );
}
