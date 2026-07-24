"use client";

import { useState, useCallback, useRef } from "react";
import { useAppStore } from "@/lib/store";

interface UseTextToSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
}

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
  speakWithPiper: (text: string) => Promise<void>;
}

/**
 * Hook TTS (Text-to-Speech) avec double engine :
 * 1. Piper (open-source, local, qualité supérieure)
 * 2. Web Speech API (browser, gratuit, fallback)
 */
export function useTextToSpeech(
  options: UseTextToSpeechOptions = {}
): UseTextToSpeechReturn {
  const { lang = "fr-FR", rate = 1.0, pitch = 1.0 } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const pushToast = useAppStore((s) => s.pushToast);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // Mode 1 : Web Speech API (browser, instant, gratuit)
  const speak = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      stop();

      if (!("speechSynthesis" in window)) {
        // Fallback : utiliser Piper via le serveur
        void speakWithPiper(text);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [lang, rate, pitch, stop]
  );

  // Mode 2 : Piper TTS (open-source, serveur local)
  const speakWithPiper = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      stop();

      try {
        setIsSpeaking(true);
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, lang: lang.split("-")[0] }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Erreur TTS");
        }

        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          audio.onerror = (e) => {
            URL.revokeObjectURL(audioUrl);
            reject(e);
          };
          audio.play();
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const msg = err instanceof Error ? err.message : "Erreur Piper TTS";
          pushToast(msg, "error");
        }
      } finally {
        setIsSpeaking(false);
        abortRef.current = null;
      }
    },
    [lang, stop, pushToast]
  );

  return { isSpeaking, speak, stop, speakWithPiper };
}
