"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Phone,
  Clock,
  Star,
  Heart,
  Loader2,
  AlertCircle,
  Search,
  Pill,
  ShoppingCart,
  Navigation,
  MessageSquare,
  Minus,
  Plus,
  Syringe,
  ShieldCheck,
  Truck,
  CreditCard,
  Wallet,
  Banknote,
  CheckCircle2,
  X,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  pharmacyApi,
  type Pharmacy,
  type PharmacyMedication,
  type Review,
  formatFCFA,
  formatRelative,
} from "@/lib/api";
import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating, ServiceBadges, StatusBadge } from "@/components/app/pharmacy-card";
import { cn } from "@/lib/utils";

const paymentLabels: Record<string, { icon: typeof Wallet; label: string }> = {
  mobile_money: { icon: Wallet, label: "Mobile Money" },
  cash: { icon: Banknote, label: "Espèces" },
  card: { icon: CreditCard, label: "Carte" },
};

export function PharmacyDetailScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const params = useAppStore((s) => s.nav.params);
  const user = useAppStore((s) => s.user);
  const addToCart = useAppStore((s) => s.addToCart);
  const pushToast = useAppStore((s) => s.pushToast);
  const setTab = useAppStore((s) => s.setTab);

  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [medications, setMedications] = useState<PharmacyMedication[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [medQty, setMedQty] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!params.id) return;
    void load();
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;
    const timer = setTimeout(() => void loadMedications(), 300);
    return () => clearTimeout(timer);
  }, [params.id, search]);

  async function load() {
    setLoading(true);
    try {
      const detailRes = await pharmacyApi.get(params.id);
      setPharmacy(detailRes);
      setReviews(detailRes.reviews || []);
      if (user) {
        try {
          const favRes = await pharmacyApi.favorite.get(params.id);
          setIsFavorite(favRes.isFavorite);
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function loadMedications() {
    try {
      const res = await pharmacyApi.medications(params.id, {
        search: search.trim() || undefined,
      });
      setMedications(res.medications);
    } catch {
      // ignore
    }
  }

  async function toggleFavorite() {
    if (!user) {
      pushToast("Connectez-vous pour ajouter aux favoris.", "info");
      return;
    }
    setFavLoading(true);
    try {
      if (isFavorite) {
        await pharmacyApi.favorite.remove(params.id);
        setIsFavorite(false);
        pushToast("Retiré des favoris.", "info");
      } else {
        await pharmacyApi.favorite.add(params.id);
        setIsFavorite(true);
        pushToast("Ajouté aux favoris !", "success");
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setFavLoading(false);
    }
  }

  function handleAddToCart(pm: PharmacyMedication) {
    if (!pharmacy) return;
    const qty = medQty[pm.id] || 1;
    if (pm.medication.prescriptionRequired) {
      pushToast("Médicament sur ordonnance — présentez-la en pharmacie.", "info");
    }
    addToCart({
      medicationId: pm.medication.id,
      medicationName: pm.medication.name,
      medicationDosage: pm.medication.dosage,
      medicationForm: pm.medication.form,
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name,
      unitPrice: pm.price,
      quantity: qty,
      prescriptionRequired: pm.medication.prescriptionRequired,
    });
    pushToast(`${pm.medication.name} ×${qty} ajouté au panier.`, "success");
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Pharmacie" showBack showCart />
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Pharmacie" showBack showCart />
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Pharmacie introuvable.</p>
        </div>
      </div>
    );
  }

  const payments = pharmacy.payments
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col">
      <AppHeader
        title={pharmacy.name}
        showBack
        showCart
        rightSlot={
          <button
            onClick={toggleFavorite}
            disabled={favLoading}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
              isFavorite ? "bg-red-50 text-red-500" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
            aria-label="Favori"
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </button>
        }
      />

      {/* Hero image */}
      {pharmacy.imageUrl && (
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={pharmacy.imageUrl}
            alt={pharmacy.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <h1 className="text-xl font-bold text-white drop-shadow">{pharmacy.name}</h1>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge isOnGuard={pharmacy.isOnGuard} isOpen24h={pharmacy.isOpen24h} />
                <span className="flex items-center gap-1 text-xs font-medium text-white">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {pharmacy.rating.toFixed(1)} ({pharmacy.reviewCount})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="px-4 pt-4">
        {!pharmacy.imageUrl && (
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
              {pharmacy.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{pharmacy.name}</h1>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge isOnGuard={pharmacy.isOnGuard} isOpen24h={pharmacy.isOpen24h} />
                <StarRating rating={pharmacy.rating} showNumber />
                <span className="text-xs text-muted-foreground">({pharmacy.reviewCount})</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-foreground">{pharmacy.address}</p>
              <p className="text-xs text-muted-foreground">
                {pharmacy.city}
                {pharmacy.district ? ` • ${pharmacy.district}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-foreground">
              {pharmacy.isOpen24h
                ? "Ouvert 24h/24, 7j/7"
                : `Ouvre à ${pharmacy.openingTime} • Ferme à ${pharmacy.closingTime}`}
            </span>
          </div>
          <a
            href={`tel:${pharmacy.phone}`}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Phone className="h-4 w-4 shrink-0" />
            {pharmacy.phone}
          </a>
        </div>

        {/* Services */}
        {pharmacy.services && (
          <div className="mt-3">
            <h3 className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
              Services
            </h3>
            <ServiceBadges services={pharmacy.services} />
          </div>
        )}

        {/* Payments */}
        {payments.length > 0 && (
          <div className="mt-3">
            <h3 className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
              Moyens de paiement
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {payments.map((p) => {
                const meta = paymentLabels[p];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            onClick={() => {
              if (pharmacy) {
                setTab("map", { focusLat: String(pharmacy.latitude), focusLng: String(pharmacy.longitude) });
              } else {
                setTab("map");
              }
            }}
            className="h-10 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Navigation className="mr-1.5 h-4 w-4" />
            Itinéraire
          </Button>
          <a
            href={`tel:${pharmacy.phone}`}
            className="flex h-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <Phone className="mr-1.5 h-4 w-4" />
            Appeler
          </a>
        </div>
      </div>

      {/* Stock search */}
      <div className="px-4 pt-5">
        <h2 className="mb-2 text-base font-bold text-foreground">
          Médicaments en stock ({medications.length})
        </h2>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans le stock..."
            className="h-10 rounded-xl border-primary/20 bg-primary/5 pl-9"
          />
        </div>

        <div className="mt-3 space-y-2 pb-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-36 rounded-full" />
                    <Skeleton className="h-3 w-24 rounded-full" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16 rounded-full" />
                      <Skeleton className="h-3 w-12 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              ))}
            </div>
          ) : medications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Aucun médicament trouvé.
            </div>
          ) : (
            medications.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Pill className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {pm.medication.name}
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {pm.medication.activeIngredient} • {pm.medication.dosage}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">
                      {formatFCFA(pm.price)}
                    </span>
                    {pm.stock > 0 ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Stock: {pm.stock}
                      </span>
                    ) : (
                      <span className="text-[10px] text-red-600">Rupture</span>
                    )}
                  </div>
                </div>
                {pm.stock > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1 rounded-md border border-border bg-background">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMedQty((q) => ({ ...q, [pm.id]: Math.max(1, (q[pm.id] || 1) - 1) })); }}
                        className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[1.5ch] text-center text-xs font-semibold tabular-nums text-foreground">
                        {medQty[pm.id] || 1}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMedQty((q) => ({ ...q, [pm.id]: Math.min(pm.stock, (q[pm.id] || 1) + 1) })); }}
                        className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(pm)}
                      className="h-8 shrink-0 rounded-lg bg-primary px-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            Avis ({reviews.length})
          </h2>
          <button
            onClick={() => setShowReviews(!showReviews)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {showReviews ? "Masquer" : "Voir tout"}
          </button>
        </div>

        {/* Add review button */}
        {user && (
          <Button
            variant="outline"
            onClick={() => setShowAddReview(true)}
            className="mt-2 h-9 w-full rounded-xl border-primary/30 text-sm font-semibold text-primary"
          >
            <MessageSquare className="mr-1.5 h-4 w-4" />
            Laisser un avis
          </Button>
        )}

        <div className="mt-3 space-y-2">
          {reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Aucun avis pour le moment.
            </div>
          ) : (
            (showReviews ? reviews : reviews.slice(0, 2)).map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {r.user?.name?.charAt(0) || "A"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {r.user?.name || "Anonyme"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatRelative(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={r.rating} />
                </div>
                {r.comment && (
                  <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add review modal */}
      {showAddReview && (
        <AddReviewModal
          onClose={() => setShowAddReview(false)}
          onSubmit={async (rating, comment) => {
            try {
              await pharmacyApi.addReview(params.id, rating, comment);
              await load();
              setShowAddReview(false);
              pushToast("Merci pour votre avis !", "success");
            } catch (err) {
              pushToast(err instanceof Error ? err.message : "Erreur", "error");
            }
          }}
        />
      )}
    </div>
  );
}

function AddReviewModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-card p-5 sm:rounded-3xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Laisser un avis</h3>
          <button onClick={onClose} aria-label="Fermer">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
              Note
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  onClick={() => setRating(i)}
                  aria-label={`${i} étoiles`}
                >
                  <Star
                    className={cn(
                      "h-7 w-7 transition-colors",
                      i <= rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
              Commentaire
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience..."
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <Button
            onClick={async () => {
              setLoading(true);
              await onSubmit(rating, comment);
              setLoading(false);
            }}
            disabled={loading}
            className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publier l'avis"}
          </Button>
        </div>
      </div>
    </div>
  );
}
