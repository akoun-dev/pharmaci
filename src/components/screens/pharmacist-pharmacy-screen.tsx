"use client";

import { useEffect, useState, useRef } from "react";
import {
  Loader2, Save, Clock, MapPin, Phone, Star, Camera,
  Syringe, ShieldCheck, Truck, CreditCard, DollarSign,
} from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
  imageUrl: string | null;
  services: string;
  payments: string;
  rating: number;
  reviewCount: number;
  _count: { medications: number; orders: number; reviews: number };
}

const SERVICE_OPTIONS = [
  { value: "vaccination", label: "Vaccination", icon: Syringe },
  { value: "conseil", label: "Conseil", icon: ShieldCheck },
  { value: "livraison", label: "Livraison", icon: Truck },
  { value: "tiers_payant", label: "Tiers-Payant", icon: CreditCard },
  { value: "pression", label: "Tension", icon: ShieldCheck },
  { value: "piqure", label: "Piqûre", icon: Syringe },
  { value: "test", label: "Tests", icon: ShieldCheck },
  { value: "orthopedie", label: "Orthopédie", icon: ShieldCheck },
];

const PAYMENT_OPTIONS = [
  { value: "mobile_money", label: "Mobile Money", icon: Phone },
  { value: "cash", label: "Espèces", icon: DollarSign },
  { value: "card", label: "Carte bancaire", icon: CreditCard },
  { value: "wave", label: "Wave", icon: Phone },
  { value: "orange_money", label: "Orange Money", icon: Phone },
  { value: "mtn_money", label: "MTN Money", icon: Phone },
  { value: "moov", label: "Moov Money", icon: Phone },
];

export function PharmacistPharmacyScreen() {
  const goBack = useAppStore((s) => s.goBack);
  const pushToast = useAppStore((s) => s.pushToast);
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [openingTime, setOpeningTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("20:00");
  const [isOpen24h, setIsOpen24h] = useState(false);
  const [isOnGuard, setIsOnGuard] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
      setLatitude(String(p.latitude));
      setLongitude(String(p.longitude));
      setOpeningTime(p.openingTime);
      setClosingTime(p.closingTime);
      setIsOpen24h(p.isOpen24h);
      setIsOnGuard(p.isOnGuard);
      setSelectedServices(p.services ? p.services.split(",").map((s) => s.trim()).filter(Boolean) : []);
      setSelectedPayments(p.payments ? p.payments.split(",").map((s) => s.trim()).filter(Boolean) : []);
      setImagePreview(p.imageUrl);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      pushToast("Veuillez sélectionner une image.", "error");
      return;
    }
    setUploadingImage(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setImagePreview(base64);
      pushToast("Image chargée. Enregistrez pour confirmer.", "info");
    } catch {
      pushToast("Erreur lors du chargement de l'image.", "error");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function toggleService(val: string) {
    setSelectedServices((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    );
  }

  function togglePayment(val: string) {
    setSelectedPayments((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        name,
        address,
        city,
        district: district || null,
        phone,
        email: email || null,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        openingTime,
        closingTime,
        isOpen24h,
        isOnGuard,
        services: selectedServices.join(","),
        payments: selectedPayments.join(","),
      };
      if (imagePreview && imagePreview.startsWith("data:")) {
        data.imageUrl = imagePreview;
      }

      await api.put("/api/pharmacist/pharmacy", data);
      pushToast("Pharmacie mise à jour avec succès !", "success");
      void loadPharmacy();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur", "error");
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

            {/* Photo upload */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-24 w-24 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-primary/40 bg-muted/30 transition-colors hover:border-primary/70"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Pharmacie" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Camera className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  aria-label="Changer la photo"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Photo de la pharmacie</p>
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

              {/* GPS coordinates */}
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                  <MapPin className="h-3 w-3" /> Coordonnées GPS
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground">Latitude</label>
                    <Input
                      type="number" step="0.000001"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="mt-1"
                      placeholder="5.345678"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">Longitude</label>
                    <Input
                      type="number" step="0.000001"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="mt-1"
                      placeholder="-4.012345"
                    />
                  </div>
                </div>
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

              {/* Services - editable chips */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Services proposés</label>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICE_OPTIONS.map((svc) => {
                    const active = selectedServices.includes(svc.value);
                    const Icon = svc.icon;
                    return (
                      <button
                        key={svc.value}
                        type="button"
                        onClick={() => toggleService(svc.value)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {svc.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payments - editable chips */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Moyens de paiement</label>
                <div className="flex flex-wrap gap-1.5">
                  {PAYMENT_OPTIONS.map((pay) => {
                    const active = selectedPayments.includes(pay.value);
                    const Icon = pay.icon;
                    return (
                      <button
                        key={pay.value}
                        type="button"
                        onClick={() => togglePayment(pay.value)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                          active
                            ? "border-blue-500 bg-blue-500/10 text-blue-700"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {pay.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button onClick={() => void handleSave()} disabled={saving} className="w-full h-11">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer les modifications
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
