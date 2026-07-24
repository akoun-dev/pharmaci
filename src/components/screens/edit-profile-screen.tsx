"use client";

import { useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Save,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Camera,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function EditProfileScreen() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const goBack = useAppStore((s) => s.goBack);
  const pushToast = useAppStore((s) => s.pushToast);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [city, setCity] = useState(user?.city || "");
  const [district, setDistrict] = useState(user?.district || "");
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      pushToast("Veuillez sélectionner une image.", "error");
      return;
    }
    setUploadingPhoto(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await authApi.updateProfile({ avatarUrl: base64 });
      setUser({ ...user!, ...res.user });
      pushToast("Photo de profil mise à jour.", "success");
    } catch {
      pushToast("Erreur lors de l'upload de la photo.", "error");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    if (name.trim().length < 2) {
      pushToast("Veuillez entrer un nom valide.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.updateProfile({
        name: name.trim(),
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        district: district || undefined,
      });
      setUser({ ...user!, ...res.user });
      pushToast("Profil mis à jour avec succès !", "success");
      goBack();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;
  const initials = user.name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col">
      <AppHeader title="Modifier le Profil" showBack />
      <div className="flex-1 space-y-4 px-4 pt-4 pb-32">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover" />
              ) : (
                <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
              aria-label="Changer la photo"
            >
              {uploadingPhoto ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
          </div>
          <h2 className="mt-3 text-lg font-bold text-foreground">{user.name}</h2>
          <p className="text-sm text-muted-foreground">
            {user.role === "PATIENT" ? "Patient" : user.role === "PHARMACIST" ? "Pharmacien" : "Administrateur"}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground">
              Nom Complet
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
              E-mail
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                value={user.email}
                disabled
                className="h-11 rounded-xl pl-9 bg-muted/50 text-muted-foreground"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              L'email ne peut pas être modifié.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground">
              Numéro de téléphone
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="district" className="text-xs font-semibold text-muted-foreground">
                Quartier
              </Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Cocody"
                  className="h-11 rounded-xl pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-semibold text-muted-foreground">
                Ville
              </Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Abidjan"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-semibold text-muted-foreground">
              Adresse
            </Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rue, immatriculation..."
                className="h-11 rounded-xl pl-9"
              />
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="flex gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
          <p className="text-xs text-green-500/80">
            Vos informations personnelles sont cryptées et ne sont jamais partagées sans votre consentement explicite.
          </p>
        </div>
      </div>

      {/* Sticky save button */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-card p-3">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------- Change Password screen ----------
export function ChangePasswordScreen() {
  const goBack = useAppStore((s) => s.goBack);
  const pushToast = useAppStore((s) => s.pushToast);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (next.length < 6) {
      pushToast("Le nouveau mot de passe doit contenir au moins 6 caractères.", "error");
      return;
    }
    if (next !== confirm) {
      pushToast("Les mots de passe ne correspondent pas.", "error");
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword(current, next);
      pushToast("Mot de passe modifié avec succès !", "success");
      goBack();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <AppHeader title="Changer le mot de passe" showBack />
      <div className="flex-1 space-y-4 px-4 pt-4 pb-32">
        <div className="flex items-center justify-center pt-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-8 w-8" />
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Pour votre sécurité, choisissez un mot de passe fort et unique.
        </p>

        <div className="space-y-3">
          <PasswordInput
            label="Mot de passe actuel"
            value={current}
            onChange={setCurrent}
            show={showCurrent}
            toggle={() => setShowCurrent((v) => !v)}
          />
          <PasswordInput
            label="Nouveau mot de passe"
            value={next}
            onChange={setNext}
            show={showNext}
            toggle={() => setShowNext((v) => !v)}
          />
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Confirmer le nouveau mot de passe
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-border bg-card p-3">
        <Button
          onClick={handleSubmit}
          disabled={loading || !current || !next || !confirm}
          className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Mettre à jour"
          )}
        </Button>
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  toggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="h-11 rounded-xl pl-9 pr-10"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={show ? "Masquer" : "Afficher"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
