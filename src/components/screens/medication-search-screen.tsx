"use client";

import { useEffect, useState } from "react";
import { Search, ArrowLeft, Pill, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { medicationApi, type Medication } from "@/lib/api";
import { AppHeader } from "@/components/app/app-header";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Tous",
  "Antalgiques",
  "Antibiotiques",
  "Antipaludéens",
  "Vitamines",
  "Pansements",
  "Antihistaminiques",
  "Gastro-entérologie",
];

export function MedicationSearchScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const goBack = useAppStore((s) => s.goBack);
  const params = useAppStore((s) => s.nav.params);
  const addRecentSearch = useAppStore((s) => s.addRecentSearch);

  const [search, setSearch] = useState(params.q || "");
  const [category, setCategory] = useState("Tous");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    void load();
  }, [search, category]);

  async function load() {
    setLoading(true);
    try {
      const res = await medicationApi.list({
        search: search.trim() || undefined,
        category: category !== "Tous" ? category : undefined,
        limit: 50,
      });
      setMedications(res.medications);
      setTotal(res.total);
      if (search.trim()) addRecentSearch(search.trim());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Recherche médicament"
        showBack
      />
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, principe actif..."
            className="h-11 rounded-xl border-primary/20 bg-primary/5 pl-9"
            autoFocus
          />
        </div>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3 pb-1">
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
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
      </div>

      <div className="px-4 pt-3">
        <p className="text-xs text-muted-foreground">
          {loading ? "Recherche..." : `${total} résultat${total > 1 ? "s" : ""} trouvé${total > 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="flex-1 space-y-2 px-4 pt-2 pb-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : medications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Aucun médicament trouvé. Essayez une autre recherche.
            </p>
          </div>
        ) : (
          medications.map((m) => (
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
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {m.category}
                  </span>
                  {m.prescriptionRequired && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      Sur ordonnance
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
