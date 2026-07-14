"use client";

/**
 * /m/hr/bookings/[id] — Show QR for attendance
 *
 * Client component: dynamically imports `qrcode` (browser-only) and renders
 * the attendance URL as a scannable QR inside a modal overlay.
 */

import { useState, useRef, useEffect } from "react";
import { QrCode, X } from "lucide-react";

export function ShowQRButton({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && canvasRef.current && typeof window !== "undefined") {
      const url = `${window.location.origin}/api/attendance/${bookingId}`;
      import("qrcode").then(({ default: QRCode }) => {
        QRCode.toCanvas(canvasRef.current!, url, {
          width: 220,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
        }).catch(console.error);
      });
    }
  }, [open, bookingId]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand)] py-3.5 text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-transform"
      >
        <QrCode className="size-4" />
        Show QR for attendance
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.55)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 grid place-items-center size-9 rounded-full bg-slate-100 text-slate-600"
            >
              <X className="size-4" />
            </button>
            <h3 className="text-sm font-bold text-slate-900">
              Trainer scans this
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Each participant scans to mark attendance
            </p>
            <div className="mt-4 inline-block rounded-2xl border border-slate-200 p-3">
              <canvas ref={canvasRef} width={220} height={220} />
            </div>
            <p className="text-[11px] text-slate-500 mt-3 break-all">
              /api/attendance/{bookingId}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
