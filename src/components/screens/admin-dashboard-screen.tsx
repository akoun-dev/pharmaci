"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  TrendingUp,
  Loader2,
  ChevronRight,
  Star,
  AlertTriangle,
} from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { DashboardSkeleton } from "@/components/app/dashboard-skeleton";
import { useAppStore } from "@/lib/store";
import { api, formatFCFA, ORDER_STATUS } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
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

interface AdminStats {
  users: { total: number; patients: number; pharmacists: number; admins: number };
  pharmacies: { total: number; verified: number };
  medications: number;
  orders: { total: number; pending: number };
  revenue: number;
  recentOrders: Array<{
    id: string;
    code: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    user: { id: string; name: string };
    pharmacy: { id: string; name: string };
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  topPharmacies: Array<{
    id: string;
    name: string;
    city: string;
    rating: number;
    reviewCount: number;
  }>;
}

const ROLE_LABELS: Record<string, string> = {
  PATIENT: "Patient",
  PHARMACIST: "Pharmacien",
  ADMIN: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  PATIENT: "bg-blue-100 text-blue-700",
  PHARMACIST: "bg-green-100 text-green-700",
  ADMIN: "bg-purple-100 text-purple-700",
};

export function AdminDashboardScreen() {
  const user = useAppStore((s) => s.user);
  const navigate = useAppStore((s) => s.navigate);
  const pushToast = useAppStore((s) => s.pushToast);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get<AdminStats>("/api/admin/stats");
      setStats(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de chargement des statistiques";
      pushToast(msg, "error");
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Administration" />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-dvh items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <div>
          <p className="text-sm font-semibold text-foreground">Erreur de chargement</p>
          <p className="text-xs text-muted-foreground mt-1">Impossible de charger les statistiques.</p>
        </div>
        <button
          onClick={() => void loadStats()}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <AppHeader title="Administration" />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="mb-4 pt-2">
          <p className="text-sm text-muted-foreground">Bonjour</p>
          <h1 className="text-xl font-bold">{user?.name || "Admin"}</h1>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <Card className="border-primary/10">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Utilisateurs</span>
                </div>
                <p className="text-2xl font-bold">{stats.users.total}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.users.patients} patients · {stats.users.pharmacists} pharmaciens
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Building2 className="h-4 w-4" />
                  <span className="text-xs">Pharmacies</span>
                </div>
                <p className="text-2xl font-bold">{stats.pharmacies.total}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.pharmacies.verified} vérifiées
                </p>
              </CardContent>
            </Card>

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
          </div>
        )}

        {/* Recent orders */}
        {stats && stats.recentOrders && stats.recentOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Dernières commandes</h2>
            <div className="space-y-2">
              {stats.recentOrders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => navigate("order-detail", { id: o.id })}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">{o.code}</span>
                      <Badge
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          ORDER_STATUS[o.status as keyof typeof ORDER_STATUS]?.color
                        )}
                      >
                        {ORDER_STATUS[o.status as keyof typeof ORDER_STATUS]?.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {o.user.name} → {o.pharmacy.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-bold text-primary">{formatFCFA(o.totalAmount)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Gestion</h2>
          <div className="space-y-2">
            <button
              onClick={() => navigate("admin-users")}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Utilisateurs</p>
                  <p className="text-xs text-muted-foreground">Gérer les comptes</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => navigate("admin-pharmacies")}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Pharmacies</p>
                  <p className="text-xs text-muted-foreground">Vérifier et gérer</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => navigate("admin-orders")}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <ClipboardList className="h-5 w-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Commandes</p>
                  <p className="text-xs text-muted-foreground">Suivi global</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Top pharmacies */}
        {stats && stats.topPharmacies.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Top pharmacies</h2>
            <div className="space-y-2">
              {stats.topPharmacies.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.city}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium">{p.rating}</span>
                    <span className="text-xs text-muted-foreground">({p.reviewCount})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent users */}
        {stats && stats.recentUsers.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Derniers inscrits</h2>
            <div className="space-y-2">
              {stats.recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge className={cn("text-[10px] px-1.5 py-0", ROLE_COLORS[u.role])}>
                    {ROLE_LABELS[u.role]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
