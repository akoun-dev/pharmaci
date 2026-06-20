"use client";

import { useEffect, useState } from "react";
import {
  Pill,
  MapPin,
  ShoppingCart,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  ChevronRight,
  Info,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  medicationApi,
  type Medication,
  type PharmacyWithPrice,
  formatFCFA,
} from "@/lib/api";
import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MedicationDetailScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const params = useAppStore((s) => s.nav.params);
  const addToCart = useAppStore((s) => s.addToCart);
  const pushToast = useAppStore((s) => s.pushToast);

  const [medication, setMedication] = useState<Medication | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacyWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"price" | "rating">("price");

  useEffect(() => {
    if (!params.id) return;
    void load();
  }, [params.id, sort]);

  async function load() {
    setLoading(true);
    try {
      const [medRes, pharmRes] = await Promise.all([
        medicationApi.get(params.id),
        medicationApi.pharmacies(params.id),
      ]);
      setMedication(medRes);
      const enriched = pharmRes.pharmacies
        .filter((p) => p.stock > 0);
      // Sort
      enriched.sort((a, b) =>
        sort === "price" ? a.price - b.price : b.pharmacy.rating - a.pharmacy.rating
      );
      setPharmacies(enriched);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart(p: PharmacyWithPrice) {
    if (!medication) return;
    if (medication.prescriptionRequired) {
      pushToast("Médicament sur ordonnance — présentez-la en pharmacie.", "info");
    }
    addToCart({
      medicationId: medication.id,
      medicationName: medication.name,
      medicationDosage: medication.dosage,
      medicationForm: medication.form,
      pharmacyId: p.pharmacy.id,
      pharmacyName: p.pharmacy.name,
      unitPrice: p.price,
      quantity: 1,
      prescriptionRequired: medication.prescriptionRequired,
    });
    pushToast(`${medication.name} ajouté au panier (${p.pharmacy.name}).`, "success");
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Détail médicament" showBack />
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!medication) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Détail médicament" showBack />
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Médicament introuvable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <AppHeader title={medication.name} showBack />

      {/* Header card */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Pill className="h-8 w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground">{medication.name}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {medication.activeIngredient}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {medication.category}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {medication.dosage}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {medication.form}
                </span>
                {medication.prescriptionRequired && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    <FileText className="h-3 w-3" />
                    Ordonnance
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {medication.description && (
        <div className="px-4 pt-4">
          <h2 className="mb-1.5 text-sm font-bold text-foreground">Description</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {medication.description}
          </p>
        </div>
      )}

      {/* Side effects & contraindications */}
      <div className="grid grid-cols-1 gap-3 px-4 pt-4">
        {medication.sideEffects && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <Info className="h-3.5 w-3.5" />
              EFFETS SECONDAIRES
            </h3>
            <p className="mt-1 text-xs text-amber-700">{medication.sideEffects}</p>
          </div>
        )}
        {medication.contraindications && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-red-800">
              <AlertCircle className="h-3.5 w-3.5" />
              CONTRE-INDICATIONS
            </h3>
            <p className="mt-1 text-xs text-red-700">{medication.contraindications}</p>
          </div>
        )}
      </div>

      {/* Pharmacies with stock */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            Disponible dans {pharmacies.length} pharmacie{pharmacies.length > 1 ? "s" : ""}
          </h2>
        </div>
        {/* Sort toggle */}
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setSort("price")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
              sort === "price"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            )}
          >
            Moins cher
          </button>
          <button
            onClick={() => setSort("rating")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
              sort === "rating"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            )}
          >
            Mieux notées
          </button>
        </div>

        {pharmacies.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aucune pharmacie n'a ce médicament en stock actuellement.
          </div>
        ) : (
          <div className="mt-3 space-y-2 pb-6">
            {pharmacies.map((p, idx) => (
              <div
                key={p.pharmacy.id}
                className="rounded-2xl border border-border bg-card p-3"
              >
                <button
                  onClick={() => navigate("pharmacy-detail", { id: p.pharmacy.id })}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {p.pharmacy.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {p.pharmacy.name}
                      </h3>
                      {idx === 0 && sort === "price" && (
                        <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          Moins cher
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {p.pharmacy.address}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-0.5 text-amber-600">
                        ★ <span className="font-semibold text-foreground">{p.pharmacy.rating.toFixed(1)}</span>
                      </span>
                      <span className="text-muted-foreground">({p.pharmacy.reviewCount})</span>
                      {p.pharmacy.isOnGuard && (
                        <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                          Garde
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
                <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2.5">
                  <div>
                    <p className="text-lg font-bold text-primary">
                      {formatFCFA(p.price)}
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      En stock ({p.stock} unités)
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(p)}
                    className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                    Ajouter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
