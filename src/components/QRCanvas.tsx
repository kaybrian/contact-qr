import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { Ecc } from "../types";
import { buildHalftone, drawHalftone, photoToGray } from "../lib/halftone";

interface QRCanvasProps {
  text: string;
  ecc: Ecc;
  /** When set, the code is rendered as a halftone of this image. */
  photo?: string | null;
  strength?: number;
  contrast?: number;
}

const TOO_MUCH_DATA =
  "Too much data for this code — remove a field or lower the error correction.";

export function QRCanvas({ text, ecc, photo, strength, contrast }: QRCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    const run = async () => {
      try {
        if (photo) {
          const result = buildHalftone({
            payload: text || " ",
            ecc,
            source: await photoToGray(photo, 512),
            strength,
            contrast,
          });
          if (cancelled) return;
          drawHalftone(canvas, result, { targetPx: 420 });
        } else {
          await QRCode.toCanvas(canvas, text || " ", {
            errorCorrectionLevel: ecc,
            margin: 2,
            width: 420,
            color: { dark: "#171A26", light: "#FFFFFF" },
          });
          if (cancelled) return;
        }
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error && photo ? e.message : TOO_MUCH_DATA);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [text, ecc, photo, strength, contrast]);

  return (
    <div className="qr-holder">
      {error ? (
        <p className="qr-error" role="alert">
          {error}
        </p>
      ) : null}
      <canvas ref={canvasRef} style={error ? { display: "none" } : undefined} />
    </div>
  );
}
