"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  Loader2,
  AlertCircle,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  QrCode,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  orderApi,
  type Order,
  ORDER_STATUS,
  formatFCFA,
  formatDate,
} from "@/lib/api";
import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { id: "ALL", label: "Toutes" },
  { id: "PENDING", label: "En attente" },
  { id: "CONFIRMED", label: "Confirmées" },
  { id: "READY", label: "Prêtes" },
  { id: "PICKED_UP", label: "Récupérées" },
  { id: "CANCELLED", label: "Annulées" },
];

export function OrdersScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const cart = useAppStore((s) => s.cart);
  const cartTotal = useAppStore((s) => s.cartTotal());

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (user) void load();
    else setLoading(false);
  }, [user, filter]);

  async function load() {
    setLoading(true);
    try {
      const res = await orderApi.list({
        status: filter !== "ALL" ? filter : undefined,
      });
      setOrders(res.orders);
    } catch {
      // ignore
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
      <AppHeader title="Mes commandes" showCart />
      {!user && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Connectez-vous pour voir vos commandes.
          </p>
        </div>
      )}

      {user && (
        <>
          {/* Cart summary (if items) */}
          {cart.length > 0 && (
            <div className="px-4 pt-3">
              <button
                onClick={() => navigate("cart")}
                className="flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3 text-left transition-colors hover:bg-primary/10"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Panier ({cart.length} article{cart.length > 1 ? "s" : ""})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total: {formatFCFA(cartTotal)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-primary" />
              </button>
            </div>
          )}

          {/* Filter tabs */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3 pb-1">
            {STATUS_FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Orders list */}
          <div className="flex-1 space-y-3 px-4 pt-3 pb-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-20 rounded-full" />
                        <Skeleton className="h-4 w-40 rounded-full" />
                        <Skeleton className="h-3 w-32 rounded-full" />
                      </div>
                      <div className="space-y-2 text-right">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-3 w-12 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Aucune commande.</p>
                <Button
                  onClick={() => useAppStore.getState().setTab("home")}
                  className="mt-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Commander un médicament
                </Button>
              </div>
            ) : (
              orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => navigate("order-detail", { id: o.id })}
                  className="block w-full rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(o.status)}
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            ORDER_STATUS[o.status].color
                          )}
                        >
                          {ORDER_STATUS[o.status].label}
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-sm font-bold text-foreground">
                        {o.pharmacy?.name || "Pharmacie"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(o.createdAt)}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-primary">{o.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-foreground">
                        {formatFCFA(o.totalAmount)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {o.items?.length || 0} article{(o.items?.length || 0) > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
