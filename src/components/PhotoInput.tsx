import { useId, useRef, useState } from "react";

/** Longest edge kept in memory. Plenty for a 231px halftone grid and an avatar. */
const MAX_EDGE = 512;
const MAX_FILE_BYTES = 12 * 1024 * 1024;

interface PhotoInputProps {
  photo: string | null;
  onChange: (photo: string | null) => void;
}

/** Square-crops, downscales, and re-encodes to a data URL. Never leaves the page. */
async function normalise(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("That file could not be read as an image."));
      img.src = url;
    });

    const side = Math.min(img.width, img.height);
    const edge = Math.min(MAX_EDGE, side);
    const canvas = document.createElement("canvas");
    canvas.width = edge;
    canvas.height = edge;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable in this browser.");

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, edge, edge);
    ctx.drawImage(
      img,
      (img.width - side) / 2,
      (img.height - side) / 2,
      side,
      side,
      0,
      0,
      edge,
      edge,
    );
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function PhotoInput({ photo, onChange }: PhotoInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("That image is over 12 MB — please pick a smaller one.");
      return;
    }
    try {
      onChange(await normalise(file));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that image.");
    }
  };

  return (
    <div className="photo-field">
      <span className="ctrl-label">
        Photo
        <span className="ctrl-note">optional, stays on your device</span>
      </span>

      <div
        className={dragging ? "photo-drop dragging" : "photo-drop"}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void accept(e.dataTransfer.files[0]);
        }}
      >
        {photo ? (
          <img className="photo-thumb" src={photo} alt="Selected contact photo" />
        ) : (
          <span className="photo-thumb empty" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm0 1.5c-2.2 0-4 1.2-4 2.7v.55c0 .14.11.25.25.25h7.5a.25.25 0 0 0 .25-.25v-.55c0-1.5-1.8-2.7-4-2.7z" />
            </svg>
          </span>
        )}

        <div className="photo-copy">
          <label className="btn-secondary" htmlFor={inputId}>
            {photo ? "Replace photo" : "Choose photo"}
          </label>
          <input
            id={inputId}
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept="image/*"
            onChange={(e) => {
              void accept(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <p className="photo-hint">
            {photo ? "Used for the card and the photo QR." : "Or drag an image here."}
          </p>
        </div>

        {photo ? (
          <button
            className="btn-link"
            type="button"
            onClick={() => {
              onChange(null);
              setError(null);
              inputRef.current?.focus();
            }}
          >
            Remove
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="photo-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
