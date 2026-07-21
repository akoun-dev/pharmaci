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

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { lang = "fr-FR", onResult, onError } = options;
  const [isListening, setIsListening] = useState(false);
  const pushToast = useAppStore((s) => s.pushToast);
  const recognitionRef = useRef<any>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  const startListening = useCallback(() => {
    if (!isSupported) {
      const msg = "Reconnaissance vocale non disponible.";
      pushToast(msg, "error");
      onError?.(msg);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        pushToast("🎤 Parlez maintenant...", "info");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult?.(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        const msg =
          event.error === "no-speech"
            ? "Aucune parole détectée."
            : `Erreur: ${event.error}`;
        pushToast(msg, "error");
        onError?.(msg);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      const msg = "Erreur de reconnaissance vocale.";
      pushToast(msg, "error");
      onError?.(msg);
    }
  }, [isSupported, lang, pushToast, onResult, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}
