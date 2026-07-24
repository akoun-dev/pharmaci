"use client";

import { useEffect, useState, useRef } from "react";
import {
  Search,
  MapPin,
  ChevronRight,
  Clock,
  Sparkles,
  Pill,
  Loader2,
  ShoppingCart,
  Mic,
  Camera,
  Locate,
  History,
  WifiOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app/app-header";
import { PharmacyCardCompact } from "@/components/app/pharmacy-card";
import { useAppStore } from "@/lib/store";
import {
  pharmacyApi,
  medicationApi,
  orderApi,
  notificationMessage,
  type Pharmacy,
  type Medication,
} from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, categoryColor, CATEGORY_COLORS } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";

const CATEGORIES = [
  { id: "Tous", label: "Tous", icon: Sparkles },
];

export function HomeScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const setTab = useAppStore((s) => s.setTab);
  const user = useAppStore((s) => s.user);
  const pushToast = useAppStore((s) => s.pushToast);
  const addRecentSearch = useAppStore((s) => s.addRecentSearch);
  const recentSearches = useAppStore((s) => s.recentSearches);
  const cartCount = useAppStore((s) => s.cartCount());
  const cart = useAppStore((s) => s.cart);
  const recentlyViewed = useAppStore((s) => s.recentlyViewed);

  const [searchMode, setSearchMode] = useState<"medications" | "pharmacies">("medications");
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [guardPharmacies, setGuardPharmacies] = useState<Pharmacy[]>([]);
  const [popularMeds, setPopularMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [location, setLocation] = useState("Localisation en cours...");
  const [isOnline, setIsOnline] = useState(true);

  // Auto-detect geolocation on first load
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          useAppStore.getState().setUserPosition([latitude, longitude]);
        },
        () => {
          setLocation("Abidjan, Cocody Riviera");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Online/offline detection
  useEffect(() => {
    const setOnline = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);
    window.addEventListener("online", setOnline);
    window.addEventListener("offline", setOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", setOnline);
      window.removeEventListener("offline", setOffline);
    };
  }, []);
  const [showScanner, setShowScanner] = useState(false);

  // Speech recognition
  const { isListening, isSupported: speechSupported, startListening } = useSpeechRecognition({
    onResult: (transcript) => {
      setSearch(transcript);
      addRecentSearch(transcript);
      navigate(
        searchMode === "medications" ? "medication-search" : "pharmacy-search",
        { q: transcript }
      );
    },
  });

  // Barcode scanner
  const {
    isScanning,
    isSupported: barcodeSupported,
    startScanning: startBarcodeScan,
    stopScanning: stopBarcodeScan,
    videoRef,
    canvasRef,
  } = useBarcodeScanner({
    onDetect: (code) => {
      setSearch(code);
      addRecentSearch(code);
      navigate("medication-search", { q: code });
      setShowScanner(false);
    },
  });

  const prevOrders = useRef<Map<string, string>>(new Map());


  // Suggestion state
  const [medSuggestions, setMedSuggestions] = useState<Medication[]>([]);
  const [pharmSuggestions, setPharmSuggestions] = useState<Pharmacy[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const inputRef = useRef<HTMLDivElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadInitial();

    function onFocus() { void loadInitial(); }
    window.addEventListener("focus", onFocus);

    // Poll for order updates every 30s
    const pollInterval = setInterval(() => {
      if (user) void checkNotifications();
    }, 30000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(pollInterval);
    };
  }, []);

  // Fetch suggestions when typing
  useEffect(() => {
    if (!search.trim()) return;
    const timer = setTimeout(() => void fetchSuggestions(), 150);
    return () => clearTimeout(timer);
  }, [search, searchMode]);

  // Clear suggestions when switching mode
  useEffect(() => {
    setShowSuggestions(false);
    setMedSuggestions([]);
    setPharmSuggestions([]);
    setFocusedIdx(-1);
  }, [searchMode]);

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestRef.current && !suggestRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function checkNotifications() {
    if (!user) return;
    try {
      const res = await orderApi.list();
      const active = res.orders.filter(
        (o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "READY"
      );

      // Detect new orders or status changes since last check
      if (prevOrders.current.size > 0) {
        const oldMap = prevOrders.current;
        for (const order of active) {
          const prevStatus = oldMap.get(order.id);
          if (!prevStatus || prevStatus !== order.status) {
            pushToast(
              notificationMessage(order.status, order.pharmacy?.name || "Pharmacie", order.code),
              "info"
            );
          }
        }
      }

      // Update ref with current id→status map for next comparison
      prevOrders.current = new Map(active.map((o) => [o.id, o.status]));
      useAppStore.getState().setNotificationCount(active.length);
    } catch {
      pushToast("Erreur de vérification des notifications", "error");
    }
  }

  async function loadInitial() {
    setLoading(true);
    try {
      const [guardRes, medsRes, catRes, favRes] = await Promise.all([
        pharmacyApi.list({ onGuard: true, limit: 4 }),
        medicationApi.list({ sort: "popular", limit: 6 }),
        medicationApi.categories(),
        user ? pharmacyApi.favorites() : Promise.resolve({ pharmacies: [] }),
      ]);
      setGuardPharmacies(guardRes.pharmacies);
      setPopularMeds(medsRes.medications);
      setCategories(catRes.categories);
      if (favRes) setFavoriteIds(new Set((favRes as { pharmacies: Pharmacy[] }).pharmacies.map((p) => p.id)));
      // Check notifications in parallel
      void checkNotifications();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  }

  function suggestionCount() {
    return searchMode === "medications" ? medSuggestions.length : pharmSuggestions.length;
  }

  async function fetchSuggestions() {
    const q = search.trim();
    if (!q) { setMedSuggestions([]); setPharmSuggestions([]); setShowSuggestions(false); return; }
    setSuggestLoading(true);
    try {
      if (searchMode === "medications") {
        const res = await medicationApi.list({ search: q, limit: 8 });
        setMedSuggestions(res.medications);
        setShowSuggestions(res.medications.length > 0);
      } else {
        const res = await pharmacyApi.list({ search: q, limit: 8 });
        setPharmSuggestions(res.pharmacies);
        setShowSuggestions(res.pharmacies.length > 0);
      }
      setFocusedIdx(-1);
    } catch {
      setMedSuggestions([]);
      setPharmSuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  }

  function handleSelectSuggestion(item: Medication | Pharmacy) {
    setShowSuggestions(false);
    if ("activeIngredient" in item) {
      setSearch(item.name);
      addRecentSearch(item.name);
      navigate("medication-detail", { id: item.id });
    } else {
      setSearch(item.name);
      addRecentSearch(item.name);
      navigate("pharmacy-detail", { id: item.id });
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    const count = suggestionCount();
    if (showSuggestions && count > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setFocusedIdx((p) => (p < count - 1 ? p + 1 : 0)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setFocusedIdx((p) => (p > 0 ? p - 1 : count - 1)); return; }
      if (e.key === "Enter" && focusedIdx >= 0) {
        e.preventDefault();
        const items = searchMode === "medications" ? medSuggestions : pharmSuggestions;
        if (items[focusedIdx]) handleSelectSuggestion(items[focusedIdx]);
        return;
      }
      if (e.key === "Escape") { setShowSuggestions(false); return; }
    }
    if (e.key === "Enter") handleSearch();
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
      <AppHeader title="Pharmaci" showCart />

      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-1.5 bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-700">
          <WifiOff className="h-3 w-3" />
          Mode hors ligne — certaines fonctionnalités peuvent être limitées
        </div>
      )}

      {/* Greeting */}
      <div className="px-4 pt-4">
        {user ? (
          <>
            <p className="text-sm text-muted-foreground">Bonjour 👋</p>
            <h1 className="text-xl font-bold text-foreground">
              {user.name?.split(" ")[0]}, trouvez votre médicament
            </h1>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Bienvenue 👋</p>
            <h1 className="text-xl font-bold text-foreground">
              Découvrez les pharmacies près de chez vous
            </h1>
          </>
        )}
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
        <div className="relative" ref={inputRef}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => { if (suggestionCount() > 0) setShowSuggestions(true); }}
            onKeyDown={handleSearchKeyDown}
            placeholder={
              searchMode === "medications"
                ? "Rechercher un médicament..."
                : "Rechercher une pharmacie..."
            }
            className="h-11 rounded-xl border-primary/20 bg-primary/5 pl-9 pr-12"
          />
          <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {barcodeSupported && (
              <button
                onClick={() => setShowScanner(true)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label="Scanner un code-barres"
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={startListening}
              disabled={isListening}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
              aria-label="Recherche vocale"
            >
              <Mic className={cn("h-4 w-4", isListening && "animate-pulse text-primary")} />
            </button>
          </div>
          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div
              ref={suggestRef}
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
            >
              {suggestLoading ? (
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Suggestions...</span>
                </div>
              ) : searchMode === "medications" ? (
                medSuggestions.map((m, i) => (
                  <button
                    key={m.id}
                    onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(m); }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                      i === focusedIdx ? "bg-primary/10" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {m.activeIngredient} • {m.dosage} • {m.form}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {m.category}
                    </span>
                  </button>
                ))
              ) : (
                pharmSuggestions.map((p, i) => (
                  <button
                    key={p.id}
                    onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(p); }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                      i === focusedIdx ? "bg-primary/10" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {p.address}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {p.isOnGuard && (
                        <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
                          Garde
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 text-[11px] text-amber-600">
                        ★ {p.rating.toFixed(1)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter chips */}
      {searchMode === "medications" && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3 pb-1">
          {[...CATEGORIES, ...categories.map((c) => ({ id: c, label: c, icon: Pill }))].map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => navigate("medication-search", { category: cat.id })}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40"
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

      {/* Cart banner */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 pt-3"
          >
            <button
              onClick={() => navigate("cart")}
              className="flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3 text-left transition-all hover:bg-primary/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Reprendre mon panier</p>
                <p className="text-xs text-muted-foreground">
                  {cart.length} article{cart.length > 1 ? "s" : ""} · {cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toLocaleString()} FCFA
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
                    const { latitude, longitude } = pos.coords;
                    setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    useAppStore.getState().setUserPosition([latitude, longitude]);
                    pushToast("Position mise à jour avec précision.", "success");
                  },
                  (err) => {
                    const msg =
                      err.code === err.PERMISSION_DENIED
                        ? "Localisation refusée. Activez-la dans les paramètres."
                        : "Impossible d'obtenir votre position.";
                    pushToast(msg, "error");
                  },
                  { enableHighAccuracy: true, timeout: 10000 }
                );
              } else {
                pushToast("Géolocalisation non disponible.", "error");
              }
            }}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <Locate className="h-3.5 w-3.5" />
            Localiser
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
          <div className="h-carousel px-4 mt-3 pb-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex w-64 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-card p-2.5">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-4 w-36 rounded-full" />
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-3 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : guardPharmacies.length === 0 ? (
          <div className="mx-4 mt-2 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aucune pharmacie de garde pour le moment.
          </div>
        ) : (
          <div className="h-carousel px-4 mt-3 pb-1">
            {guardPharmacies.map((p) => (
              <PharmacyCardCompact
                key={p.id}
                pharmacy={p}
                isFavorite={favoriteIds.has(p.id)}
                onClick={() => navigate("pharmacy-detail", { id: p.id })}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recently viewed */}
      {recentlyViewed.length > 0 && (
        <section className="pt-5 pb-2">
          <div className="flex items-center justify-between px-4">
            <h2 className="flex items-center gap-1.5 text-base font-bold text-foreground">
              <History className="h-4 w-4 text-primary" />
              Récemment consultés
            </h2>
            <button
              onClick={() => navigate("medication-search", { q: "" })}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Voir tout
            </button>
          </div>
          <div className="h-carousel px-4 pt-3 pb-1">
            {recentlyViewed.map((m) => {
              const colors = CATEGORY_COLORS[m.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.Autre;
              return (
                <button
                  key={m.id}
                  onClick={() => navigate("medication-detail", { id: m.id })}
                  className="flex w-36 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  {m.imageUrl ? (
                    <img src={m.imageUrl} alt={m.name} className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Pill className="h-7 w-7" />
                    </div>
                  )}
                  <div>
                    <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                      {m.name}
                    </h3>
                    <span className={cn("mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium", colors.bg, colors.text)}>{m.category}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{m.dosage} · {m.form}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

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
          <div className="h-carousel px-4 mt-3 pb-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex w-36 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-card p-3">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-3 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="h-carousel px-4 mt-3 pb-1">
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
                  <span className={cn("mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium", categoryColor(m.category).bg, categoryColor(m.category).text)}>{m.category}</span>
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
      {/* Barcode scanner overlay */}
      {showScanner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-black" onClick={() => { stopBarcodeScan(); setShowScanner(false); }}>
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative flex flex-1 flex-col" onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between bg-black/80 p-4">
              <h2 className="text-base font-bold text-white">Scanner un code-barres</h2>
              <button
                onClick={() => { stopBarcodeScan(); setShowScanner(false); }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <div className="relative flex flex-1 items-center justify-center">
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              {/* Scan frame */}
              <div className="relative z-10">
                <div className="h-56 w-56 rounded-2xl border-2 border-white/60">
                  <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-primary" />
                  <div className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-primary" />
                  <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-primary" />
                  <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-primary" />
                </div>
                <div className="absolute left-1/2 top-1/2 h-0.5 w-48 -translate-x-1/2 -translate-y-1/2 animate-pulse bg-primary" />
              </div>
              {isScanning && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur">
                  Recherche de code-barres...
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
}
