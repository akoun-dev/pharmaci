"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  ChevronRight,
  Clock,
  CheckCircle,
  Package,
  XCircle,
} from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useAppStore } from "@/lib/store";
import { api, formatFCFA, ORDER_STATUS } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  medication: { id: string; name: string; form: string };
}

interface Order {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  user: { id: string; name: string; phone: string | null; email: string };
  items: OrderItem[];
}

const TABS = [
  { value: "", label: "Toutes" },
  { value: "PENDING", label: "En attente" },
  { value: "CONFIRMED", label: "Confirmées" },
  { value: "READY", label: "Prêtes" },
  { value: "PICKED_UP", label: "Récupérées" },
  { value: "CANCELLED", label: "Annulées" },
];

export function PharmacistOrdersScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    void loadOrders();
  }, [activeTab]);

  async function loadOrders() {
    setLoading(true);
    try {
      const q = activeTab ? `?status=${activeTab}` : "";
      const res = await api.get<{ orders: Order[] }>(`/api/pharmacist/orders${q}`);
      setOrders(res.orders);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    try {
      await api.put(`/api/pharmacist/orders/${orderId}`, { status: newStatus });
      void loadOrders();
    } catch (err) {
      useAppStore.getState().pushToast(
        err instanceof Error ? err.message : "Erreur",
        "error"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function getNextAction(status: string) {
    switch (status) {
      case "PENDING":
        return { label: "Confirmer", status: "CONFIRMED", icon: CheckCircle, color: "text-blue-600" };
      case "CONFIRMED":
        return { label: "Prête", status: "READY", icon: Package, color: "text-green-600" };
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Commandes" />

      <div className="flex-1 overflow-y-auto">
        {/* Status tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Clock className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Aucune commande</p>
          </div>
        ) : (
          <div className="px-4 space-y-2 pb-6">
            {orders.map((order) => {
              const nextAction = getNextAction(order.status);
              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold">{order.code}</span>
                        <Badge
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.color
                          )}
                        >
                          {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.label}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1 font-medium">{order.user.name}</p>
                      {order.user.phone && (
                        <p className="text-xs text-muted-foreground">{order.user.phone}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatFCFA(order.totalAmount)}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground mb-2">
                    {order.items.map((i) => `${i.medication.name} ×${i.quantity}`).join(", ")}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigate("pharmacist-order-detail", { id: order.id })}
                      className="text-xs text-primary font-medium flex items-center gap-1"
                    >
                      Détails <ChevronRight className="h-3 w-3" />
                    </button>

                    {nextAction && (
                      <button
                        onClick={() => void updateStatus(order.id, nextAction.status)}
                        disabled={updatingId === order.id}
                        className={cn(
                          "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          "bg-primary/10 text-primary hover:bg-primary/20",
                          updatingId === order.id && "opacity-50"
                        )}
                      >
                        {updatingId === order.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <nextAction.icon className={cn("h-3 w-3", nextAction.color)} />
                        )}
                        {nextAction.label}
                      </button>
                    )}

                    {order.status === "PENDING" && (
                      <button
                        onClick={() => void updateStatus(order.id, "CANCELLED")}
                        disabled={updatingId === order.id}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-3 w-3" />
                        Refuser
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
