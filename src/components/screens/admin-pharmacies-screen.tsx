"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Star,
  Building2,
} from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PharmacyItem {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string | null;
  isVerified: boolean;
  isOnGuard: boolean;
  rating: number;
  reviewCount: number;
  phone: string;
  owner: { id: string; name: string; email: string };
  _count: { medications: number; orders: number; reviews: number };
}

export function AdminPharmaciesScreen() {
  const [pharmacies, setPharmacies] = useState<PharmacyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [verifiedCounts, setVerifiedCounts] = useState({ all: 0, verified: 0, unverified: 0 });
  const [verifyTarget, setVerifyTarget] = useState<PharmacyItem | null>(null);

  useEffect(() => {
    void loadPharmacies();
  }, [verifiedFilter, page]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function loadPharmacies() {
    if (page === 1) setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (verifiedFilter) q.set("verified", verifiedFilter);
      q.set("page", String(page));
      q.set("limit", "20");
      const res = await api.get<{ pharmacies: PharmacyItem[]; total: number; totalPages: number }>(
        `/api/admin/pharmacies?${q.toString()}`
      );
      if (page === 1) {
        setPharmacies(res.pharmacies);
      } else {
        setPharmacies((prev) => [...prev, ...res.pharmacies]);
      }
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (page === 1 && !verifiedFilter) {
        setVerifiedCounts((prev) => ({ ...prev, all: res.total }));
      }
      if (page === 1 && verifiedFilter === "true") {
        setVerifiedCounts((prev) => ({ ...prev, verified: res.total }));
      }
      if (page === 1 && verifiedFilter === "false") {
        setVerifiedCounts((prev) => ({ ...prev, unverified: res.total }));
      }
    } catch (err) {
      useAppStore.getState().pushToast(err instanceof Error ? err.message : "Erreur de chargement", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleLoadMore() {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    setPage((p) => p + 1);
  }

  async function confirmToggleVerified() {
    if (!verifyTarget) return;
    const pharmacy = verifyTarget;
    setVerifyTarget(null);
    try {
      await api.put(`/api/admin/pharmacies?id=${pharmacy.id}`, {
        isVerified: !pharmacy.isVerified,
      });
      useAppStore.getState().pushToast(
        pharmacy.isVerified ? "Vérification retirée" : "Pharmacie vérifiée",
        "success"
      );
      void loadPharmacies();
    } catch (err) {
      useAppStore.getState().pushToast(
        err instanceof Error ? err.message : "Erreur",
        "error"
      );
    }
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Pharmacies" />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="flex gap-2 pt-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une pharmacie..."
              className="h-10 pl-9 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-1 mb-3 overflow-x-auto no-scrollbar">
          {[
            { value: "", label: "Toutes", count: verifiedCounts.all },
            { value: "true", label: "Vérifiées", count: verifiedCounts.verified },
            { value: "false", label: "Non vérifiées", count: verifiedCounts.unverified },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setVerifiedFilter(tab.value); setPage(1); }}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                verifiedFilter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : pharmacies.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Building2 className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Aucune pharmacie trouvée</p>
          </div>
        ) : (
          <>
          <div className="space-y-2">
            {pharmacies.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "rounded-xl border bg-card p-3",
                  !p.isVerified && "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      {p.isVerified ? (
                        <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-0.5" /> Vérifiée
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700">
                          Non vérifiée
                        </Badge>
                      )}
                      {p.isOnGuard && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700">Garde</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.address}, {p.city}</p>
                    <p className="text-xs text-muted-foreground">
                      Propriétaire: {p.owner.name} ({p.owner.email})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    {p.rating} ({p.reviewCount})
                  </span>
                  <span>{p._count.medications} médicaments</span>
                  <span>{p._count.orders} commandes</span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setVerifyTarget(p)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      p.isVerified
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    )}
                  >
                    {p.isVerified ? (
                      <><XCircle className="h-3 w-3" /> Retirer la vérification</>
                    ) : (
                      <><CheckCircle className="h-3 w-3" /> Vérifier</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {page < totalPages && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 active:bg-muted/50 mt-3"
            >
              {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Voir plus"}
            </button>
          )}
        </>
        )}
      </div>

      <AlertDialog open={!!verifyTarget} onOpenChange={(v) => { if (!v) setVerifyTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {verifyTarget?.isVerified ? "Retirer la vérification ?" : "Vérifier cette pharmacie ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {verifyTarget?.isVerified
                ? `La pharmacie « ${verifyTarget?.name} » ne sera plus marquée comme vérifiée.`
                : `La pharmacie « ${verifyTarget?.name} » sera marquée comme vérifiée et apparaîtra comme fiable pour les patients.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmToggleVerified()}>
              {verifyTarget?.isVerified ? "Retirer" : "Vérifier"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
