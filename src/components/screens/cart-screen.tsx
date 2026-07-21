"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  Loader2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  FileText,
  User,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { orderApi, formatFCFA, type Order } from "@/lib/api";
import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

export function CartScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const cart = useAppStore((s) => s.cart);
  const cartTotal = useAppStore((s) => s.cartTotal());
  const updateQty = useAppStore((s) => s.updateCartQuantity);
  const removeItem = useAppStore((s) => s.removeFromCart);
  const clearCart = useAppStore((s) => s.clearCart);
  const pushToast = useAppStore((s) => s.pushToast);

  // Group items by pharmacy
  const byPharmacy = cart.reduce<Record<string, typeof cart>>((acc, item) => {
    (acc[item.pharmacyId] = acc[item.pharmacyId] || []).push(item);
    return acc;
  }, {});

  async function handleCheckout() {
    navigator.vibrate?.(10);
    navigate("checkout");
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Mon panier" showBack />
        <div className="px-4 pt-8">
          <EmptyState
            icon={ShoppingBag}
            title="Votre panier est vide"
            description="Ajoutez des médicaments depuis la recherche pour commencer."
            action={{ label: "Rechercher un médicament", onClick: () => useAppStore.getState().setTab("home") }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Mon panier"
        showBack
        rightSlot={
          <button
            onClick={() => {
              clearCart();
              pushToast("Panier vidé.", "info");
            }}
            className="flex h-9 items-center rounded-full px-3 text-xs font-medium text-red-500 hover:bg-red-50"
          >
            Vider
          </button>
        }
      />
      <div className="flex-1 space-y-4 px-4 pt-3 pb-32">
        {Object.entries(byPharmacy).map(([pharmacyId, items]) => (
          <div key={pharmacyId} className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border/60 px-3 py-2.5">
              <h3 className="text-sm font-bold text-foreground">
                {items[0].pharmacyName}
              </h3>
              <p className="text-xs text-muted-foreground">
                {items.length} article{items.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="divide-y divide-border/60">
              {items.map((item) => (
                <div key={`${item.medicationId}-${item.pharmacyId}`} className="flex items-center gap-3 p-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="text-xs font-bold">
                      {item.medicationName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate text-sm font-semibold text-foreground">
                      {item.medicationName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {item.medicationDosage} • {item.medicationForm}
                    </p>
                    {item.prescriptionRequired && (
                      <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        <FileText className="h-2.5 w-2.5" />
                        Ordonnance
                      </span>
                    )}
                    <p className="mt-0.5 text-sm font-bold text-primary">
                      {formatFCFA(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() =>
                        removeItem(item.medicationId, item.pharmacyId)
                      }
                      className="text-muted-foreground hover:text-red-500"
                      aria-label="Retirer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-1.5 rounded-full border border-border p-0.5">
                      <button
                        onClick={() =>
                          updateQty(
                            item.medicationId,
                            item.pharmacyId,
                            item.quantity - 1
                          )
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                        aria-label="Diminuer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-6 text-center text-xs font-bold text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQty(
                            item.medicationId,
                            item.pharmacyId,
                            item.quantity + 1
                          )
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                        aria-label="Augmenter"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky checkout bar */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-primary">{formatFCFA(cartTotal)}</p>
          </div>
          <Button
            onClick={handleCheckout}
            className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Commander
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Checkout screen ----------
export function CheckoutScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const guestMode = useAppStore((s) => s.guestMode);
  const cart = useAppStore((s) => s.cart);
  const cartTotal = useAppStore((s) => s.cartTotal());
  const clearCart = useAppStore((s) => s.clearCart);
  const pushToast = useAppStore((s) => s.pushToast);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Group items by pharmacy
  const byPharmacy = cart.reduce<Record<string, typeof cart>>((acc, item) => {
    (acc[item.pharmacyId] = acc[item.pharmacyId] || []).push(item);
    return acc;
  }, {});
  const pharmacyEntries = Object.entries(byPharmacy);

  async function handleConfirm() {
    setLoading(true);
    try {
      // Create one order per pharmacy
      const created: Order[] = [];
      for (const [pharmacyId, items] of pharmacyEntries) {
        const res = await orderApi.create({
          pharmacyId,
          items: items.map((i) => ({
            medicationId: i.medicationId,
            quantity: i.quantity,
          })),
          notes: notes || undefined,
        });
        created.push(res.order);
      }
      clearCart();
      pushToast(`${created.length} commande(s) créée(s) !`, "success");
      // Navigate to the first order's detail
      if (created.length === 1) {
        navigate("order-detail", { id: created[0].id });
      } else {
        useAppStore.getState().setTab("orders");
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setLoading(false);
    }
  }

  if (!user && guestMode) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Commande" showBack />
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Connexion requise</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Créez un compte ou connectez-vous pour finaliser votre commande.
            </p>
          </div>
          <Button
            onClick={() => useAppStore.getState().setGuestMode(false)}
            className="mt-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground"
          >
            Se connecter / S'inscrire
          </Button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col">
        <AppHeader title="Commande" showBack />
        <div className="px-4 pt-8">
          <EmptyState
            icon={ShoppingBag}
            title="Panier vide"
            description="Ajoutez des articles depuis la recherche."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <AppHeader title="Finaliser la commande" showBack />
      <div className="flex-1 space-y-4 px-4 pt-3 pb-32">
        {/* Order summary */}
        {pharmacyEntries.map(([pharmacyId, items]) => {
          const subtotal = items.reduce(
            (sum, i) => sum + i.unitPrice * i.quantity,
            0
          );
          return (
            <div
              key={pharmacyId}
              className="rounded-2xl border border-border bg-card"
            >
              <div className="border-b border-border/60 px-3 py-2.5">
                <h3 className="text-sm font-bold text-foreground">
                  {items[0].pharmacyName}
                </h3>
              </div>
              <div className="divide-y divide-border/60">
                {items.map((item) => (
                  <div
                    key={`${item.medicationId}-${item.pharmacyId}`}
                    className="flex items-center justify-between p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {item.medicationName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatFCFA(item.unitPrice)}
                      </p>
                    </div>
                    <p className="ml-2 font-semibold text-foreground">
                      {formatFCFA(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/60 px-3 py-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-bold text-primary">
                    {formatFCFA(subtotal)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Notes */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Informations complémentaires pour la pharmacie..."
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Info */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
          <div className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div className="text-xs text-blue-800">
              <p className="font-semibold">Comment ça marche ?</p>
              <p className="mt-0.5">
                Une commande distincte est créée par pharmacie. Vous recevrez un
                code de vérification et un QR code pour chaque commande.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total à payer</p>
            <p className="text-lg font-bold text-primary">
              {formatFCFA(cartTotal)}
            </p>
          </div>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Confirmer
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
