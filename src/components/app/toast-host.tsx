"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ToastHost() {
  const toasts = useAppStore((s) => s.toastQueue);
  const dismiss = useAppStore((s) => s.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    // Toasts with an action (undo) stay visible longer so the user can react
    const timers = toasts.map((t) =>
      setTimeout(() => dismiss(t.id), t.onAction ? 5000 : 3000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon =
          t.type === "success"
            ? CheckCircle2
            : t.type === "error"
            ? XCircle
            : Info;
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3 shadow-lg animate-fade-in-up bg-card text-foreground",
              t.type === "success" && "border-green-600/30 bg-green-600 text-white",
              t.type === "error" && "border-red-600/30 bg-red-600 text-white",
              t.type === "info" && "border-green-700/30 bg-green-700 text-white"
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium leading-snug">{t.message}</p>
              {t.onAction && t.actionLabel && (
                <button
                  onClick={() => {
                    t.onAction?.();
                    dismiss(t.id);
                  }}
                  className="mt-1 text-xs font-bold underline underline-offset-2 hover:opacity-80"
                >
                  {t.actionLabel}
                </button>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
