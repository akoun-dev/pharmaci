"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Star,
  TrendingUp,
  AlertTriangle,
  Clock,
  ChevronRight,
  Loader2,
  Building2,
  MessageSquare,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { DashboardSkeleton } from "@/components/app/dashboard-skeleton";
import { useAppStore } from "@/lib/store";
import { api, formatFCFA } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PharmacistStats {
  pharmacyName: string;
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    ready: number;
    pickedUp: number;
    cancelled: number;
  };
  revenue: number;
  revenueMonth: number;
  monthlyRevenue: { month: string; revenue: number }[];
  stock: {
    totalItems: number;
    lowStock: number;
    inStock: number;
    expiringSoon: number;
    expired: number;
  };
  reviews: {
    total: number;
    average: number;
  };
  recentOrders: Array<{
    id: string;
    code: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    user: { id: string; name: string };
    items: Array<{ medication: { name: string } }>;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  CONFIRMED: "bg-blue-500/10 text-blue-500",
  READY: "bg-green-500/10 text-green-500",
  PICKED_UP: "bg-muted text-muted-foreground",
  CANCELLED: "bg-red-500/10 text-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  READY: "Prête",
  PICKED_UP: "Récupérée",
  CANCELLED: "Annulée",
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-sm font-bold text-primary">{formatFCFA(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

export function PharmacistDashboardScreen() {
  const user = useAppStore((s) => s.user);
  const navigate = useAppStore((s) => s.navigate);
  const [stats, setStats] = useState<PharmacistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<PharmacistStats>(
          `/api/pharmacist/stats?period=${period}`
        );
        setStats(res);
      } catch (err) {
        useAppStore.getState().pushToast(err instanceof Error ? err.message : "Erreur de chargement des statistiques", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [period]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await api.get<PharmacistStats>(
        `/api/pharmacist/stats?period=${period}`
      );
      setStats(res);
    } catch (err) {
      useAppStore.getState().pushToast(err instanceof Error ? err.message : "Erreur de rafraîchissement", "error");
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Espace Pharmacien" showLogo />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <AppHeader title={stats?.pharmacyName || "Espace Pharmacien"} showLogo />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Welcome + refresh */}
        <div className="mb-4 pt-2 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Bonjour</p>
            <h1 className="text-xl font-bold">{user?.name?.split(" ")[0] || "Pharmacien"}</h1>
            <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-medium text-muted-foreground focus:border-primary"
            >
              <option value="all">Tout</option>
              <option value="month">Ce mois</option>
              <option value="week">Cette semaine</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted"
              title="Rafraîchir"
              aria-label="Rafraîchir les données"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Stats grid */}
        {stats && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <Card className="border-primary/10">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ClipboardList className="h-4 w-4" />
                    <span className="text-xs">Commandes</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.orders.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.orders.pending} en attente
                    {stats.orders.pending > 0 && (
                      <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {stats.orders.pending}
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/10">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">Revenus</span>
                  </div>
                  <p className="text-2xl font-bold">{formatFCFA(stats.revenue)}</p>
                  {period !== "all" && (
                    <p className="text-xs text-green-500">
                      +{formatFCFA(stats.revenueMonth)} sur la période
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-primary/10">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Package className="h-4 w-4" />
                    <span className="text-xs">Stock</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.stock.inStock}</p>
                  {stats.stock.lowStock > 0 && (
                    <p className="text-xs text-amber-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {stats.stock.lowStock} en rupture
                    </p>
                  )}
                  {(stats.stock.expired > 0 || stats.stock.expiringSoon > 0) && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {stats.stock.expired} expiré(s) · {stats.stock.expiringSoon} bientôt
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-primary/10">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Star className="h-4 w-4" />
                    <span className="text-xs">Avis</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.reviews.average}/5</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.reviews.total} avis
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue chart */}
            {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
              <Card className="mb-4 border-primary/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-semibold">Évolution des revenus (6 mois)</span>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.monthlyRevenue} barSize={24}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-50" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ className: "stroke-border" }}
                        />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v: number) => (v / 1000).toFixed(0) + "k"}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar
                          dataKey="revenue"
                          fill="oklch(0.55 0.15 150)"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick actions */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">Actions rapides</h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate("pharmacist-stock")}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">Gérer le stock</p>
                      <p className="text-xs text-muted-foreground">{stats?.stock.totalItems || 0} médicaments</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>

                <button
                  onClick={() => navigate("pharmacist-pharmacy")}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Building2 className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">Ma pharmacie</p>
                      <p className="text-xs text-muted-foreground">Paramètres et informations</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>

                <button
                  onClick={() => navigate("messages")}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                      <MessageSquare className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">Messages</p>
                      <p className="text-xs text-muted-foreground">Contacter les patients</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Recent orders */}
            {stats.recentOrders.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-muted-foreground">Commandes récentes</h2>
                  <button
                    onClick={() => useAppStore.getState().setTab("orders")}
                    className="text-xs text-primary font-medium"
                  >
                    Voir tout
                  </button>
                </div>
                <div className="space-y-2">
                  {stats.recentOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => navigate("pharmacist-order-detail", { id: order.id })}
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold">{order.code}</span>
                          <Badge className={cn("text-[10px] px-1.5 py-0", STATUS_COLORS[order.status])}>
                            {STATUS_LABELS[order.status]}
                          </Badge>
                        </div>
                        <p className="text-sm truncate">
                          {order.user.name} — {order.items.map((i) => i.medication.name).join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatFCFA(order.totalAmount)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
