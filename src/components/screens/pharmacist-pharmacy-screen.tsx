"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Clock, MapPin, Phone, Star } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface PharmacyData {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string | null;
  latitude: number;
  longitude: number;
  phone: string;
  email: string | null;
  openingTime: string;
  closingTime: string;
  isOpen24h: boolean;
  isOnGuard: boolean;
  isVerified: boolean;
  services: string;
  payments: string;
  rating: number;
  reviewCount: number;
  _count: { medications: number; orders: number; reviews: number };
}

export function PharmacistPharmacyScreen() {
  const goBack = useAppStore((s) => s.goBack);
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [openingTime, setOpeningTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("20:00");
  const [isOpen24h, setIsOpen24h] = useState(false);
  const [isOnGuard, setIsOnGuard] = useState(false);

  useEffect(() => {
    void loadPharmacy();
  }, []);

  async function loadPharmacy() {
    setLoading(true);
    try {
      const res = await api.get<{ pharmacy: PharmacyData }>("/api/pharmacist/pharmacy");
      const p = res.pharmacy;
      setPharmacy(p);
      setName(p.name);
      setAddress(p.address);
      setCity(p.city);
      setDistrict(p.district || "");
      setPhone(p.phone);
      setEmail(p.email || "");
      setOpeningTime(p.openingTime);
      setClosingTime(p.closingTime);
      setIsOpen24h(p.isOpen24h);
      setIsOnGuard(p.isOnGuard);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put("/api/pharmacist/pharmacy", {
        name,
        address,
        city,
        district: district || null,
        phone,
        email: email || null,
        openingTime,
        closingTime,
        isOpen24h,
        isOnGuard,
      });
      useAppStore.getState().pushToast("Pharmacie mise à jour", "success");
    } catch (err) {
      useAppStore.getState().pushToast(
        err instanceof Error ? err.message : "Erreur",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Ma Pharmacie" showBack />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {pharmacy && (
          <>
            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-2 py-4">
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-lg font-bold">{pharmacy._count.medications}</p>
                <p className="text-[10px] text-muted-foreground">Médicaments</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-lg font-bold">{pharmacy._count.orders}</p>
                <p className="text-[10px] text-muted-foreground">Commandes</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <p className="text-lg font-bold">{pharmacy.rating}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">{pharmacy.reviewCount} avis</p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nom</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Adresse</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Ville</label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Quartier</label>
                  <Input value={district} onChange={(e) => setDistrict(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Téléphone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
              </div>

              {/* Hours */}
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                  <Clock className="h-3 w-3" /> Horaires
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground">Ouverture</label>
                    <Input
                      type="time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="mt-1"
                      disabled={isOpen24h}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">Fermeture</label>
                    <Input
                      type="time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="mt-1"
                      disabled={isOpen24h}
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 rounded-xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Ouvert 24h/24</p>
                    <p className="text-xs text-muted-foreground">Pharmacie ouverte en permanence</p>
                  </div>
                  <Switch checked={isOpen24h} onCheckedChange={setIsOpen24h} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Pharmacie de garde</p>
                    <p className="text-xs text-muted-foreground">Visible dans les gardes</p>
                  </div>
                  <Switch checked={isOnGuard} onCheckedChange={setIsOnGuard} />
                </div>
              </div>

              {/* Info badges */}
              {pharmacy.services && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Services</label>
                  <div className="flex flex-wrap gap-1">
                    {pharmacy.services.split(",").filter(Boolean).map((s) => (
                      <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {pharmacy.payments && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Paiements</label>
                  <div className="flex flex-wrap gap-1">
                    {pharmacy.payments.split(",").filter(Boolean).map((p) => (
                      <span key={p} className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600">
                        {p.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={() => void handleSave()} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Enregistrer
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
