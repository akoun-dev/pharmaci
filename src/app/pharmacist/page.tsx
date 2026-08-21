"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Star,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api, formatFCFA } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  periodRevenue: number;
  totalStock: number;
  lowStockCount: number;
  averageRating: number;
  reviewCount: number;
  topMedications: Array<{ name: string; count: number }>;
  recentOrders: Array<{
    id: string;
    code: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    user: { name: string };
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  READY: "bg-green-100 text-green-700",
  PICKED_UP: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmee",
  READY: "Prete",
  PICKED_UP: "Recuperee",
  CANCELLED: "Annulee",
};

export default function PharmacistDashboardPage() {
  const user = useAppStore((s) => s.user);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<Stats>("/api/pharmacist/stats");
      setStats(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (!stats) return <p className="text-muted-foreground">Erreur de chargement.</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bonjour, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">Voici le resume de votre pharmacie</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Commandes</p>
                <p className="mt-1 text-2xl font-bold">{stats.totalOrders}</p>
                {stats.pendingOrders > 0 && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    <Clock className="h-3 w-3" /> {stats.pendingOrders} en attente
                  </span>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Revenu total</p>
                <p className="mt-1 text-2xl font-bold">{formatFCFA(stats.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">+{formatFCFA(stats.periodRevenue)} ce mois</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Stock</p>
                <p className="mt-1 text-2xl font-bold">{stats.totalStock}</p>
                {stats.lowStockCount > 0 && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    {stats.lowStockCount} en rupture
                  </span>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Avis</p>
                <p className="mt-1 text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">{stats.reviewCount} avis</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Star className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders + Top meds */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Commandes recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucune commande</p>
            ) : (
              <div className="space-y-2">
                {stats.recentOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{o.user?.name || "Client"}</p>
                      <p className="text-xs text-muted-foreground">#{o.code}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[o.status] || "bg-gray-100"}`}>
                        {STATUS_LABELS[o.status] || o.status}
                      </span>
                      <span className="text-sm font-semibold">{formatFCFA(o.totalAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top medications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Medicaments</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topMedications.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucune donnee</p>
            ) : (
              <div className="space-y-3">
                {stats.topMedications.map((m, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium truncate max-w-[150px]">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(m.count / (stats.topMedications[0]?.count || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">{m.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
