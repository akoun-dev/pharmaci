"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Phone,
  Loader2,
  ChevronLeft,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app/logo";
import { ForgotPasswordModal } from "@/components/app/forgot-password-modal";
import { authApi } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<"PATIENT" | "PHARMACIST">("PATIENT");

  const setUser = useAppStore((s) => s.setUser);
  const setTab = useAppStore((s) => s.setTab);
  const pushToast = useAppStore((s) => s.pushToast);

  function redirectByRole(role: string) {
    if (role === "PHARMACIST") setTab("pharmacist");
    else if (role === "ADMIN") setTab("admin");
    else setTab("home");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { user } = await authApi.login(email, password);
        setUser(user);
        redirectByRole(user.role);
        pushToast(`Bienvenue, ${user.name} !`, "success");
      } else {
        if (name.trim().length < 2) {
          throw new Error("Veuillez entrer votre nom complet");
        }
        if (password.length < 6) {
          throw new Error("Le mot de passe doit contenir au moins 6 caractères");
        }
        const { user } = await authApi.register({
          name: name.trim(),
          email,
          password,
          phone: phone || undefined,
          role: selectedRole,
        });
        setUser(user);
        redirectByRole(user.role);
        pushToast(`Compte créé avec succès !`, "success");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail("patient@pharmaci.ci");
    setPassword("patient123");
    setMode("login");
    setError(null);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Top section with logo */}
      <div className="relative flex flex-col items-center justify-center pt-12 pb-2">
        <button
          onClick={() => useAppStore.getState().setGuestMode(true)}
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          Mode visiteur
        </button>
        <Logo size="lg" />
        <p className="mt-1 text-sm text-muted-foreground">
          Votre santé, à portée de main
        </p>
      </div>

      {/* Card */}
      <div className="flex-1 px-5 pb-8">
        <div className="mx-auto w-full max-w-md rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {mode === "login" ? "Bon retour parmi nous" : "Créer un compte"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === "login"
                ? "Connectez-vous pour accéder à vos médicaments et ordonnances."
                : "Inscrivez-vous pour rechercher médicaments et pharmacies."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground">
                  NOM COMPLET
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aïcha Koné"
                    className="h-11 rounded-xl pl-9"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-semibold text-muted-foreground"
              >
                ADRESSE E-MAIL
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="h-11 rounded-xl pl-9"
                  required
                />
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="phone"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  NUMÉRO DE TÉLÉPHONE (OPTIONNEL)
                </Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+225 07 00 00 00 00"
                    className="h-11 rounded-xl pl-9"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  MOT DE PASSE
                </Label>
                {mode === "login" && (
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-xl pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Se connecter" : "Créer mon compte"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Role selection for registration */}
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                VOUS ÊTES
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("PATIENT")}
                  className={cn(
                    "rounded-xl border p-3 text-center text-sm font-medium transition-all",
                    selectedRole === "PATIENT"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <User className="mx-auto h-5 w-5 mb-1" />
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("PHARMACIST")}
                  className={cn(
                    "rounded-xl border p-3 text-center text-sm font-medium transition-all",
                    selectedRole === "PHARMACIST"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <svg className="mx-auto h-5 w-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" />
                    <path d="M3 7V5a2 2 0 012-2h2" />
                    <path d="M21 7V5a2 2 0 00-2-2h-2" />
                    <rect x="7" y="12" width="10" height="9" rx="1" />
                  </svg>
                  Pharmacien
                </button>
              </div>
            </div>
          )}

          {/* Switch mode */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "Pas encore de compte ? " : "Déjà inscrit ? "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "login" ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </div>
  );
}
