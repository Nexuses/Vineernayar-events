"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ScanResult = {
  success: true;
  registration: {
    eventId: string;
    firstName: string;
    surname: string;
    email: string;
    eventName: string;
    uniqueCode: string;
    participationStatus: string;
  };
};

async function markAttended(code: string): Promise<ScanResult | { error: string }> {
  const res = await fetch("/api/admin/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: code.trim().toUpperCase() }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error || "Failed" };
  return data as ScanResult;
}

export function ScanSection() {
  const [manualCode, setManualCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [lastAttendee, setLastAttendee] = useState<ScanResult["registration"] | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [barcodeSupported, setBarcodeSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSubmit = useCallback(async (code: string) => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setStatus("loading");
    setMessage("");
    const result = await markAttended(c);
    if ("error" in result) {
      setStatus("error");
      setMessage(result.error);
      setLastAttendee(null);
    } else {
      setStatus("success");
      setMessage("Marked as attended");
      setLastAttendee(result.registration);
      setManualCode("");
    }
  }, []);

  const onManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(manualCode);
  };

  useEffect(() => {
    const hasBarcode =
      typeof window !== "undefined" &&
      "BarcodeDetector" in window &&
      typeof (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector === "function";
    setBarcodeSupported(!!hasBarcode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const startCamera = useCallback(async () => {
    if (!barcodeSupported) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Camera not available. Use HTTPS or localhost.");
      setStatus("error");
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    try {
      setMessage("");
      setStatus("idle");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }).catch(async () => {
        return navigator.mediaDevices.getUserMedia({ video: true });
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      setCameraActive(true);

      const BarcodeDetector = (window as unknown as { BarcodeDetector: new () => { detect: (src: ImageBitmapSource) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
      const detector = new BarcodeDetector();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      scanIntervalRef.current = setInterval(async () => {
        const v = videoRef.current;
        if (!v || v.readyState !== v.HAVE_ENOUGH_DATA) return;
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        ctx.drawImage(v, 0, 0);
        try {
          const codes = await detector.detect(canvas);
          const qr = codes.find((c) => c.rawValue);
          if (qr?.rawValue) {
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current);
              scanIntervalRef.current = null;
            }
            setCameraActive(false);
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((t) => t.stop());
              streamRef.current = null;
            }
            await handleSubmit(qr.rawValue);
          }
        } catch {
          // ignore single-frame errors
        }
      }, 300);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access denied or unavailable";
      setMessage(msg);
      setStatus("error");
    }
  }, [barcodeSupported, handleSubmit]);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  return (
    <div className="mt-6 space-y-8">
      {/* Manual code entry */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">
          Enter pass code
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Type the code shown on the attendee&apos;s pass (or below the QR) and mark as attended.
        </p>
        <form onSubmit={onManualSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="w-full sm:min-w-[200px] sm:flex-1">
            <span className="sr-only">Pass code</span>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="e.g. F4VJEUHOA707"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-500"
              maxLength={20}
              autoComplete="off"
            />
          </label>
          <button
            type="submit"
            disabled={status === "loading" || !manualCode.trim()}
            className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-brand-700 disabled:opacity-50 disabled:pointer-events-none sm:w-auto"
          >
            {status === "loading" ? "Checking…" : "Mark attended"}
          </button>
        </form>
      </section>

      {/* Camera scan */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">
          Scan QR code
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Use your device camera to scan the pass QR. The attendee will be marked as attended automatically.
        </p>
        {!barcodeSupported && (
          <p className="mt-3 text-sm text-amber-600">
            QR scanning is not supported in this browser. Use Chrome or Edge, or enter the code above.
          </p>
        )}
        {barcodeSupported && (
          <div className="mt-4">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`block w-full max-w-sm mx-auto rounded-lg border-2 border-brand-500 bg-zinc-900 object-cover sm:max-w-none ${cameraActive ? "max-h-[280px] sm:max-h-[320px]" : "hidden"}`}
            />
            {!cameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="mt-2 rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Start camera
              </button>
            ) : (
              <div className="mt-2 space-y-2">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-md bg-zinc-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-500"
                >
                  Stop camera
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Status / result */}
      {(status === "success" || status === "error" || message) && (
        <div
          className={`rounded-lg border p-4 ${
            status === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : status === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-zinc-200 bg-zinc-50 text-zinc-800"
          }`}
        >
          <p className="font-medium">{message}</p>
          {lastAttendee && (
            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <p>
                {lastAttendee.firstName} {lastAttendee.surname} – {lastAttendee.eventName}
              </p>
              <a
                href={`/events/${lastAttendee.eventId}/pass/${lastAttendee.uniqueCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
              >
                Print Pass
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
