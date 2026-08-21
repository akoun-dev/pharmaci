"use client";

import { Mic } from "lucide-react";

interface VoiceModalProps {
  open: boolean;
  onStop: () => void;
}

export function VoiceModal({ open, onStop }: VoiceModalProps) {
  if (!open) return null;

  return (
    <div
      onPointerUp={onStop}
      onTouchEnd={onStop}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="pointer-events-none relative flex flex-col items-center gap-5">
        {/* Ondes concentriques */}
        <div className="relative flex h-32 w-32 items-center justify-center">
          <span className="absolute h-32 w-32 animate-ping rounded-full bg-primary/20" />
          <span className="absolute h-24 w-24 animate-ping rounded-full bg-primary/30 [animation-delay:150ms]" />
          <span className="absolute h-16 w-16 animate-ping rounded-full bg-primary/40 [animation-delay:300ms]" />
          {/* Micro centre */}
          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40">
            <Mic className="h-7 w-7" />
          </div>
        </div>
        <p className="pointer-events-none text-sm font-semibold text-white animate-pulse">
          Écoute en cours...
        </p>
        <p className="pointer-events-none text-xs text-white/60">Relâchez pour arrêter</p>
      </div>
    </div>
  );
}
