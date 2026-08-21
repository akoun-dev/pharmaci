"use client";

import { useEffect, useState } from "react";
import { Building2, Camera, Loader2, MapPin, Phone, Mail, Clock, Save } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string | null;
  phone: string;
  email: string | null;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  openTime: string | null;
  closeTime: string | null;
  open24h: boolean;
  isOnGuard: boolean;
  isVerified: boolean;
}

export default function PharmacistPharmacyPage() {
  const pushToast = useAppStore((s) => s.pushToast);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ pharmacy: Pharmacy }>("/api/pharmacist/pharmacy");
      setPharmacy(res.pharmacy);
    } catch {
      pushToast("Erreur de chargement.", "error");
    } finally {
      setLoading(false);
    }
  }

  function update(field: string, value: string | boolean | number | null) {
    if (!pharmacy) return;
    setPharmacy({ ...pharmacy, [field]: value });
  }

  async function handleSave() {
    if (!pharmacy) return;
    setSaving(true);
    try {
      await api.put("/api/pharmacist/pharmacy", {
        name: pharmacy.name,
        address: pharmacy.address,
        city: pharmacy.city,
        district: pharmacy.district,
        phone: pharmacy.phone,
        email: pharmacy.email,
        latitude: pharmacy.latitude,
        longitude: pharmacy.longitude,
        openTime: pharmacy.openTime,
        closeTime: pharmacy.closeTime,
        open24h: pharmacy.open24h,
        isOnGuard: pharmacy.isOnGuard,
      });
      pushToast("Pharmacie mise a jour.", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!pharmacy) return <p className="text-muted-foreground text-center py-20">Erreur de chargement.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ma Pharmacie</h1>
          <p className="text-sm text-muted-foreground">{pharmacy.isVerified ? "Verifiee" : "Non verifiee"}</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
          Enregistrer
        </Button>
      </div>

      {/* Photo */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-muted">
              {pharmacy.imageUrl ? (
                <img src={pharmacy.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Building2 className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{pharmacy.name}</p>
              <p className="text-xs text-muted-foreground">{pharmacy.address}, {pharmacy.city}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Infos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">NOM</label>
            <Input value={pharmacy.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">ADRESSE</label>
              <Input value={pharmacy.address} onChange={(e) => update("address", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">VILLE</label>
              <Input value={pharmacy.city} onChange={(e) => update("city", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">TELEPHONE</label>
              <Input value={pharmacy.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">EMAIL</label>
              <Input value={pharmacy.email || ""} onChange={(e) => update("email", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">LATITUDE</label>
              <Input type="number" step="any" value={pharmacy.latitude} onChange={(e) => update("latitude", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">LONGITUDE</label>
              <Input type="number" step="any" value={pharmacy.longitude} onChange={(e) => update("longitude", parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horaires */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Horaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Ouvert 24h/24</label>
            <button
              onClick={() => update("open24h", !pharmacy.open24h)}
              className={cn("relative h-6 w-11 rounded-full transition-colors", pharmacy.open24h ? "bg-primary" : "bg-muted")}
            >
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", pharmacy.open24h ? "left-[22px]" : "left-0.5")} />
            </button>
          </div>
          {!pharmacy.open24h && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">OUVERTURE</label>
                <Input type="time" value={pharmacy.openTime || ""} onChange={(e) => update("openTime", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">FERMETURE</label>
                <Input type="time" value={pharmacy.closeTime || ""} onChange={(e) => update("closeTime", e.target.value)} />
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Pharmacie de garde</label>
            <button
              onClick={() => update("isOnGuard", !pharmacy.isOnGuard)}
              className={cn("relative h-6 w-11 rounded-full transition-colors", pharmacy.isOnGuard ? "bg-primary" : "bg-muted")}
            >
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", pharmacy.isOnGuard ? "left-[22px]" : "left-0.5")} />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
