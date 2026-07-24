"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, ClipboardList, Eye } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useAppStore } from "@/lib/store";
import { api, formatFCFA, ORDER_STATUS } from "@/lib/api";
import { Input } from "@/components/ui/input";
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    void loadOrders();
  }, [activeTab, page]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); void loadOrders(); }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  async function loadOrders() {
    if (page === 1) setLoading(true);
    try {
      const q = new URLSearchParams();
      if (activeTab) q.set("status", activeTab);
      if (searchQuery.trim()) q.set("search", searchQuery.trim());
      q.set("page", String(page));
      q.set("limit", "20");
      const res = await api.get<{ orders: Order[]; total: number; page: number; totalPages: number }>(
        `/api/admin/orders?${q.toString()}`
      );
      if (page === 1) {
        setOrders(res.orders);
      } else {
        setOrders((prev) => [...prev, ...res.orders]);
      }
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleLoadMore() {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    setPage((p) => p + 1);
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Commandes" />

      <div className="flex-1 overflow-y-auto">
        {/* Search */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par code, client ou pharmacie..."
              className="h-10 pl-9 text-sm"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setPage(1); }}
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

        {/* Result count */}
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground">
            {loading ? "Chargement..." : `${total} commande${total > 1 ? "s" : ""}`}
          </p>
        </div>

        {loading && page === 1 ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">{searchQuery ? "Aucun résultat" : "Aucune commande"}</p>
          </div>
        ) : (
          <div className="px-4 space-y-2 pb-6">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => navigate("order-detail", { id: order.id })}
                className="w-full rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:shadow-sm"
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
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </button>
            ))}
            {page < totalPages && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 active:bg-muted/50"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Voir plus"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
