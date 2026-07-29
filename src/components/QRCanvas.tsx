import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { Ecc } from "../types";

interface QRCanvasProps {
  text: string;
  ecc: Ecc;
}

export function QRCanvas({ text, ecc }: QRCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    QRCode.toCanvas(canvas, text || " ", {
      errorCorrectionLevel: ecc,
      margin: 2,
      width: 420,
      color: { dark: "#171B24", light: "#FFFFFF" },
    })
      .then(() => {
        if (!cancelled) setError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Too much data for this code — remove a field or lower the error correction.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [text, ecc]);

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
