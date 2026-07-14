"use client";

/**
 * /m/participant/scan — Mobile QR check-in
 *
 * Mobile-first adaptation of the desktop scan page.
 * Renders inside the mobile shell (app/m/layout.tsx) so the user
 * keeps access to the top bar and bottom nav.
 */

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import type { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { AlertCircle, Camera, CheckCircle2, Loader2, ArrowLeft, QrCode } from "lucide-react";

export default function MobileScanPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    setError(null);
    setSuccess(null);
    try {
      setScanning(true);
      let scanner = scannerRef.current;
      if (!scanner) {
        const { Html5Qrcode } = await import("html5-qrcode");
        scanner = new Html5Qrcode("mobile-reader");
        scannerRef.current = scanner;
      }
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        onScanSuccess,
        undefined,
      );
    } catch (err) {
      console.error(err);
      setError("Camera unavailable. Please grant camera permission and try again.");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
      setScanning(false);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    await stopScanner();
    setCheckingIn(true);

    try {
      const url = new URL(decodedText);
      const parts = url.pathname.split("/");
      const bookingId = parts[parts.length - 1];

      if (!bookingId || url.pathname.indexOf("/api/attendance") === -1) {
        throw new Error("Invalid TrainHub QR Code");
      }

      const res = await fetch(`/api/attendance/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSessionAuth: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to check in");
      }

      setCheckingIn(false);
      setSuccess(data.message || "Checked in successfully!");

      setTimeout(() => {
        router.push("/m/participant");
        router.refresh();
      }, 3000);
    } catch (err: unknown) {
      setCheckingIn(false);
      setError(err instanceof Error ? err.message : "An error occurred while scanning.");
    }
  };

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/m/participant"
          className="grid place-items-center size-9 rounded-full bg-white border border-border shadow-sm"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-[17px] font-bold tracking-tight">Scan QR to Check-In</h1>
          <p className="text-[12px] text-muted-foreground">Point camera at room QR code</p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <AlertCircle className="size-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-rose-800">{error}</p>
            <button
              onClick={() => { setError(null); }}
              className="text-xs text-rose-600 mt-1 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="size-12 text-emerald-600" />
          <p className="text-sm font-bold text-emerald-800">{success}</p>
          <p className="text-xs text-emerald-600">Returning to dashboard…</p>
        </div>
      )}

      {/* Loading state */}
      {checkingIn && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white p-8 text-center">
          <Loader2 className="size-12 text-blue-500 animate-spin" />
          <p className="text-sm font-semibold">Verifying your attendance…</p>
          <p className="text-xs text-muted-foreground">Please wait</p>
        </div>
      )}

      {/* Scanner / idle state */}
      {!success && !checkingIn && (
        <div className="space-y-4">
          {/* Camera viewfinder */}
          <div
            ref={videoRef}
            className="relative w-full rounded-3xl overflow-hidden bg-black aspect-square shadow-lg"
          >
            <div id="mobile-reader" className="absolute inset-0" />

            {/* Overlay corners */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-white/70 rounded-tl-xl" />
              <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-white/70 rounded-tr-xl" />
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-white/70 rounded-bl-xl" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-white/70 rounded-br-xl" />
            </div>

            {/* Idle state overlay */}
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white text-center p-6">
                <QrCode className="size-16 mb-4 opacity-60" />
                <p className="text-sm font-medium opacity-80">Camera is off</p>
                <p className="text-xs opacity-50 mt-1">Tap &ldquo;Start Camera&rdquo; below</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {scanning ? (
            <button
              onClick={stopScanner}
              className="w-full rounded-full border border-border bg-white py-4 text-sm font-bold shadow-sm active:scale-[0.98] transition-transform"
            >
              Cancel Scanning
            </button>
          ) : (
            <button
              onClick={startScanner}
              className="w-full rounded-full bg-[#0ea5e9] py-4 text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Camera className="size-5" />
              Start Camera
            </button>
          )}

          {/* Helper text */}
          <p className="text-center text-xs text-muted-foreground">
            Works offline · QR codes are placed by your trainer in the training room
          </p>
        </div>
      )}
    </div>
  );
}
