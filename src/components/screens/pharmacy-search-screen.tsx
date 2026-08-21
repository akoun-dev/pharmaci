"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Loader2, MapPin, Mic, ArrowUpDown, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { pharmacyApi, type Pharmacy, haversineDistance, formatDistance } from "@/lib/api";
import { AppHeader } from "@/components/app/app-header";
import { PharmacyCard, ServiceBadges } from "@/components/app/pharmacy-card";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { VoiceModal } from "@/components/app/voice-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { GuestPrompt } from "@/components/ui/guest-prompt";

export function PharmacySearchScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const params = useAppStore((s) => s.nav.params);
  const addRecentSearch = useAppStore((s) => s.addRecentSearch);
  const pushToast = useAppStore((s) => s.pushToast);
  const user = useAppStore((s) => s.user);

  const [search, setSearch] = useState(params.q || "");
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: (transcript) => {
      setSearch(transcript);
    },
  });

  // User position for distance sorting
  const userPosition = useAppStore((s) => s.userPosition);

  // Filters
  const [openNow, setOpenNow] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [guardOnly, setGuardOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "rating" | "distance">("name");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [search, openNow, openOnly, guardOnly]);

  const sortedPharmacies = useMemo(() => {
    const result = [...pharmacies];

    // Apply sorting
    if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "distance" && userPosition) {
      result.sort((a, b) => {
        const dA = haversineDistance(userPosition[0], userPosition[1], a.latitude, a.longitude);
        const dB = haversineDistance(userPosition[0], userPosition[1], b.latitude, b.longitude);
        return dA - dB;
      });
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [pharmacies, sortBy, userPosition]);

  async function load() {
    setLoading(true);
    setPage(1);
    try {
      const res = await pharmacyApi.list({
        search: search.trim() || undefined,
        onGuard: guardOnly || undefined,
        open24h: openOnly || undefined,
        openNow: openNow || undefined,
        page: 1,
        limit: 15,
      });
      setPharmacies(res.pharmacies);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (search.trim()) addRecentSearch(search.trim());
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await pharmacyApi.list({
        search: search.trim() || undefined,
        onGuard: guardOnly || undefined,
        open24h: openOnly || undefined,
        openNow: openNow || undefined,
        page: nextPage,
        limit: 15,
      });
      setPharmacies((prev) => [...prev, ...res.pharmacies]);
      setPage(nextPage);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur de chargement", "error");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex flex-col">
      <VoiceModal open={isListening} onStop={stopListening} />
      <AppHeader title="Recherche pharmacie" showBack showCart />
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, ville, quartier..."
            className="h-11 rounded-xl border-primary/20 bg-primary/5 pl-9 pr-12"
            autoFocus
          />
          {user && (
            <button
              onPointerDown={startListening}
              onPointerUp={stopListening}
              onTouchEnd={stopListening}
              className={cn(
                "absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary",
                isListening && "bg-primary/20 text-primary animate-pulse"
              )}
              aria-label="Recherche vocale (maintenir)"
            >
              <Mic className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3 pb-1">
        <FilterChip
          active={openNow}
          onClick={() => setOpenNow((v) => !v)}
          label="Ouvert maintenant"
        />
        <FilterChip
          active={openOnly}
          onClick={() => setOpenOnly((v) => !v)}
          label="Ouvert 24/7"
        />
        <FilterChip
          active={guardOnly}
          onClick={() => setGuardOnly((v) => !v)}
          label="De garde"
          color="orange"
        />
      </div>

      {/* Sort controls */}
      <div className="relative px-4 pt-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {loading ? "Recherche..." : `${sortedPharmacies.length} résultat${sortedPharmacies.length > 1 ? "s" : ""}`}
          </p>
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              aria-expanded={showSortMenu}
              aria-label="Trier les résultats"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40"
            >
              <ArrowUpDown className="h-3 w-3" />
              {sortBy === "name" ? "Nom" : sortBy === "rating" ? "Note" : "Distance"}
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                <button
                  onClick={() => { setSortBy("name"); setShowSortMenu(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                    sortBy === "name" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                  )}
                >
                  Par nom
                </button>
                <button
                  onClick={() => { setSortBy("rating"); setShowSortMenu(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                    sortBy === "rating" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                  )}
                >
                  ★ Meilleure note
                </button>
                <button
                  onClick={() => { setSortBy("distance"); setShowSortMenu(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                    sortBy === "distance" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                  )}
                >
                  📍 Proximité
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 px-4 pt-2 pb-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                <Skeleton className="h-32 w-full" />
                <div className="space-y-2 p-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-48 rounded-full" />
                  <Skeleton className="h-3 w-36 rounded-full" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-9 flex-1 rounded-lg" />
                    <Skeleton className="h-9 flex-1 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedPharmacies.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucune pharmacie trouvée"
            description="Essayez une autre recherche ou modifiez vos filtres."
          />
        ) : (
          <>
            {sortedPharmacies.map((p) => (
              <PharmacyCard
                key={p.id}
                pharmacy={p}
                userLat={userPosition?.[0]}
                userLng={userPosition?.[1]}
                onClick={() => navigate("pharmacy-detail", { id: p.id })}
              />
            ))}
            {page < totalPages && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 active:bg-muted/50"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Voir plus"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  color = "green",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: "green" | "orange";
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
        active
          ? color === "orange"
            ? "border-orange-500 bg-orange-500 text-white"
            : "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40"
      )}
    >
      {label}
    </button>
  );
}

// Guard pharmacies list (full screen)
export function GuardPharmaciesScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const pushToast = useAppStore((s) => s.pushToast);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const res = await pharmacyApi.list({ onGuard: true, limit: 50 });
      setPharmacies(res.pharmacies);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur de chargement des pharmacies de garde", "error");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Pharmacies de garde" showBack />
        <GuestPrompt
          icon={Clock}
          title="Connexion requise"
          description="Connectez-vous pour voir les pharmacies de garde ouvertes maintenant près de chez vous."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <AppHeader title="Pharmacies de garde" showBack />
      <div className="flex-1 space-y-3 px-4 pt-3 pb-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                <Skeleton className="h-32 w-full" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="h-3 w-48 rounded-full" />
                  <Skeleton className="h-3 w-36 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : pharmacies.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucune pharmacie de garde"
            description="Il n'y a pas de pharmacie de garde actuellement. Revenez plus tard."
          />
        ) : (
          pharmacies.map((p) => (
            <PharmacyCard
              key={p.id}
              pharmacy={p}
              onClick={() => navigate("pharmacy-detail", { id: p.id })}
            />
          ))
        )}
      </div>
    </div>
  );
}
