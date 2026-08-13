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
  Navigation,
  MessageSquare,
  X,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  pharmacyApi,
  type Pharmacy,
  type Review,
  formatRelative,
} from "@/lib/api";
import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating, StatusBadge } from "@/components/app/pharmacy-card";
import { cn } from "@/lib/utils";

export function PharmacyDetailScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const params = useAppStore((s) => s.nav.params);
  const user = useAppStore((s) => s.user);
  const pushToast = useAppStore((s) => s.pushToast);
  const setTab = useAppStore((s) => s.setTab);

  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    void load();
  }, [params.id]);

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
              isFavorite ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground hover:text-foreground"
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
                {user && (
                  <span className="flex items-center gap-1 text-xs font-medium text-white">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {pharmacy.rating.toFixed(1)} ({pharmacy.reviewCount})
                  </span>
                )}
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
                {user && (
                  <>
                    <StarRating rating={pharmacy.rating} showNumber />
                    <span className="text-xs text-muted-foreground">({pharmacy.reviewCount})</span>
                  </>
                )}
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

      {/* Reviews — visiteur : masqué */}
      {user && (
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
      )}

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
