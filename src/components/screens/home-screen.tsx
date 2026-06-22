"use client";

import { useEffect, useState } from "react";
import {
  Search,
  MapPin,
  Bell,
  ChevronRight,
  Clock,
  Sparkles,
  Pill,
  Stethoscope,
  HeartPulse,
  Baby,
  Eye,
  Bone,
  ShieldPlus,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/logo";
import { PharmacyCard, PharmacyCardCompact } from "@/components/app/pharmacy-card";
import { useAppStore } from "@/lib/store";
import { pharmacyApi, medicationApi, type Pharmacy, type Medication } from "@/lib/api";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "Tous", label: "Tous", icon: Sparkles },
  { id: "Antalgiques", label: "Antalgiques", icon: Pill },
  { id: "Antibiotiques", label: "Antibiotiques", icon: ShieldPlus },
  { id: "Antipaludéens", label: "Antipaludéens", icon: HeartPulse },
  { id: "Vitamines", label: "Vitamines", icon: Stethoscope },
  { id: "Pansements", label: "Pansements", icon: Baby },
  { id: "Antihistaminiques", label: "Antihistaminiques", icon: Eye },
  { id: "Gastro-entérologie", label: "Gastro", icon: Bone },
];

export function HomeScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const setTab = useAppStore((s) => s.setTab);
  const user = useAppStore((s) => s.user);
  const pushToast = useAppStore((s) => s.pushToast);
  const addRecentSearch = useAppStore((s) => s.addRecentSearch);
  const recentSearches = useAppStore((s) => s.recentSearches);

  const [searchMode, setSearchMode] = useState<"medications" | "pharmacies">("medications");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tous");
  const [guardPharmacies, setGuardPharmacies] = useState<Pharmacy[]>([]);
  const [popularMeds, setPopularMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("Abidjan, Cocody Riviera");

  useEffect(() => {
    void loadInitial();
  }, []);

  async function loadInitial() {
    setLoading(true);
    try {
      const [guardRes, medsRes] = await Promise.all([
        pharmacyApi.list({ onGuard: true, limit: 4 }),
        medicationApi.list({ limit: 6 }),
      ]);
      setGuardPharmacies(guardRes.pharmacies);
      setPopularMeds(medsRes.medications);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    const term = search.trim();
    if (!term) return;
    addRecentSearch(term);
    if (searchMode === "medications") {
      navigate("medication-search", { q: term });
    } else {
      navigate("pharmacy-search", { q: term });
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <Logo size="sm" />
        <div className="flex-1" />
        <button
          onClick={() => pushToast("Aucune nouvelle notification.", "info")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
      </header>

      {/* Greeting */}
      <div className="px-4 pt-4">
        <p className="text-sm text-muted-foreground">Bonjour 👋</p>
        <h1 className="text-xl font-bold text-foreground">
          {user?.name?.split(" ")[0] || "Cherchons"} votre médicament
        </h1>
      </div>

      {/* Mode tabs */}
      <div className="px-4 pt-4">
        <div className="flex gap-2 rounded-full bg-muted p-1">
          <button
            onClick={() => setSearchMode("medications")}
            className={cn(
              "flex-1 rounded-full py-2 text-sm font-semibold transition-all",
              searchMode === "medications"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            Médicaments
          </button>
          <button
            onClick={() => setSearchMode("pharmacies")}
            className={cn(
              "flex-1 rounded-full py-2 text-sm font-semibold transition-all",
              searchMode === "pharmacies"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            Pharmacies
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={
              searchMode === "medications"
                ? "Rechercher un médicament..."
                : "Rechercher une pharmacie..."
            }
            className="h-11 rounded-xl border-primary/20 bg-primary/5 pl-9"
          />
        </div>
      </div>

      {/* Category chips */}
      {searchMode === "medications" && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3 pb-1">
          {CATEGORIES.map((cat) => {
            const active = category === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Recent searches (only if any and not searching) */}
      {recentSearches.length > 0 && !search && (
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Recherches récentes
            </p>
            <button
              onClick={() => useAppStore.getState().clearRecentSearches()}
              className="text-xs text-primary hover:underline"
            >
              Effacer
            </button>
          </div>
          <div className="no-scrollbar mt-1.5 flex gap-2 overflow-x-auto">
            {recentSearches.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSearch(s);
                  addRecentSearch(s);
                  navigate(
                    searchMode === "medications" ? "medication-search" : "pharmacy-search",
                    { q: s }
                  );
                }}
                className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs text-foreground hover:bg-muted/70"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Help banner */}
      <div className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/85 p-4 text-primary-foreground shadow-md">
          <div className="relative z-10">
            <h3 className="text-base font-bold">Besoin d'aide ?</h3>
            <p className="mt-0.5 text-xs text-primary-foreground/90">
              Trouvez les pharmacies ouvertes 24h/24 près de chez vous.
            </p>
            <Button
              size="sm"
              onClick={() => setTab("map")}
              className="mt-3 h-8 rounded-full bg-white/20 px-3 text-xs font-semibold text-white backdrop-blur hover:bg-white/30"
            >
              Voir la carte
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          {/* Decorative cross */}
          <div className="absolute -right-4 -top-4 opacity-20">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-24 w-24">
              <path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Location section */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Ma Localisation
            </p>
            <p className="text-sm font-semibold text-foreground">{location}</p>
          </div>
          <button
            onClick={() => {
              if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setLocation(
                      `${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`
                    );
                    pushToast("Position mise à jour.", "success");
                  },
                  () => pushToast("Impossible d'obtenir votre position.", "error")
                );
              } else {
                pushToast("Géolocalisation non disponible.", "error");
              }
            }}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Modifier
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Pharmacies de garde - horizontal carousel */}
      <section className="pt-5">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            Pharmacies de Garde
          </h2>
          <button
            onClick={() => navigate("guard-pharmacies")}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Voir tout
          </button>
        </div>
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : guardPharmacies.length === 0 ? (
          <div className="mx-4 mt-2 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aucune pharmacie de garde pour le moment.
          </div>
        ) : (
          <div className="h-carousel h-carousel-edge mt-3 pb-1">
            {guardPharmacies.map((p) => (
              <PharmacyCardCompact
                key={p.id}
                pharmacy={p}
                onClick={() => navigate("pharmacy-detail", { id: p.id })}
              />
            ))}
          </div>
        )}
      </section>

      {/* Popular medications - horizontal carousel */}
      <section className="pt-5 pb-6">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
            <Pill className="h-4 w-4 text-primary" />
            Médicaments populaires
          </h2>
          <button
            onClick={() => navigate("medication-search", { q: "" })}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Voir tout
          </button>
        </div>
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="h-carousel h-carousel-edge mt-3 pb-1">
            {popularMeds.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate("medication-detail", { id: m.id })}
                className="flex w-36 flex-col gap-2 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Pill className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                    {m.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.category}</p>
                </div>
                {m.prescriptionRequired && (
                  <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    Sur ordonnance
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
