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
} from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useAppStore } from "@/lib/store";
import { api, formatFCFA } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PharmacistStats {
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    ready: number;
    pickedUp: number;
    cancelled: number;
  };
  revenue: number;
  stock: {
    totalItems: number;
    lowStock: number;
    inStock: number;
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
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  READY: "bg-green-100 text-green-700",
  PICKED_UP: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  READY: "Prête",
  PICKED_UP: "Récupérée",
  CANCELLED: "Annulée",
};

export function PharmacistDashboardScreen() {
  const user = useAppStore((s) => s.user);
  const navigate = useAppStore((s) => s.navigate);
  const [stats, setStats] = useState<PharmacistStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const res = await api.get<PharmacistStats>("/api/pharmacist/stats");
      setStats(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <AppHeader title="Espace Pharmacien" />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Welcome */}
        <div className="mb-4 pt-2">
          <p className="text-sm text-muted-foreground">Bonjour</p>
          <h1 className="text-xl font-bold">{user?.name || "Pharmacien"}</h1>
        </div>

        {/* Stats grid */}
        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <Card className="border-primary/10">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <ClipboardList className="h-4 w-4" />
                  <span className="text-xs">Commandes</span>
                </div>
                <p className="text-2xl font-bold">{stats.orders.total}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.orders.pending} en attente
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
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {stats.stock.lowStock} en rupture
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
                  <Building2 className="h-5 w-5 text-blue-600" />
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
        {stats && stats.recentOrders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Commandes récentes</h2>
              <button
                onClick={() => {
                  useAppStore.getState().setTab("orders");
                }}
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
                    <p className="text-xs text-muted-foreground">
                      {formatFCFA(order.totalAmount)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
