"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Loader2, MapPin, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { pharmacyApi, type Pharmacy } from "@/lib/api";
import { AppHeader } from "@/components/app/app-header";
import { PharmacyCard, ServiceBadges } from "@/components/app/pharmacy-card";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { EmptyState } from "@/components/ui/empty-state";

export function PharmacySearchScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const params = useAppStore((s) => s.nav.params);
  const addRecentSearch = useAppStore((s) => s.addRecentSearch);
  const pushToast = useAppStore((s) => s.pushToast);

  const [search, setSearch] = useState(params.q || "");
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const { isListening, startListening } = useSpeechRecognition({
    onResult: (transcript) => {
      setSearch(transcript);
    },
  });

  // Filters
  const [openNow, setOpenNow] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [guardOnly, setGuardOnly] = useState(false);
  const [vaccinationOnly, setVaccinationOnly] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [search, openNow, openOnly, guardOnly, vaccinationOnly]);

  function isOpenNow(p: Pharmacy): boolean {
    if (p.isOpen24h) return true;
    if (!p.openingTime || !p.closingTime) return false;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = p.openingTime.split(":").map(Number);
    const [closeH, closeM] = p.closingTime.split(":").map(Number);
    const openMins = openH * 60 + openM;
    const closeMins = closeH * 60 + closeM;
    return mins >= openMins && mins <= closeMins;
  }

  const filteredPharmacies = useMemo(() => {
    if (!openNow) return pharmacies;
    return pharmacies.filter(isOpenNow);
  }, [pharmacies, openNow]);

  async function load() {
    setLoading(true);
    setPage(1);
    try {
      const res = await pharmacyApi.list({
        search: search.trim() || undefined,
        onGuard: guardOnly || undefined,
        open24h: openOnly || undefined,
        service: vaccinationOnly ? "vaccination" : undefined,
        page: 1,
        limit: 15,
      });
      setPharmacies(res.pharmacies);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (search.trim()) addRecentSearch(search.trim());
    } catch {
      // ignore
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
        service: vaccinationOnly ? "vaccination" : undefined,
        page: nextPage,
        limit: 15,
      });
      setPharmacies((prev) => [...prev, ...res.pharmacies]);
      setPage(nextPage);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex flex-col">
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
          <button
            onClick={startListening}
            disabled={isListening}
            className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
            aria-label="Recherche vocale"
          >
            <Mic className={cn("h-4 w-4", isListening && "animate-pulse text-primary")} />
          </button>
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
        <FilterChip
          active={vaccinationOnly}
          onClick={() => setVaccinationOnly((v) => !v)}
          label="Vaccination"
        />
      </div>

      <div className="px-4 pt-2">
        <p className="text-xs text-muted-foreground">
          {loading ? "Recherche..." : `${filteredPharmacies.length} résultat${filteredPharmacies.length > 1 ? "s" : ""}`}
        </p>
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
        ) : filteredPharmacies.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucune pharmacie trouvée"
            description="Essayez une autre recherche ou modifiez vos filtres."
          />
        ) : (
          <>
            {filteredPharmacies.map((p) => (
              <PharmacyCard
                key={p.id}
                pharmacy={p}
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
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await pharmacyApi.list({ onGuard: true, limit: 50 });
      setPharmacies(res.pharmacies);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <AppHeader title="Pharmacies de garde" showBack showCart />
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
