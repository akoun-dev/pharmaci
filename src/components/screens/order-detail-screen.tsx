"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Loader2,
  AlertCircle,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Copy,
  FileText,
  X,
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
import { cn } from "@/lib/utils";

const STATUS_STEPS = [
  { key: "PENDING", label: "En attente", icon: Clock },
  { key: "CONFIRMED", label: "Confirmée", icon: Package },
  { key: "READY", label: "Prête", icon: CheckCircle2 },
  { key: "PICKED_UP", label: "Récupérée", icon: CheckCircle2 },
];

export function OrderDetailScreen() {
  const params = useAppStore((s) => s.nav.params);
  const navigate = useAppStore((s) => s.navigate);
  const pushToast = useAppStore((s) => s.pushToast);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    void load();
  }, [params.id]);

  useEffect(() => {
    if (order) {
      QRCode.toDataURL(order.code, {
        width: 320,
        margin: 1,
        color: { dark: "#16a34a", light: "#ffffff" },
      })
        .then(setQrUrl)
        .catch(() => {});
    }
  }, [order]);

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

  async function handleCancel() {
    if (!order) return;
    setCancelling(true);
    try {
      const res = await orderApi.cancel(order.id);
      setOrder(res.order);
      pushToast("Commande annulée.", "info");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setCancelling(false);
    }
  }

  function copyCode() {
    if (!order) return;
    navigator.clipboard.writeText(order.code);
    pushToast("Code copié !", "success");
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Commande" showBack />
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Commande" showBack />
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Commande introuvable.</p>
        </div>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="flex flex-col">
      <AppHeader title={`Commande ${order.code}`} showBack />

      <div className="flex-1 space-y-4 px-4 pt-3 pb-6">
        {/* Status card */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold",
                ORDER_STATUS[order.status].color
              )}
            >
              {ORDER_STATUS[order.status].label}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(order.createdAt)}
            </span>
          </div>

          {!isCancelled ? (
            <div className="mt-4 flex items-center justify-between">
              {STATUS_STEPS.map((step, idx) => {
                const isDone = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const Icon = step.icon;
                return (
                  <div
                    key={step.key}
                    className="flex flex-1 flex-col items-center"
                  >
                    <div className="flex w-full items-center">
                      {idx > 0 && (
                        <div
                          className={cn(
                            "h-0.5 flex-1",
                            idx <= currentStepIdx ? "bg-primary" : "bg-border"
                          )}
                        />
                      )}
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                          isDone
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground",
                          isCurrent && "ring-4 ring-primary/20"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div
                          className={cn(
                            "h-0.5 flex-1",
                            idx < currentStepIdx ? "bg-primary" : "bg-border"
                          )}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-1.5 text-[10px] font-semibold",
                        isDone ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <XCircle className="h-4 w-4" />
              Cette commande a été annulée.
            </div>
          )}
        </div>

        {/* Verification code */}
        {!isCancelled && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-semibold uppercase text-primary">
              Code de vérification
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="font-mono text-lg font-bold text-foreground">
                {order.code}
              </p>
              <button
                onClick={copyCode}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                aria-label="Copier"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Présentez ce code (ou le QR code) à la pharmacie pour récupérer votre commande.
            </p>
            <Button
              onClick={() => setShowQR(true)}
              className="mt-3 h-9 w-full rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Afficher le QR Code
            </Button>
          </div>
        )}

        {/* Pharmacy info */}
        {order.pharmacy && (
          <div className="rounded-2xl border border-border bg-card p-3">
            <button
              onClick={() =>
                navigate("pharmacy-detail", { id: order.pharmacy!.id })
              }
              className="flex w-full items-center gap-3 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                {order.pharmacy.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="truncate text-sm font-bold text-foreground">
                  {order.pharmacy.name}
                </h3>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {order.pharmacy.address}
                </p>
              </div>
            </button>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border/60 pt-2">
              <a
                href={`tel:${order.pharmacy.phone}`}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                <Phone className="h-3.5 w-3.5" />
                Appeler
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${order.pharmacy.latitude},${order.pharmacy.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <MapPin className="h-3.5 w-3.5" />
                Itinéraire
              </a>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border/60 px-3 py-2.5">
            <h3 className="text-sm font-bold text-foreground">
              Articles ({order.items?.length || 0})
            </h3>
          </div>
          <div className="divide-y divide-border/60">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 p-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {item.medication?.name || "Médicament"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatFCFA(item.unitPrice)}
                  </p>
                  {item.medication?.prescriptionRequired && (
                    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      <FileText className="h-2.5 w-2.5" />
                      Ordonnance
                    </span>
                  )}
                </div>
                <p className="ml-2 font-semibold text-foreground">
                  {formatFCFA(item.totalPrice)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-border/60 px-3 py-2.5">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-primary">
                {formatFCFA(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="rounded-2xl border border-border bg-card p-3">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">
              Notes
            </h3>
            <p className="mt-1 text-sm text-foreground">{order.notes}</p>
          </div>
        )}

        {/* Cancel button */}
        {(order.status === "PENDING" || order.status === "CONFIRMED") && (
          <Button
            onClick={handleCancel}
            disabled={cancelling}
            variant="outline"
            className="h-10 w-full rounded-xl border-red-300 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            {cancelling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <XCircle className="mr-1.5 h-4 w-4" />
                Annuler la commande
              </>
            )}
          </Button>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && qrUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowQR(false)}
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-card p-6 text-center animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">QR Code</h3>
              <button onClick={() => setShowQR(false)} aria-label="Fermer">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <img
              src={qrUrl}
              alt={`QR code ${order.code}`}
              className="mx-auto h-56 w-56 rounded-2xl border-2 border-primary/20"
            />
            <p className="mt-3 font-mono text-sm font-bold text-primary">
              {order.code}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Présentez ce code au pharmacien
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
