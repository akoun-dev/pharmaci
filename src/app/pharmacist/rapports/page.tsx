"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, TrendingUp, Package, DollarSign, ShoppingCart } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api, formatFCFA } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportStats {
  totalOrders: number;
  totalRevenue: number;
  periodRevenue: number;
  totalStock: number;
  lowStockCount: number;
  averageRating: number;
  reviewCount: number;
  topMedications: Array<{ name: string; count: number }>;
}

export default function PharmacistReportsPage() {
  const pushToast = useAppStore((s) => s.pushToast);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<ReportStats>("/api/pharmacist/stats");
      setStats(res);
    } catch {
      pushToast("Erreur de chargement.", "error");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return <p className="text-muted-foreground">Erreur de chargement.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rapports</h1>
          <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de votre activite</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Commandes totales</p>
                <p className="text-xl font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenu total</p>
                <p className="text-xl font-bold">{formatFCFA(stats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Articles en stock</p>
                <p className="text-xl font-bold">{stats.totalStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top medications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Medicaments les plus commandes</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topMedications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucune donnee</p>
          ) : (
            <div className="space-y-3">
              {stats.topMedications.map((m, i) => {
                const maxCount = stats.topMedications[0]?.count || 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(m.count / maxCount) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground">{m.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Revenu mensuel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatFCFA(stats.periodRevenue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Ce mois-ci</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Avis clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
              <span className="text-sm text-muted-foreground">/ 5</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{stats.reviewCount} avis recus</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
