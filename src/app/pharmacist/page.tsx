"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Package,
  Star,
  TrendingUp,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api, formatFCFA } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  pharmacyName: string;
  orders: { total: number; pending: number; confirmed: number; ready: number; pickedUp: number; cancelled: number };
  revenue: number;
  revenueMonth: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  stock: { totalItems: number; lowStock: number; inStock: number; expiringSoon: number; expired: number };
  reviews: { total: number; average: number };
  recentOrders: Array<{
    id: string;
    code: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    user: { name: string };
    items: Array<{ medication: { name: string } }>;
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
  const [period, setPeriod] = useState("all");

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<Stats>(`/api/pharmacist/stats?period=${period}`);
      setStats(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [period]);

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Bonjour, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">Voici le résumé de {stats.pharmacyName}</p>
        <div className="mt-4 flex items-center gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-semibold">
            <option value="all">Toute la période</option>
            <option value="month">Ce mois</option>
            <option value="week">Cette semaine</option>
          </select>
          <button onClick={() => void load()} className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:bg-muted"><RefreshCw className="h-3.5 w-3.5" /> Actualiser</button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Commandes</p>
                <p className="mt-1 text-2xl font-bold">{stats.orders.total}</p>
                {stats.orders.pending > 0 && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    <Clock className="h-3 w-3" /> {stats.orders.pending} en attente
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
                <p className="mt-1 text-2xl font-bold">{formatFCFA(stats.revenue)}</p>
                <p className="text-xs text-muted-foreground">+{formatFCFA(stats.revenueMonth)} sur la période</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Stock</p>
                <p className="mt-1 text-2xl font-bold">{stats.stock.inStock}</p>
                {stats.stock.lowStock > 0 && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    {stats.stock.lowStock} stock bas
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
                <p className="mt-1 text-2xl font-bold">{stats.reviews.average.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">{stats.reviews.total} avis</p>
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

        {/* Revenue overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Revenus sur 6 mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.monthlyRevenue.map((month) => {
                const max = Math.max(...stats.monthlyRevenue.map((item) => item.revenue), 1);
                return <div key={month.month} className="space-y-1.5"><div className="flex justify-between text-xs"><span className="font-medium">{month.month}</span><span className="text-muted-foreground">{formatFCFA(month.revenue)}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(month.revenue / max) * 100}%` }} /></div></div>;
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
