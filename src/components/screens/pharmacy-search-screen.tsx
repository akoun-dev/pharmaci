"use client";

import { useEffect, useState } from "react";
import { Search, Loader2, AlertCircle, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { pharmacyApi, type Pharmacy } from "@/lib/api";
import { AppHeader } from "@/components/app/app-header";
import { PharmacyCard, ServiceBadges } from "@/components/app/pharmacy-card";
import { cn } from "@/lib/utils";

export function PharmacySearchScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const params = useAppStore((s) => s.nav.params);
  const addRecentSearch = useAppStore((s) => s.addRecentSearch);

  const [search, setSearch] = useState(params.q || "");
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [openOnly, setOpenOnly] = useState(false);
  const [guardOnly, setGuardOnly] = useState(false);
  const [vaccinationOnly, setVaccinationOnly] = useState(false);

  useEffect(() => {
    void load();
  }, [search, openOnly, guardOnly, vaccinationOnly]);

  async function load() {
    setLoading(true);
    try {
      const res = await pharmacyApi.list({
        search: search.trim() || undefined,
        onGuard: guardOnly || undefined,
        open24h: openOnly || undefined,
        service: vaccinationOnly ? "vaccination" : undefined,
        limit: 50,
      });
      setPharmacies(res.pharmacies);
      if (search.trim()) addRecentSearch(search.trim());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <AppHeader title="Recherche pharmacie" showBack />
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, ville, quartier..."
            className="h-11 rounded-xl border-primary/20 bg-primary/5 pl-9"
            autoFocus
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3 pb-1">
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

      <div className="flex-1 space-y-3 px-4 pt-3 pb-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : pharmacies.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Aucune pharmacie trouvée.</p>
          </div>
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
      <AppHeader title="Pharmacies de garde" showBack />
      <div className="flex-1 space-y-3 px-4 pt-3 pb-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : pharmacies.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Aucune pharmacie de garde.</p>
          </div>
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
