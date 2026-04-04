'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  Store,
  MapPin,
  Package,
  Truck,
  Wallet,
  MessageSquare,
  Pill,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ViewHeader } from '@/components/view-header';
import { useCartStore } from '@/store/cart-store';
import { useAppStore } from '@/store/app-store';
import { PAYMENT_LABELS } from '@/lib/navigation';
import { toast } from 'sonner';

function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

interface OrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export function CartCheckoutView() {
  const {
    items,
    deliveryType,
    deliveryAddress,
    note,
    paymentMethod,
    clearCart,
    getSubtotal,
    getPharmacyGroups,
  } = useCartStore();

  const { setCurrentView, selectOrder } = useAppStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getSubtotal();
  const groups = getPharmacyGroups();
  const groupCount = groups.size;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const paymentLabel =
    PAYMENT_LABELS[paymentMethod] ||
    (paymentMethod === 'sur_place' ? 'Sur place' : paymentMethod);

  const handleConfirm = useCallback(async () => {
    if (items.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      toast.error('Veuillez entrer une adresse de livraison');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build items payload
      const payloadItems = items.map((item) => ({
        pharmacyId: item.pharmacyId,
        medicationId: item.medicationId,
        quantity: item.quantity,
        stockId: item.stockId,
        note: note || undefined,
        paymentMethod,
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : undefined,
      }));

      const payload = {
        items: payloadItems,
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : undefined,
        note: note || undefined,
        paymentMethod,
      };

      // Try batch API first
      let firstOrderId: string | null = null;
      let batchSuccess = false;

      try {
        const batchRes = await fetch('/api/orders/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (batchRes.ok) {
          const batchData = await batchRes.json();
          if (batchData.orders && batchData.orders.length > 0) {
            firstOrderId = batchData.orders[0].id;
            batchSuccess = true;
          }
        }
      } catch {
        // Batch API failed, fall back to individual orders
      }

      // Fallback: create individual orders per pharmacy
      if (!batchSuccess) {
        let anySuccess = false;
        const pharmacyGroups = Array.from(groups.entries());

        for (const [, pharmacyItems] of pharmacyGroups) {
          try {
            const orderPayload = {
              pharmacyId: pharmacyItems[0].pharmacyId,
              items: pharmacyItems.map((item) => ({
                medicationId: item.medicationId,
                quantity: item.quantity,
                stockId: item.stockId,
                price: item.price,
              })),
              note: note || undefined,
              paymentMethod,
              deliveryType,
              deliveryAddress:
                deliveryType === 'delivery' ? deliveryAddress : undefined,
            };

            const res = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(orderPayload),
            });

            if (res.ok) {
              const data = await res.json();
              if (!anySuccess && data.id) {
                firstOrderId = data.id;
                anySuccess = true;
              }
            } else {
              const errData = await res.json().catch(() => null);
              console.error(
                'Order creation failed for pharmacy:',
                pharmacyItems[0].pharmacyName,
                errData?.error
              );
            }
          } catch {
            console.error(
              'Network error for pharmacy:',
              pharmacyItems[0].pharmacyName
            );
          }
        }

        if (!anySuccess) {
          throw new Error(
            'Impossible de créer les commandes. Veuillez réessayer.'
          );
        }
      }

      // Success — clear cart and navigate
      clearCart();
      toast.success(
        `Commande${groupCount > 1 ? '(s)' : ''} passée${groupCount > 1 ? 's' : ''} avec succès !`
      );

      if (firstOrderId) {
        selectOrder(firstOrderId);
        setCurrentView('order-confirmation');
      } else {
        setCurrentView('order-history');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    items,
    deliveryType,
    deliveryAddress,
    note,
    paymentMethod,
    groups,
    groupCount,
    clearCart,
    selectOrder,
    setCurrentView,
  ]);

  // ═══ Empty State ═══
  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <ViewHeader
          title="Récapitulatif"
          icon={<ClipboardCheck className="h-5 w-5 text-emerald-600" />}
          back
        />

        <Card className="border-emerald-100 mt-4">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Panier vide</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Votre panier a été vidé ou ne contient aucun article.
            </p>
            <Button
              onClick={() => setCurrentView('search')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              Rechercher des médicaments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 pb-28">
      <ViewHeader
        title="Récapitulatif"
        icon={<ClipboardCheck className="h-5 w-5 text-emerald-600" />}
        back
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* ═══ Pharmacy Groups with Items ═══ */}
        {Array.from(groups.entries()).map(([pharmacyId, pharmacyItems], idx) => {
          const pharmacyName = pharmacyItems[0].pharmacyName;
          const pharmacyAddress = pharmacyItems[0].pharmacyAddress;
          const pharmacyDistrict = pharmacyItems[0].pharmacyDistrict;
          const pharmacySubtotal = pharmacyItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          return (
            <motion.div
              key={pharmacyId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
            >
              <Card className="border-emerald-100 overflow-hidden">
                {/* Pharmacy header */}
                <div className="bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {pharmacyName}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">
                          {pharmacyAddress}
                          {pharmacyDistrict && `, ${pharmacyDistrict}`}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs flex-shrink-0">
                      {formatFCFA(pharmacySubtotal)}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-0">
                  {pharmacyItems.map((item, itemIdx) => (
                    <div
                      key={item.id}
                      className={
                        itemIdx < pharmacyItems.length - 1
                          ? 'border-b border-emerald-50'
                          : ''
                      }
                    >
                      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center flex-shrink-0">
                          <Pill className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.medicationName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.medicationForm}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-foreground">
                            ×{item.quantity}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {formatFCFA(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* ═══ Delivery & Payment Info ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groups.size * 0.08 + 0.1, duration: 0.3 }}
        >
          <Card className="border-emerald-100 overflow-hidden">
            <CardContent className="p-3.5 sm:p-4 space-y-3">
              {/* Delivery info */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
                  {deliveryType === 'pickup' ? (
                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {deliveryType === 'pickup'
                      ? 'Retrait en pharmacie'
                      : 'Livraison'}
                  </p>
                  {deliveryType === 'delivery' && deliveryAddress && (
                    <div className="flex items-start gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground break-words">
                        {deliveryAddress}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-emerald-100" />

              {/* Payment method */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center flex-shrink-0">
                  <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    Mode de paiement
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {paymentLabel}
                  </p>
                </div>
              </div>

              {/* Note */}
              {note && (
                <>
                  <Separator className="bg-emerald-100" />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Note
                      </p>
                      <p className="text-sm text-foreground break-words">{note}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ Grand Total + Confirm ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groups.size * 0.08 + 0.2, duration: 0.3 }}
        >
          <Card className="border-emerald-200 overflow-hidden">
            <CardContent className="p-3.5 sm:p-4 space-y-3">
              {/* Summary stats */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {itemCount} article{itemCount > 1 ? 's' : ''} dans{' '}
                  {groupCount} pharmacie{groupCount > 1 ? 's' : ''}
                </span>
              </div>

              <Separator className="bg-emerald-100" />

              {/* Grand total */}
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-foreground">
                  Total à payer
                </span>
                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {formatFCFA(subtotal)}
                </span>
              </div>

              {/* Confirm button */}
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-semibold text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Confirmer et passer la commande
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ═══ Sticky Bottom Bar (mobile) ═══ */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-t border-emerald-100 dark:border-emerald-900/50 lg:hidden">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
              {formatFCFA(subtotal)}
            </p>
          </div>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-semibold text-sm flex-shrink-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                <span className="hidden sm:inline">Traitement...</span>
              </>
            ) : (
              'Confirmer'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
