"use client";

import { useEffect, useState } from "react";
import { Loader2, ChevronRight, ClipboardList } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useAppStore } from "@/lib/store";
import { api, formatFCFA, ORDER_STATUS } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  user: { id: string; name: string; email: string };
  pharmacy: { id: string; name: string; city: string };
  items: Array<{ id: string; quantity: number; medication: { name: string } }>;
}

const TABS = [
  { value: "", label: "Toutes" },
  { value: "PENDING", label: "En attente" },
  { value: "CONFIRMED", label: "Confirmées" },
  { value: "READY", label: "Prêtes" },
  { value: "PICKED_UP", label: "Récupérées" },
  { value: "CANCELLED", label: "Annulées" },
];

export function AdminOrdersScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    void loadOrders();
  }, [activeTab]);

  async function loadOrders() {
    setLoading(true);
    try {
      const q = activeTab ? `?status=${activeTab}` : "";
      const res = await api.get<{ orders: Order[] }>(`/api/admin/orders${q}`);
      setOrders(res.orders);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Commandes" />

      <div className="flex-1 overflow-y-auto">
        <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
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
            <ClipboardList className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Aucune commande</p>
          </div>
        ) : (
          <div className="px-4 space-y-2 pb-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between mb-1">
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
                  <span className="text-xs font-semibold text-primary">{formatFCFA(order.totalAmount)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {order.user.name} → {order.pharmacy.name} ({order.pharmacy.city})
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {order.items.map((i) => `${i.medication.name} ×${i.quantity}`).join(", ")}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
