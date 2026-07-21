"use client";

import { useEffect, useState, useRef } from "react";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Heart,
  ChevronRight,
  LogOut,
  Edit3,
  Loader2,
  Camera,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { authApi, pharmacyApi, type Pharmacy } from "@/lib/api";
import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

export function ProfileScreen() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const logout = useAppStore((s) => s.logout);
  const navigate = useAppStore((s) => s.navigate);
  const pushToast = useAppStore((s) => s.pushToast);
  const { theme, setTheme } = useTheme();

  const [favorites, setFavorites] = useState<Pharmacy[]>([]);
  const [loadingFav, setLoadingFav] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) void loadFavorites();
  }, [user]);

  async function loadFavorites() {
    setLoadingFav(true);
    try {
      const res = await pharmacyApi.favorites();
      setFavorites(res.pharmacies);
    } catch {
      // ignore
    } finally {
      setLoadingFav(false);
    }
  }

  async function handleLogout() {
    if (!confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) return;
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    logout();
    pushToast("Déconnecté avec succès.", "info");
  }

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
      setUser(res.user);
      pushToast("Photo de profil mise à jour.", "success");
    } catch {
      pushToast("Erreur lors de l'upload de la photo.", "error");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Profil" showCart />
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserIcon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Non connecté</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Connectez-vous pour accéder à votre profil, vos commandes et favoris.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col">
      <AppHeader title="Profil" showCart />

      {/* Profile header */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <Avatar className="h-16 w-16 border-2 border-primary/30">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover" />
              ) : (
                <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90 disabled:opacity-50"
              aria-label="Changer la photo"
            >
              {uploadingPhoto ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-lg font-bold text-foreground">{user.name}</h2>
            <p className="text-xs text-muted-foreground">
              {user.role === "PATIENT"
                ? "Patient"
                : user.role === "PHARMACIST"
                ? "Pharmacien"
                : "Administrateur"}
            </p>
            <Button
              onClick={() => navigate("edit-profile")}
              size="sm"
              className="mt-2 h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Edit3 className="mr-1 h-3.5 w-3.5" />
              Modifier
            </Button>
          </div>
        </div>
      </div>

      {/* Info list */}
      <div className="px-4 pt-4">
        <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase text-muted-foreground">
          Informations
        </h3>
        <div className="divide-y divide-border/60 rounded-2xl border border-border bg-card">
          <InfoRow icon={Mail} label="Email" value={user.email} />
          {user.phone && (
            <InfoRow icon={Phone} label="Téléphone" value={user.phone} />
          )}
          {(user.city || user.district) && (
            <InfoRow
              icon={MapPin}
              label="Localisation"
              value={
                [user.district, user.city].filter(Boolean).join(", ") || "—"
              }
            />
          )}
          {user.address && (
            <InfoRow icon={MapPin} label="Adresse" value={user.address} />
          )}
        </div>
      </div>

      {/* Favorites */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Heart className="h-4 w-4 text-primary" />
            Pharmacies favorites
          </h3>
          <span className="text-xs text-muted-foreground">{favorites.length}</span>
        </div>
        {loadingFav ? (
          <div className="flex h-20 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : favorites.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Aucune pharmacie favorite pour le moment.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {favorites.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate("pharmacy-detail", { id: p.id })}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-2.5 text-left hover:border-primary/40"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {p.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {p.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.address}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dark mode toggle */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </div>
            <span className="text-sm font-medium text-foreground">Mode sombre</span>
          </div>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
          />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Pharmaci v1.0 • Côte d'Ivoire
        </p>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}


