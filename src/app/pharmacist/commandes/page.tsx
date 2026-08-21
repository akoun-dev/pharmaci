"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  Search,
  CheckCircle2,
  Package,
  Clock,
  XCircle,
  Eye,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api, formatFCFA, formatRelative, ORDER_STATUS, notificationMessage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  user: { name: string; phone?: string };
  items: Array<{ medicationName: string; quantity: number; price: number }>;
}

const STATUS_ICONS: Record<string, typeof Clock> = {
  PENDING: Clock,
  CONFIRMED: Package,
  READY: CheckCircle2,
  PICKED_UP: CheckCircle2,
  CANCELLED: XCircle,
};

const ALLOWED_TRANSITIONS: Record<string, { next: string; label: string }[]> = {
  PENDING: [
    { next: "CONFIRMED", label: "Confirmer" },
    { next: "CANCELLED", label: "Refuser" },
  ],
  CONFIRMED: [{ next: "READY", label: "Prete" }],
  READY: [{ next: "PICKED_UP", label: "Recuperee" }],
};

export default function PharmacistOrdersPage() {
  const pushToast = useAppStore((s) => s.pushToast);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updating, setUpdating] = useState<string | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ orders: Order[] }>("/api/pharmacist/orders?limit=200");
      setOrders(res.orders);
    } catch {
      pushToast("Erreur de chargement.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId);
    try {
      await api.put(`/api/pharmacist/orders/${orderId}`, { status: newStatus });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      pushToast("Statut mis a jour.", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setUpdating(null);
    }
  }

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.code.toLowerCase().includes(search.toLowerCase()) || o.user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    ALL: orders.length,
    PENDING: orders.filter((o) => o.status === "PENDING").length,
    CONFIRMED: orders.filter((o) => o.status === "CONFIRMED").length,
    READY: orders.filter((o) => o.status === "READY").length,
    PICKED_UP: orders.filter((o) => o.status === "PICKED_UP").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commandes</h1>
        <p className="text-sm text-muted-foreground">{orders.length} commande(s) au total</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "PENDING", "CONFIRMED", "READY", "PICKED_UP"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {s === "ALL" ? "Toutes" : ORDER_STATUS[s]?.label || s} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par code ou patient..." className="pl-9" />
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Aucune commande.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => {
            const Icon = STATUS_ICONS[o.status] || Clock;
            const transitions = ALLOWED_TRANSITIONS[o.status] || [];
            return (
              <Card key={o.id}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", ORDER_STATUS[o.status]?.bg || "bg-muted")}>
                    <Icon className={cn("h-5 w-5", ORDER_STATUS[o.status]?.textColor || "text-muted-foreground")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">#{o.code}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", ORDER_STATUS[o.status]?.color || "bg-gray-100 text-gray-600")}>
                        {ORDER_STATUS[o.status]?.label || o.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{o.user?.name || "Client"} - {formatRelative(o.updatedAt || o.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">{o.items?.length || 0} article(s) - {formatFCFA(o.totalAmount)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {transitions.map((t) => (
                      <Button
                        key={t.next}
                        size="sm"
                        variant={t.next === "CANCELLED" ? "destructive" : "default"}
                        disabled={updating === o.id}
                        onClick={() => updateStatus(o.id, t.next)}
                        className="h-8 text-xs"
                      >
                        {updating === o.id ? <Loader2 className="h-3 w-3 animate-spin" /> : t.label}
                      </Button>
                    ))}
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => setDetail(o)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Commande #{detail.code}</h2>
                <Button variant="ghost" size="sm" onClick={() => setDetail(null)}>Fermer</Button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span className="font-medium">{detail.user?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Telephone</span><span className="font-medium">{detail.user?.phone || "-"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Statut</span><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", ORDER_STATUS[detail.status]?.color)}>{ORDER_STATUS[detail.status]?.label}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold">{formatFCFA(detail.totalAmount)}</span></div>
                <hr className="border-border" />
                <p className="font-semibold">Articles</p>
                {detail.items?.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{it.medicationName} x{it.quantity}</span>
                    <span>{formatFCFA(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
