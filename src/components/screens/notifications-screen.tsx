"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Loader2,
  Clock,
  Package,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  orderApi,
  type Order,
  ORDER_STATUS,
  formatFCFA,
  formatRelative,
  notificationMessage,
} from "@/lib/api";
import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function NotificationsScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const setNotificationCount = useAppStore((s) => s.setNotificationCount);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    void load();
  }, [user]);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const res = await orderApi.list();
      const active = res.orders.filter(
        (o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "READY"
      );
      setOrders(active);
      setNotificationCount(0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function statusIcon(status: string) {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "CONFIRMED":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "READY":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "PICKED_UP":
        return <CheckCircle2 className="h-4 w-4 text-gray-400" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Notifications"
        showBack
        showCart
      />

      {!user && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <Bell className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Connectez-vous pour voir vos notifications.
          </p>
        </div>
      )}

      {user && (
        <div className="flex-1 px-4 pt-3 pb-6">
          {/* Header info */}
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              {orders.length > 0
                ? `${orders.length} notification${orders.length > 1 ? "s" : ""} active${orders.length > 1 ? "s" : ""}`
                : "Aucune notification"}
            </h2>
            <button
              onClick={() => useAppStore.getState().setTab("orders")}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Toutes les commandes
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-3">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32 rounded-full" />
                      <Skeleton className="h-3 w-48 rounded-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Erreur lors du chargement.
              </p>
              <Button
                onClick={load}
                size="sm"
                className="mt-1 rounded-xl bg-primary text-xs text-primary-foreground"
              >
                Réessayer
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bell className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Tout est calme
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Vous serez notifié quand le statut d&apos;une commande changera.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => navigate("notification-detail", { id: o.id })}
                  className="w-full rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        o.status === "PENDING" && "bg-amber-100",
                        o.status === "CONFIRMED" && "bg-blue-100",
                        o.status === "READY" && "bg-green-100",
                        o.status === "CANCELLED" && "bg-red-100",
                        o.status === "PICKED_UP" && "bg-gray-100"
                      )}
                    >
                      {statusIcon(o.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {notificationMessage(
                            o.status,
                            o.pharmacy?.name || "Pharmacie",
                            o.code
                          )}
                        </p>
                        <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">
                          {formatRelative(o.updatedAt || o.createdAt)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            ORDER_STATUS[o.status].color
                          )}
                        >
                          {ORDER_STATUS[o.status].label}
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          {formatFCFA(o.totalAmount)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
