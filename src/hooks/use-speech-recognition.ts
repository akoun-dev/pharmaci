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
  mode: "browser" | "server" | null;
  startListening: () => void;
  stopListening: () => void;
}

/**
 * Hook STT (Speech-to-Text) avec double engine :
 * 1. Web Speech API (browser, gratuit, instant)
 * 2. Faster-Whisper serveur (open-source, précis, fallback)
 *
 * Le mode serveur est activé automatiquement si le navigateur
 * ne supporte pas la Web Speech API.
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { lang = "fr-FR", onResult, onError } = options;
  const [isListening, setIsListening] = useState(false);
  const [mode, setMode] = useState<"browser" | "server" | null>(null);
  const pushToast = useAppStore((s) => s.pushToast);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isBrowserSupported =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  const startListening = useCallback(async () => {
    // Mode 1 : Web Speech API (browser)
    if (isBrowserSupported) {
      startBrowserRecognition();
      return;
    }

    // Mode 2 : Enregistrement audio → Whisper serveur
    startServerRecognition();
  }, [isBrowserSupported, lang, onResult, onError, pushToast]);

  function startBrowserRecognition() {
    try {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setMode("browser");
        pushToast("🎤 Parlez maintenant...", "info");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult?.(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setMode(null);
        if (event.error === "no-speech") {
          pushToast("Aucune parole détectée.", "error");
        } else if (event.error === "not-allowed") {
          // Fallback vers le mode serveur
          pushToast("Micro refusé, basculement sur Whisper...", "info");
          startServerRecognition();
        } else {
          pushToast(`Erreur: ${event.error}`, "error");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setMode(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setMode(null);
      pushToast("Erreur de reconnaissance vocale.", "error");
    }
  }

  async function startServerRecognition() {
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
        setIsListening(true);
        setMode("server");
        pushToast("🎤 Écoute en cours (Whisper)...", "info");

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
          setMode(null);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      // Auto-stop après 15 secondes
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 15_000);
    } catch (err) {
      setIsListening(false);
      setMode(null);
      const msg = "Accès au micro refusé.";
      pushToast(msg, "error");
      onError?.(msg);
    }
  }

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsListening(false);
    setMode(null);
  }, []);

  return { isListening, isSupported: isBrowserSupported || !!navigator.mediaDevices, mode, startListening, stopListening };
}
