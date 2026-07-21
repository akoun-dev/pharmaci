"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";

interface UseBarcodeScannerOptions {
  onDetect?: (barcode: string) => void;
  onError?: (error: string) => void;
}

interface UseBarcodeScannerReturn {
  isScanning: boolean;
  isSupported: boolean;
  startScanning: () => void;
  stopScanning: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function useBarcodeScanner(
  options: UseBarcodeScannerOptions = {}
): UseBarcodeScannerReturn {
  const { onDetect, onError } = options;
  const [isScanning, setIsScanning] = useState(false);
  const pushToast = useAppStore((s) => s.pushToast);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const isSupported =
    typeof window !== "undefined" && "BarcodeDetector" in window;

  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    if (!isSupported) {
      const msg =
        "Scan de code-barres non disponible sur ce navigateur. Utilisez un navigateur compatible (Chrome Android).";
      pushToast(msg, "error");
      onError?.(msg);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);

      // Poll for barcode detection every 500ms
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: [
          "qr_code",
          "ean_13",
          "ean_8",
          "code_128",
          "code_39",
          "upc_a",
          "upc_e",
          "codabar",
        ],
      });

      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const barcodes = await barcodeDetector.detect(canvas);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            stopScanning();
            onDetect?.(code);
          }
        } catch {
          // ignore detection errors
        }
      }, 500);
    } catch (err) {
      setIsScanning(false);
      const msg =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Accès caméra refusé. Autorisez l'accès dans les paramètres."
          : "Impossible d'accéder à la caméra.";
      pushToast(msg, "error");
      onError?.(msg);
    }
  }, [isSupported, pushToast, onDetect, onError, stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopScanning();
  }, [stopScanning]);

  return {
    isScanning,
    isSupported,
    startScanning,
    stopScanning,
    videoRef,
    canvasRef,
  };
}
