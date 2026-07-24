"use client";

import { useState, useCallback, useRef } from "react";
import { useAppStore } from "@/lib/store";

interface UseSpeechRecognitionOptions {
  lang?: string;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

/**
 * Hook STT (Speech-to-Text) — Faster-Whisper open-source uniquement.
 * Enregistre l'audio via MediaRecorder, envoie au serveur /api/stt,
 * retourne la transcription.
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { lang = "fr", onResult, onError } = options;
  const [isListening, setIsListening] = useState(false);
  const pushToast = useAppStore((s) => s.pushToast);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSupported =
    typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const startListening = useCallback(async () => {
    if (!isSupported) {
      pushToast("Micro non disponible sur cet appareil.", "error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        pushToast("🎤 Transcription en cours...", "info");

        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("audio", blob, "audio.webm");
          formData.append("lang", lang.split("-")[0]);

          const res = await fetch("/api/stt", { method: "POST", body: formData });
          const data = await res.json();

          if (!res.ok) throw new Error(data.error || "Erreur de transcription");
          if (data.text) onResult?.(data.text);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erreur Whisper";
          pushToast(msg, "error");
          onError?.(msg);
        } finally {
          setIsListening(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
      pushToast("🎤 Parlez maintenant...", "info");

      // Auto-stop après 15 secondes max
      timeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 15_000);
    } catch {
      setIsListening(false);
      pushToast("Accès au micro refusé.", "error");
    }
  }, [isSupported, lang, onResult, onError, pushToast]);

  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsListening(false);
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}
