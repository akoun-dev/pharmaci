"use client";

import { useEffect, useState, useRef } from "react";
import {
  Search,
  Pill,
  Loader2,
  Mic,
  ArrowUpDown,
  TrendingDown,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { medicationApi, type Medication, formatFCFA } from "@/lib/api";
import { AppHeader } from "@/components/app/app-header";
import { cn, categoryColor } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { EmptyState } from "@/components/ui/empty-state";
import { VoiceModal } from "@/components/app/voice-modal";

export function MedicationSearchScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const params = useAppStore((s) => s.nav.params);
  const addRecentSearch = useAppStore((s) => s.addRecentSearch);
  const pushToast = useAppStore((s) => s.pushToast);
  const user = useAppStore((s) => s.user);

  const [search, setSearch] = useState(params.q || "");
  const [category, setCategory] = useState(params.category || "Tous");
  const [categories, setCategories] = useState<string[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<"name" | "popular">("name");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [prescriptionOnly, setPrescriptionOnly] = useState(false);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: (transcript) => {
      setSearch(transcript);
    },
  });

  const [suggestions, setSuggestions] = useState<Medication[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);
  const [focusedIdx, setFocusedIdx] = useState(-1);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [search, category, sort, prescriptionOnly]);

  useEffect(() => {
    if (!search.trim() || showSuggestions) {
      const timer = setTimeout(() => void fetchSuggestions(), 150);
      return () => clearTimeout(timer);
    }
  }, [search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestRef.current &&
        !suggestRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchSuggestions() {
    const q = search.trim();
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSuggestLoading(true);
    try {
      const res = await medicationApi.list({
        search: q,
        limit: 8,
      });
      setSuggestions(res.medications);
      setShowSuggestions(res.medications.length > 0);
      setFocusedIdx(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  }

  function handleSelect(m: Medication) {
    setShowSuggestions(false);
    setSearch(m.name);
    navigate("medication-detail", { id: m.id });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && focusedIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[focusedIdx]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  async function load() {
    setLoading(true);
    setPage(1);
    try {
      const [res, catRes] = await Promise.all([
        medicationApi.list({
          search: search.trim() || undefined,
          category: category !== "Tous" ? category : undefined,
          sort: sort !== "name" ? sort : undefined,
          prescriptionOnly: prescriptionOnly || undefined,
          page: 1,
          limit: 20,
        }),
        medicationApi.categories(),
      ]);
      setMedications(res.medications);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setCategories(catRes.categories);
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
      const res = await medicationApi.list({
        search: search.trim() || undefined,
        category: category !== "Tous" ? category : undefined,
        sort: sort !== "name" ? sort : undefined,
        prescriptionOnly: prescriptionOnly || undefined,
        page: nextPage,
        limit: 20,
      });
      setMedications((prev) => [...prev, ...res.medications]);
      setPage(nextPage);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur de chargement", "error");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex flex-col">
      <VoiceModal open={isListening} />
      <AppHeader
        title="Recherche médicament"
        showBack
        showCart
      />
      <div className="px-4 pt-3">
        <div className="relative" ref={inputRef}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            placeholder="Nom, principe actif..."
            className="h-11 rounded-xl border-primary/20 bg-primary/5 pl-9 pr-12"
            autoFocus
          />
          {user && (
            <button
              onPointerDown={startListening}
              onPointerUp={stopListening}
              onPointerLeave={stopListening}
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
              ) : (
                suggestions.map((m, i) => (
                  <button
                    key={m.id}
                    role="option"
                    aria-selected={i === focusedIdx}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(m); }}
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
                    <div className="flex shrink-0 items-center gap-1.5">
                      {m.minPrice != null && (
                        <span className="text-[10px] font-semibold text-green-500">{formatFCFA(m.minPrice)}</span>
                      )}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {m.category}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3 pb-1">
        {["Tous", ...categories].map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              aria-pressed={active}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              {cat}
            </button>
          );
        })}
        {/* Prescription filter */}
        <button
          onClick={() => setPrescriptionOnly((v) => !v)}
          aria-pressed={prescriptionOnly}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1",
            prescriptionOnly
              ? "border-amber-500 bg-amber-500/10 text-amber-500"
              : "border-border bg-card text-muted-foreground hover:border-primary/40"
          )}
        >
          <FileText className="h-3 w-3" />
          Ordonnance
        </button>
      </div>

      {/* Sort controls */}
      <div className="relative px-4 pt-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {loading ? "Recherche..." : `${total} résultat${total > 1 ? "s" : ""} trouvé${total > 1 ? "s" : ""}`}
          </p>
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              aria-expanded={showSortMenu}
              aria-label="Trier les résultats"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40"
            >
              <ArrowUpDown className="h-3 w-3" />
              {sort === "name" ? "Nom" : "Populaire"}
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                <button
                  onClick={() => { setSort("name"); setShowSortMenu(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                    sort === "name" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                  )}
                >
                  <ArrowUpDown className="h-3 w-3" />
                  Par nom
                </button>
                <button
                  onClick={() => { setSort("popular"); setShowSortMenu(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                    sort === "popular" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                  )}
                >
                  <TrendingDown className="h-3 w-3" />
                  Plus populaires
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2 px-4 pt-2 pb-6">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-full" />
                  <Skeleton className="h-3 w-1/2 rounded-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : medications.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucun médicament trouvé"
            description="Essayez une autre recherche ou modifiez vos filtres."
            action={search.trim() ? { label: "Effacer la recherche", onClick: () => setSearch("") } : undefined}
          />
        ) : (
          <>
            {medications.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate("medication-detail", { id: m.id })}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm"
            >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Pill className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">{m.name}</h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.activeIngredient} • {m.dosage} • {m.form}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", categoryColor(m.category).bg, categoryColor(m.category).text)}>
                      {m.category}
                    </span>
                    {m.prescriptionRequired && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                        Sur ordonnance
                      </span>
                    )}
                    {m.minPrice != null && (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-500">
                        À partir de {formatFCFA(m.minPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {page < totalPages && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 active:bg-muted/50"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Voir plus"
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
