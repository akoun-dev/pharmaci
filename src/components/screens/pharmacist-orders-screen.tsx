"use client";

import { useEffect, useState, useRef } from "react";
import {
  Loader2,
  ChevronRight,
  Clock,
  CheckCircle,
  Package,
  XCircle,
  Search,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useAppStore } from "@/lib/store";
import { api, formatFCFA, ORDER_STATUS } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const pushToast = useAppStore((s) => s.pushToast);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    "": 0, PENDING: 0, CONFIRMED: 0, READY: 0, PICKED_UP: 0, CANCELLED: 0,
  });

  // Search
  const [search, setSearch] = useState("");

  // Sort
  const [sortBy, setSortBy] = useState("date");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Confirmation modal
  const [confirmAction, setConfirmAction] = useState<{
    orderId: string;
    newStatus: string;
    label: string;
  } | null>(null);

  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    }
    if (showSortMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSortMenu]);

  useEffect(() => {
    void loadOrders();
  }, [activeTab]);

  useEffect(() => {
    const t = setTimeout(() => void loadOrders(), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function loadOrders() {
    setLoading(true);
    try {
      const q = activeTab ? `?status=${activeTab}` : "";
      const res = await api.get<{ orders: Order[] }>(`/api/pharmacist/orders${q}`);
      let filtered = res.orders;

      // Client-side search
      if (search.trim()) {
        const lower = search.toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.code.toLowerCase().includes(lower) ||
            o.user.name.toLowerCase().includes(lower) ||
            o.user.phone?.toLowerCase().includes(lower)
        );
      }

      // Sort
      filtered.sort((a, b) => {
        if (sortBy === "amount") return b.totalAmount - a.totalAmount;
        if (sortBy === "patient") return a.user.name.localeCompare(b.user.name);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setOrders(filtered);

      // Update status counts (fetch all statuses if on "all" tab)
      if (!activeTab) {
        const counts: Record<string, number> = { "": filtered.length, PENDING: 0, CONFIRMED: 0, READY: 0, PICKED_UP: 0, CANCELLED: 0 };
        for (const o of res.orders) {
          if (counts[o.status] !== undefined) counts[o.status]++;
        }
        setStatusCounts(counts);
      } else {
        setStatusCounts((prev) => ({ ...prev, [activeTab]: filtered.length }));
      }
    } catch (err) {
      useAppStore.getState().pushToast(err instanceof Error ? err.message : "Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleUpdateStatus(orderId: string, newStatus: string) {
    const labels: Record<string, string> = {
      CONFIRMED: "Confirmer cette commande ?",
      READY: "Marquer cette commande comme prête ?",
      CANCELLED: "Annuler cette commande ?",
    };
    setConfirmAction({
      orderId,
      newStatus,
      label: labels[newStatus] || "Confirmer l'action ?",
    });
  }

  async function executeUpdateStatus() {
    if (!confirmAction) return;
    const { orderId, newStatus } = confirmAction;
    setConfirmAction(null);
    setUpdatingId(orderId);
    try {
      await api.put(`/api/pharmacist/orders/${orderId}`, { status: newStatus });
      pushToast(
        newStatus === "CANCELLED" ? "Commande annulée" : "Statut mis à jour",
        newStatus === "CANCELLED" ? "info" : "success"
      );
      void loadOrders();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  function getNextAction(status: string) {
    switch (status) {
      case "PENDING":
        return { label: "Confirmer", status: "CONFIRMED", icon: CheckCircle, color: "text-blue-500" };
      case "CONFIRMED":
        return { label: "Prête", status: "READY", icon: Package, color: "text-green-500" };
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Commandes" />

      <div className="flex-1 overflow-y-auto">
        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par code, patient ou téléphone..."
              className="h-10 pl-9 text-sm"
            />
          </div>
        </div>

        {/* Status tabs + sort */}
        <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
          <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                role="tab"
                aria-selected={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {tab.label} {statusCounts[tab.value] > 0 ? `(${statusCounts[tab.value]})` : ""}
              </button>
            ))}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              aria-expanded={showSortMenu}
              aria-label="Trier les commandes"
              className="flex h-8 items-center gap-1 rounded-lg border border-border bg-card px-2 text-[11px] font-medium text-muted-foreground hover:border-primary/40"
            >
              <ArrowUpDown className="h-3 w-3" />
              {sortBy === "date" ? "Date" : sortBy === "amount" ? "Montant" : "Patient"}
            </button>
            {showSortMenu && (
              <div ref={sortMenuRef} className="absolute right-0 top-full z-20 mt-1 w-32 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                {["date", "amount", "patient"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSortBy(opt); setShowSortMenu(false); }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                      sortBy === opt ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    {opt === "date" ? "Date" : opt === "amount" ? "Montant" : "Patient"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Clock className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">{search ? "Aucune commande trouvée" : "Aucune commande"}</p>
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
                        onClick={() => handleUpdateStatus(order.id, nextAction.status)}
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
                        onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                        disabled={updatingId === order.id}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10"
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

      {/* Confirmation dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(v) => { if (!v) setConfirmAction(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer l&apos;action</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="text-sm text-center font-medium text-foreground">
              {confirmAction?.label}
            </p>
            {confirmAction?.newStatus === "CANCELLED" && (
              <p className="text-xs text-center text-red-500">
                Les stocks seront remis à jour automatiquement.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Annuler</Button>
            <Button
              variant={confirmAction?.newStatus === "CANCELLED" ? "destructive" : "default"}
              onClick={executeUpdateStatus}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
