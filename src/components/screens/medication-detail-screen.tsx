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
  TrendingDown,
  Minus,
  Plus,
  Search,
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn, categoryColor } from "@/lib/utils";

export function MedicationDetailScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const params = useAppStore((s) => s.nav.params);
  const addToCart = useAppStore((s) => s.addToCart);
  const pushToast = useAppStore((s) => s.pushToast);
  const addRecentlyViewed = useAppStore((s) => s.addRecentlyViewed);

  const [medication, setMedication] = useState<Medication | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacyWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"price" | "rating">("price");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pharmacySearch, setPharmacySearch] = useState("");

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
      addRecentlyViewed({ id: medRes.id, name: medRes.name, category: medRes.category, dosage: medRes.dosage, form: medRes.form });
      const enriched = pharmRes.pharmacies
        .filter((p) => p.stock > 0);
      // Sort
      enriched.sort((a, b) =>
        sort === "price" ? a.price - b.price : b.pharmacy.rating - a.pharmacy.rating
      );
      setPharmacies(enriched);
      setQuantities(Object.fromEntries(enriched.map((p) => [p.pharmacy.id, 1])));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart(p: PharmacyWithPrice) {
    if (!medication) return;
    navigator.vibrate?.(10);
    const qty = quantities[p.pharmacy.id] || 1;
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
      quantity: qty,
      prescriptionRequired: medication.prescriptionRequired,
    });
    pushToast(`${medication.name} ×${qty} ajouté au panier (${p.pharmacy.name}).`, "success");
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Détail médicament" showBack showCart />
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!medication) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Détail médicament" showBack showCart />
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Médicament introuvable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <AppHeader title={medication.name} showBack showCart />

      {/* Header card */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            {medication.imageUrl ? (
              <img
                src={medication.imageUrl}
                alt={medication.name}
                className="h-16 w-16 shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Pill className="h-8 w-8" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-lg font-bold text-foreground">{medication.name}</h1>
                <button
                  onClick={() => {
                    const text = `${medication.name} - ${medication.dosage} - ${medication.form}\n${medication.activeIngredient}\n\nTrouvé sur Pharmaci`;
                    if (navigator.share) {
                      navigator.share({ title: medication.name, text }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(text).then(() => pushToast("Informations copiées !", "success"));
                    }
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  aria-label="Partager"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </button>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {medication.activeIngredient}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", categoryColor(medication.category).bg, categoryColor(medication.category).text)}>
                  {medication.category}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {medication.dosage}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {medication.form}
                </span>
                {medication.prescriptionRequired && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-500">
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
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
              <Info className="h-3.5 w-3.5" />
              EFFETS SECONDAIRES
            </h3>
            <p className="mt-1 text-xs text-amber-500/80">{medication.sideEffects}</p>
          </div>
        )}
        {medication.contraindications && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-red-500">
              <AlertCircle className="h-3.5 w-3.5" />
              CONTRE-INDICATIONS
            </h3>
            <p className="mt-1 text-xs text-red-500/80">{medication.contraindications}</p>
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

        {/* Price comparison summary */}
        {pharmacies.length > 1 && (
          <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <TrendingDown className="h-3.5 w-3.5" />
              COMPARATEUR DE PRIX
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-green-500/10 p-2">
                <p className="text-[10px] text-green-500">Moins cher</p>
                <p className="mt-0.5 text-sm font-bold text-green-500">
                  {formatFCFA(pharmacies[0].price)}
                </p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-2">
                <p className="text-[10px] text-amber-500">Moyen</p>
                <p className="mt-0.5 text-sm font-bold text-amber-500">
                  {formatFCFA(Math.round(pharmacies.reduce((sum, p) => sum + p.price, 0) / pharmacies.length))}
                </p>
              </div>
              <div className="rounded-lg bg-red-500/10 p-2">
                <p className="text-[10px] text-red-500">Plus cher</p>
                <p className="mt-0.5 text-sm font-bold text-red-500">
                  {formatFCFA(pharmacies[pharmacies.length - 1].price)}
                </p>
              </div>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
              Écart de prix : {formatFCFA(pharmacies[pharmacies.length - 1].price - pharmacies[0].price)}
            </p>
          </div>
        )}

        {/* Sort toggle */}
        <div className="mt-3 flex gap-2">
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

        {/* Pharmacy search filter */}
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={pharmacySearch}
            onChange={(e) => setPharmacySearch(e.target.value)}
            placeholder="Filtrer par pharmacie..."
            className="h-9 w-full rounded-full border border-border bg-card pl-8 pr-3 text-xs outline-none focus:border-primary/50"
          />
        </div>

        {loading ? (
          <div className="mt-3 space-y-2 pb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 rounded-full" />
                    <Skeleton className="h-3 w-48 rounded-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-12 rounded-full" />
                      <Skeleton className="h-4 w-8 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2.5">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-9 w-20 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : pharmacies.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aucune pharmacie n'a ce médicament en stock actuellement.
          </div>
        ) : (
          <div className="mt-3 space-y-2 pb-6">
            {pharmacies
              .filter((p) =>
                pharmacySearch
                  ? p.pharmacy.name.toLowerCase().includes(pharmacySearch.toLowerCase()) ||
                    p.pharmacy.address?.toLowerCase().includes(pharmacySearch.toLowerCase())
                  : true
              )
              .map((p, idx) => {
              const minPrice = pharmacies[0].price;
              const maxPrice = pharmacies[pharmacies.length - 1].price;
              const diff = maxPrice - minPrice;
              const savings = p.price - minPrice;
              const savingsPercent = diff > 0 ? Math.round((1 - (p.price - minPrice) / diff) * 100) : 0;
              return (
                <div
                  key={p.pharmacy.id}
                  className={cn(
                    "rounded-2xl border p-3",
                    idx === 0 && sort === "price"
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-border bg-card"
                  )}
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
                          <span className="shrink-0 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-500">
                            Moins cher
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {p.pharmacy.address}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-0.5 text-amber-500">
                          ★ <span className="font-semibold text-foreground">{p.pharmacy.rating.toFixed(1)}</span>
                        </span>
                        <span className="text-muted-foreground">({p.pharmacy.reviewCount})</span>
                        {p.pharmacy.isOnGuard && (
                          <span className="rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-500">
                            Garde
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                  <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2.5">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-lg font-bold text-primary">
                          {formatFCFA(p.price)}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-green-500">
                          <CheckCircle2 className="h-3 w-3" />
                          Stock: {p.stock}
                        </p>
                      </div>
                      {/* Qty stepper */}
                      <div className="flex items-center gap-1 rounded-lg border border-border bg-background">
                        <button
                          onClick={(e) => { e.stopPropagation(); setQuantities((q) => ({ ...q, [p.pharmacy.id]: Math.max(1, (q[p.pharmacy.id] || 1) - 1) })); }}
                          className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[1.5ch] text-center text-sm font-semibold tabular-nums text-foreground">
                          {quantities[p.pharmacy.id] || 1}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setQuantities((q) => ({ ...q, [p.pharmacy.id]: Math.min(p.stock, (q[p.pharmacy.id] || 1) + 1) })); }}
                          className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      {/* Price comparison bar */}
                      {pharmacies.length > 1 && diff > 0 && (
                        <div className="flex flex-col items-center">
                          {idx === 0 && (
                            <span className="mb-0.5 text-[8px] font-semibold text-green-500">-{formatFCFA(maxPrice - p.price)}</span>
                          )}
                          <div className="relative h-12 w-3 overflow-hidden rounded-full bg-muted">
                            <div
                              className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-green-500 via-amber-400 to-red-400 transition-all"
                              style={{ height: `${savingsPercent}%` }}
                            />
                          </div>
                          <span className="mt-0.5 text-[9px] text-muted-foreground">{idx + 1}/{pharmacies.length}</span>
                          {idx === pharmacies.length - 1 && (
                            <span className="mt-0.5 text-[8px] font-semibold text-red-500">+{formatFCFA(p.price - minPrice)}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(p)}
                      className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                      {quantities[p.pharmacy.id] > 1 ? `${quantities[p.pharmacy.id]} × ` : ""}
                      Ajouter
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
