"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, Keyboard, X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QrScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const rafRef = useRef<number>(0);
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (mode === "camera") {
      startCamera();
    }
    return () => stopCamera();
  }, [mode]);

  async function startCamera() {
    setCameraError(null);
    setScanning(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        scanLoop();
      }
    } catch {
      setCameraError("Accès caméra refusé. Utilisez la saisie manuelle.");
      setMode("manual");
    }
  }

  async function scanLoop() {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    try {
      if (!detectorRef.current) {
        if ("BarcodeDetector" in window) {
          detectorRef.current = new BarcodeDetector({ formats: ["qr_code"] });
        } else {
          setCameraError("BarcodeDetector non supporté. Utilisez la saisie manuelle.");
          setMode("manual");
          return;
        }
      }

      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (barcodes.length > 0) {
        const value = barcodes[0].rawValue;
        stopCamera();
        onScan(value);
        return;
      }
    } catch {
      // ignore detection errors, keep trying
    }

    rafRef.current = requestAnimationFrame(scanLoop);
  }

  function handleManualSubmit() {
    const trimmed = manualCode.trim();
    if (trimmed.length >= 4) {
      onScan(trimmed);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between bg-black/80 px-4 py-3 safe-area-top">
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-semibold text-white">
          {mode === "camera" ? "Scanner le QR code" : "Saisie manuelle"}
        </h2>
        <button
          onClick={() => {
            stopCamera();
            setMode(mode === "camera" ? "manual" : "camera");
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
        >
          {mode === "camera" ? <Keyboard className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
        </button>
      </div>

      {mode === "camera" ? (
        <>
          {/* Camera view */}
          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-56 w-56">
                {/* Corner brackets */}
                <div className="absolute left-0 top-0 h-6 w-6 border-t-2 border-l-2 border-white rounded-tl-md" />
                <div className="absolute right-0 top-0 h-6 w-6 border-t-2 border-r-2 border-white rounded-tr-md" />
                <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-white rounded-bl-md" />
                <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-white rounded-br-md" />

                {/* Scanning line animation */}
                {scanning && (
                  <div className="absolute left-2 right-2 h-0.5 bg-primary shadow-[0_0_8px_rgba(22,163,74,0.6)] animate-scan-line" />
                )}
              </div>
            </div>

            {/* Status message */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-3 text-center">
              {cameraError ? (
                <div className="flex items-center justify-center gap-2 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  {cameraError}
                </div>
              ) : scanning ? (
                <div className="flex items-center justify-center gap-2 text-sm text-white/90">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Alignez le QR code dans le cadre
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm text-white/90">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Démarrage de la caméra...
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Manual entry mode */
        <div className="flex flex-1 flex-col items-center justify-center bg-black px-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <Keyboard className="h-8 w-8 text-white/70" />
          </div>
          <p className="mb-6 text-center text-sm text-white/70">
            Saisissez le code de la commande (ex: PHARMACI-ABC123)
          </p>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            placeholder="PHARMACI-XXXX"
            autoFocus
            className={cn(
              "w-full max-w-xs rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-lg font-mono font-bold text-white placeholder-white/30 outline-none transition-colors",
              "focus:border-primary focus:ring-1 focus:ring-primary"
            )}
          />
          <button
            onClick={handleManualSubmit}
            disabled={manualCode.trim().length < 4}
            className="mt-4 w-full max-w-xs rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            Rechercher la commande
          </button>
        </div>
      )}
    </div>
  );
}
