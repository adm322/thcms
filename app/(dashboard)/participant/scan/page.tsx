"use client";

import { useEffect, useState, useRef } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Camera, CheckCircle2, Loader2 } from "lucide-react";

export default function ScanQRPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      // ponytail: clean up scanner on unmount if it was running
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
        // ponytail: dynamically import html5-qrcode on client to avoid Next.js SSR crashes
        const { Html5Qrcode } = await import("html5-qrcode");
        scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
      }
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        undefined
      );
    } catch (err) {
      console.error(err);
      setError("Failed to start camera. Please ensure you have granted camera permissions.");
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
    // ponytail: await stopScanner to ensure DOM cleanup finishes before React state changes
    await stopScanner();
    setCheckingIn(true);

    try {
      // The QR code usually contains something like "http://localhost:3000/api/attendance/[id]"
      // We need to extract the [id]
      const url = new URL(decodedText);
      const parts = url.pathname.split("/");
      const bookingId = parts[parts.length - 1];

      if (!bookingId || url.pathname.indexOf("/api/attendance") === -1) {
        throw new Error("Invalid TrainHub QR Code");
      }

      // Submit the check-in request. Since the user is logged in, the session token cookie is automatically sent.
      const res = await fetch(`/api/attendance/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // No body needed if we use session auth
        body: JSON.stringify({ isSessionAuth: true })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to check in");
      }

      // ponytail: set both states together — success banner takes over from the loading spinner
      setCheckingIn(false);
      setSuccess(data.message || "Successfully checked in!");
      
      // Redirect back to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/participant");
        router.refresh();
      }, 3000);

    } catch (err: any) {
      setCheckingIn(false);
      setError(err.message || "An error occurred while scanning.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Scan Class QR Code</CardTitle>
          <CardDescription>
            Point your camera at the QR code displayed by your trainer to mark your attendance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {error && (
            <div className="flex items-center p-4 border rounded-md bg-red-50 text-red-900 border-red-200 gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center p-4 border rounded-md bg-emerald-50 text-emerald-900 border-emerald-200 gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {!success && !checkingIn && (
            <div className="space-y-4">
              <div className="relative w-full min-h-[300px] bg-muted flex items-center justify-center rounded-lg overflow-hidden border">
                {/* ponytail: keep reader completely empty of React children so html5-qrcode can manipulate the DOM without React conflicts */}
                <div id="reader" className="w-full" />
                
                {!scanning && (
                  <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                    <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Camera is off</p>
                  </div>
                )}
              </div>

              {scanning ? (
                <Button variant="outline" className="w-full" onClick={stopScanner}>
                  Cancel Scanning
                </Button>
              ) : (
                <Button className="w-full" onClick={startScanner}>
                  <Camera className="mr-2 h-4 w-4" /> Start Camera
                </Button>
              )}
            </div>
          )}

          {checkingIn && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="font-medium">Verifying your attendance...</p>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
