"use client";

import { useState } from "react";
import {
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  Package,
  XCircle,
  Loader2,
  ScanBarcode,
  Keyboard,
  Camera,
} from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { QrScanner } from "@/components/app/qr-scanner";
import { useAppStore } from "@/lib/store";
import { api, formatFCFA } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  medication: { id: string; name: string; form: string; dosage: string };
}

interface OrderResult {
  id: string;
  code: string;
  status: string;
  statusLabel: string;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  allowedNext: string[];
  user: { id: string; name: string; phone: string | null; email: string };
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  READY: "bg-green-500/10 text-green-500 border-green-500/20",
  PICKED_UP: "bg-muted text-muted-foreground border-border",
  CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
};

const NEXT_ACTIONS: Record<string, { label: string; status: string; icon: typeof CheckCircle; color: string }> = {
  CONFIRMED: { label: "Confirmer", status: "CONFIRMED", icon: CheckCircle, color: "bg-blue-600 hover:bg-blue-700" },
  READY: { label: "Marquer prête", status: "READY", icon: Package, color: "bg-green-600 hover:bg-green-700" },
  PICKED_UP: { label: "Marquer récupérée", status: "PICKED_UP", icon: CheckCircle, color: "bg-emerald-600 hover:bg-emerald-700" },
  CANCELLED: { label: "Annuler", status: "CANCELLED", icon: XCircle, color: "bg-red-600 hover:bg-red-700" },
};

type Step = "choose" | "camera" | "manual";

export function ScanOrderScreen() {
  const goBack = useAppStore((s) => s.goBack);
  const pushToast = useAppStore((s) => s.pushToast);

  const [step, setStep] = useState<Step>("choose");
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [updating, setUpdating] = useState(false);

  async function lookupOrder(code: string) {
    setLoading(true);
    setError(null);
    setOrder(null);
    setStep("manual");
    try {
      const res = await api.post<{ order: OrderResult }>("/api/pharmacist/orders/lookup", { code });
      setOrder(res.order);
      pushToast(`Commande ${res.order.code} trouvée`, "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commande introuvable");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    if (!order) return;
    setUpdating(true);
    try {
      await api.put(`/api/pharmacist/orders/${order.id}`, { status: newStatus });
      pushToast(
        newStatus === "CANCELLED" ? "Commande annulée" : "Statut mis à jour",
        newStatus === "CANCELLED" ? "info" : "success"
      );
      if (newStatus === "CANCELLED") {
        setOrder(null);
        setError(null);
        setStep("choose");
      } else {
        void lookupOrder(order.code);
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setUpdating(false);
    }
  }

  function handleScanAgain() {
    setOrder(null);
    setError(null);
    setStep("choose");
  }

  function handleManualSubmit() {
    const trimmed = manualCode.trim();
    if (trimmed.length >= 4) {
      void lookupOrder(trimmed);
    }
  }

  if (step === "camera") {
    return (
      <QrScanner
        onScan={(code) => {
          setStep("manual");
          void lookupOrder(code);
        }}
        onClose={() => setStep("choose")}
      />
    );
  }

  if (step === "choose") {
    return (
      <div className="flex flex-col min-h-dvh bg-background">
        <AppHeader title="Rechercher une commande" showBack />

        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <ScanBarcode className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Retrouver une commande</h2>
          <p className="mt-1 text-sm text-muted-foreground text-center">
            Scannez le QR code du patient ou saisissez le code manuellement
          </p>

          <div className="mt-8 w-full max-w-xs space-y-3">
            <button
              onClick={() => setStep("camera")}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              <Camera className="h-5 w-5" />
              Scanner le QR code
            </button>

            <button
              onClick={() => setStep("manual")}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50 active:scale-[0.98]"
            >
              <Keyboard className="h-5 w-5 text-muted-foreground" />
              Saisir le code
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* step === "manual" — manual entry OR order result */

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <AppHeader title="Scanner commande" showBack />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Manual input (visible when no order loaded) */}
        {!order && !loading && (
          <div className="mb-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <label className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
                Code de la commande
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                  placeholder="PHARMACI-XXXX"
                  autoFocus
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={manualCode.trim().length < 4}
                  className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                >
                  OK
                </button>
              </div>
            </div>

            {/* Scan again with camera */}
            <button
              onClick={() => setStep("camera")}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <Camera className="h-4 w-4" />
              Scanner avec la caméra
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm">Recherche de la commande...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
              <XCircle className="h-7 w-7 text-red-500" />
            </div>
            <p className="text-sm font-medium text-red-500">{error}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Vérifiez le code et réessayez
            </p>
            <button
              onClick={handleScanAgain}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Order result */}
        {order && !loading && (
          <div className="space-y-4">
            {/* Status banner */}
            <div
              className={cn(
                "flex items-center justify-between rounded-xl border p-3",
                STATUS_COLORS[order.status] || "bg-muted text-muted-foreground border-border"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold">{order.code}</span>
              </div>
              <Badge className="text-xs px-2 py-0">
                {order.statusLabel}
              </Badge>
            </div>

            {/* Patient info */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Patient
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{order.user.name}</span>
                </div>
                {order.user.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${order.user.phone}`} className="text-sm text-primary">
                      {order.user.phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{order.user.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("fr-CI", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Médicaments
              </h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.medication.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.medication.dosage} · {item.medication.form}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                      <p className="text-xs font-medium">{formatFCFA(item.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-sm font-bold text-primary">{formatFCFA(order.totalAmount)}</span>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Notes
                </h3>
                <p className="text-sm text-foreground">{order.notes}</p>
              </div>
            )}

            {/* Action buttons */}
            {order.allowedNext.length > 0 && (
              <div className="space-y-2 pt-2">
                {order.allowedNext.map((nextStatus) => {
                  const action = NEXT_ACTIONS[nextStatus];
                  if (!action) return null;
                  const Icon = action.icon;
                  return (
                    <Button
                      key={nextStatus}
                      onClick={() => void updateStatus(nextStatus)}
                      disabled={updating}
                      className={cn(
                        "h-11 w-full rounded-xl text-sm font-semibold text-white",
                        action.color,
                        updating && "opacity-60"
                      )}
                    >
                      {updating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="mr-2 h-4 w-4" />
                      )}
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            )}

            {order.status === "PICKED_UP" && (
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
                <p className="text-sm font-medium text-green-500">
                  Commande récupérée
                </p>
                <p className="text-xs text-green-500/80">
                  Cette commande est terminée
                </p>
              </div>
            )}

            {order.status === "CANCELLED" && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
                <XCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
                <p className="text-sm font-medium text-red-500">
                  Commande annulée
                </p>
              </div>
            )}

            {/* Scan another */}
            <button
              onClick={handleScanAgain}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <ScanBarcode className="h-4 w-4" />
              Rechercher une autre commande
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
