"use client";

import { useState } from "react";
import {
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  X,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";

type Step = "email" | "code" | "password" | "success";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const pushToast = useAppStore((s) => s.pushToast);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode() {
    if (!email.includes("@")) {
      setError("Veuillez entrer une adresse e-mail valide.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.devCode) {
          setDevCode(data.devCode);
        }
        setStep("code");
      } else {
        setError(data.error || "Une erreur est survenue.");
      }
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (!code.trim()) {
      setError("Veuillez entrer le code de réinitialisation.");
      return;
    }
    // If dev code is known, auto-validate
    if (devCode && code !== devCode) {
      setError("Code incorrect. Vérifiez le code reçu par email.");
      return;
    }
    setError(null);
    setStep("password");
  }

  async function handleResetPassword() {
    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("success");
        pushToast("Mot de passe réinitialisé ! Connectez-vous.", "success");
        setTimeout(onClose, 2000);
      } else {
        setError(data.error || "Erreur lors de la réinitialisation.");
      }
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    if (step === "code") setStep("email");
    else if (step === "password") setStep("code");
    setError(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-card p-6 sm:rounded-3xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step !== "email" && step !== "success" && (
              <button
                onClick={handleBack}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {step === "email" && "Mot de passe oublié"}
                {step === "code" && "Code de vérification"}
                {step === "password" && "Nouveau mot de passe"}
                {step === "success" && "Réinitialisé !"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {step === "email" && "Recevez un code par email"}
                {step === "code" && "Entrez le code reçu par email"}
                {step === "password" && "Choisissez un nouveau mot de passe"}
                {step === "success" && "Vous pouvez maintenant vous connecter"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Steps indicator */}
        {step !== "success" && (
          <div className="mb-5 flex items-center gap-1">
            {["email", "code", "password"].map((s, i) => {
              const stepIdx = ["email", "code", "password"].indexOf(step);
              const isDone = i < stepIdx;
              const isCurrent = i === stepIdx;
              return (
                <div key={s} className="flex flex-1 items-center">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                      isDone
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                        ? "border-2 border-primary bg-primary/10 text-primary"
                        : "border-2 border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  {i < 2 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 ${
                        i < stepIdx ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Step: Email */}
        {step === "email" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                ADRESSE E-MAIL
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="h-11 rounded-xl pl-9"
                  autoFocus
                />
              </div>
            </div>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <Button
              onClick={handleSendCode}
              disabled={loading || !email.includes("@")}
              className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Envoyer le code
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step: Code */}
        {step === "code" && (
          <div className="space-y-4">
            {devCode && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-800">Mode développement</p>
                <p className="mt-1 font-mono text-lg font-bold tracking-widest text-blue-700">
                  {devCode}
                </p>
                <p className="mt-1 text-[11px] text-blue-600">
                  Ce code est affiché car vous êtes en mode développement.
                  En production, il sera envoyé par email.
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                CODE DE RÉINITIALISATION
              </Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  className="h-11 rounded-xl pl-9 text-center font-mono text-lg tracking-widest"
                  maxLength={6}
                  autoFocus
                />
              </div>
            </div>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleSendCode}
                variant="outline"
                disabled={loading}
                className="h-11 flex-1 rounded-xl border-border text-xs font-medium text-muted-foreground"
              >
                Renvoyer le code
              </Button>
              <Button
                onClick={handleVerifyCode}
                disabled={code.length < 4}
                className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Vérifier
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: New Password */}
        {step === "password" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                NOUVEAU MOT DE PASSE
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-xl pl-9"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                CONFIRMER LE MOT DE PASSE
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-xl pl-9"
                />
              </div>
            </div>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <Button
              onClick={handleResetPassword}
              disabled={loading || newPassword.length < 6}
              className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Réinitialiser mon mot de passe
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              Mot de passe réinitialisé !
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
