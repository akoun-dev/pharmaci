"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  Clock,
  Package,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  orderApi,
  type Order,
  ORDER_STATUS,
  notificationMessage,
  formatFCFA,
  formatRelative,
} from "@/lib/api";
import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_STEPS = [
  { key: "PENDING", label: "En attente", icon: Clock },
  { key: "CONFIRMED", label: "Confirmée", icon: Package },
  { key: "READY", label: "Prête", icon: CheckCircle2 },
  { key: "PICKED_UP", label: "Récupérée", icon: CheckCircle2 },
];

export function NotificationDetailScreen() {
  const params = useAppStore((s) => s.nav.params);
  const navigate = useAppStore((s) => s.navigate);
  const pushToast = useAppStore((s) => s.pushToast);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    void load();
  }, [params.id]);

  async function load() {
    setLoading(true);
    try {
      const res = await orderApi.get(params.id);
      setOrder(res.order);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Notification" showBack />
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Notification" showBack />
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Notification introuvable.</p>
        </div>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "CANCELLED";
  const isPickedUp = order.status === "PICKED_UP";
  const activeStatuses: Order["status"][] = ["PENDING", "CONFIRMED", "READY"];
  const isActive = activeStatuses.includes(order.status);

  return (
    <div className="flex flex-col">
      <AppHeader title="Notification" showBack />

      <div className="flex-1 space-y-4 px-4 pt-3 pb-6">
        {/* Hero notification card */}
        <div
          className={cn(
            "overflow-hidden rounded-2xl border p-5",
            order.status === "PENDING" && "border-amber-200 bg-amber-50",
            order.status === "CONFIRMED" && "border-blue-200 bg-blue-50",
            order.status === "READY" && "border-green-200 bg-green-50",
            isCancelled && "border-red-200 bg-red-50",
            isPickedUp && "border-gray-200 bg-gray-50"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                order.status === "PENDING" && "bg-amber-100 text-amber-600",
                order.status === "CONFIRMED" && "bg-blue-100 text-blue-600",
                order.status === "READY" && "bg-green-100 text-green-600",
                isCancelled && "bg-red-100 text-red-600",
                isPickedUp && "bg-gray-100 text-gray-500"
              )}
            >
              {order.status === "PENDING" && <Clock className="h-6 w-6" />}
              {order.status === "CONFIRMED" && <Package className="h-6 w-6" />}
              {order.status === "READY" && <CheckCircle2 className="h-6 w-6" />}
              {isCancelled && <XCircle className="h-6 w-6" />}
              {isPickedUp && <CheckCircle2 className="h-6 w-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                  ORDER_STATUS[order.status].color
                )}
              >
                {ORDER_STATUS[order.status].label}
              </span>
              <p className="mt-2 text-sm font-medium text-foreground leading-relaxed">
                {notificationMessage(order.status, order.pharmacy?.name || "Pharmacie", order.code)}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {formatRelative(order.updatedAt || order.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Status timeline (only for active non-cancelled orders) */}
        {isActive && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
              Suivi de commande
            </h3>
            <div className="flex items-center justify-between">
              {STATUS_STEPS.slice(0, 3).map((step, idx) => {
                const isDone = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      {idx > 0 && (
                        <div className={cn("h-0.5 flex-1", idx <= currentStepIdx ? "bg-primary" : "bg-border")} />
                      )}
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all",
                          isDone
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground",
                          isCurrent && "ring-4 ring-primary/20"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      {idx < STATUS_STEPS.length - 2 && (
                        <div className={cn("h-0.5 flex-1", idx < currentStepIdx ? "bg-primary" : "bg-border")} />
                      )}
                    </div>
                    <span className={cn("mt-1 text-[10px] font-semibold", isDone ? "text-foreground" : "text-muted-foreground")}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancelled notice */}
        {isCancelled && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <XCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium">Cette commande a été annulée.</p>
          </div>
        )}

        {/* Picked up notice */}
        {isPickedUp && (
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="font-medium">Vous avez récupéré cette commande.</p>
          </div>
        )}

        {/* Pharmacy card */}
        {order.pharmacy && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Pharmacie
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                {order.pharmacy.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {order.pharmacy.name}
                </p>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {order.pharmacy.address}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={`tel:${order.pharmacy.phone}`}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                <Phone className="h-3.5 w-3.5" />
                Appeler
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${order.pharmacy.latitude},${order.pharmacy.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <MapPin className="h-3.5 w-3.5" />
                Itinéraire
              </a>
            </div>
          </div>
        )}

        {/* Order summary */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Récapitulatif
          </h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Commande</span>
            <span className="font-mono font-bold text-foreground">#{order.code}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Articles</span>
            <span className="font-medium text-foreground">{order.items?.length || 0} article{(order.items?.length || 0) > 1 ? "s" : ""}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold text-primary">{formatFCFA(order.totalAmount)}</span>
          </div>
        </div>

        {/* View full order button */}
        <Button
          onClick={() => navigate("order-detail", { id: order.id })}
          className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Eye className="mr-1.5 h-4 w-4" />
          Voir le détail complet
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
