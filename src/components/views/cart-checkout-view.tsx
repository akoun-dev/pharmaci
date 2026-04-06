'use client';

import { logger } from '@/lib/logger';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  Store,
  MapPin,
  Package,
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
    note,
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

  const handleConfirm = useCallback(async () => {
    if (items.length === 0) {
      toast.error('Votre panier est vide');
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
      }));

      const payload = {
        items: payloadItems,
        note: note || undefined,
      };

      let pharmacyCount = 1;
      let batchData: {
        orders?: Array<{ id: string }>;
        pharmacyCount?: number;
        errors?: unknown[];
      } | null = null;

      // Use batch API - creates ONE order per pharmacy with ALL items from that pharmacy
      // Each order has a SINGLE verification code for all its medications
      const batchRes = await fetch('/api/orders/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (batchRes.ok) {
        batchData = await batchRes.json();
        if (batchData.orders && batchData.orders.length > 0) {
          pharmacyCount = batchData.pharmacyCount || 1;

          // Show appropriate success message
          if (pharmacyCount > 1) {
            toast.success(`${pharmacyCount} commandes créées — une par pharmacie`);
          } else {
            toast.success('Commande créée avec succès');
          }

          // Log any partial errors
          if (batchData.errors && batchData.errors.length > 0) {
            logger.warn('Some items failed to order:', batchData.errors);
          }
        } else {
          throw new Error('Aucune commande créée');
        }
      } else {
        const errData = await batchRes.json().catch(() => null);
        throw new Error(errData?.error || 'Erreur lors de la création des commandes');
      }

      // Success — clear cart and navigate
      clearCart();

      // Set the first order ID and navigate to confirmation view
      if (batchData?.orders && batchData.orders.length > 0) {
        const firstOrder = batchData.orders[0];
        selectOrder(firstOrder.id);
      }

      // Always redirect to order history after successful order creation
      // This is better when multiple orders are created
      if (pharmacyCount > 1) {
        // For multiple pharmacies, show order history with grouped view
        setCurrentView('order-history');
      } else {
        // For single pharmacy, show confirmation view
        setCurrentView('order-confirmation');
      }
    } catch (error) {
      logger.error('Order submission error:', error);
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
    note,
    groups,
    groupCount,
    clearCart,
    selectOrder,
    setCurrentView,
  ]);

  // ═══ Empty State ═══
  if (items.length === 0) {
    return (
      <div className="w-full px-4 sm:px-6 py-4">
        <ViewHeader
          title="Récapitulatif"
          icon={<ClipboardCheck className="h-5 w-5 text-amber-600" />}
          back
        />

        <Card className="border-amber-100 mt-4">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Panier vide</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Votre panier a été vidé ou ne contient aucun article.
            </p>
            <Button
              onClick={() => setCurrentView('search')}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
            >
              Rechercher des médicaments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-4 pb-28">
      <ViewHeader
        title="Récapitulatif"
        icon={<ClipboardCheck className="h-5 w-5 text-amber-600" />}
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
              <Card className="border-amber-100 overflow-hidden">
                {/* Pharmacy header */}
                <div className="bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Store className="h-4 w-4 text-amber-600 dark:text-amber-400" />
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
                    <Badge className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs flex-shrink-0">
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
                          ? 'border-b border-amber-50'
                          : ''
                      }
                    >
                      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                          <Pill className="h-4 w-4 text-amber-600 dark:text-amber-400" />
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
                          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
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

        {/* ═══ Note ═══ */}
        {(note) && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groups.size * 0.08 + 0.1, duration: 0.3 }}
          >
            <Card className="border-amber-100 overflow-hidden">
              <CardContent className="p-3.5 sm:p-4">
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
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══ Grand Total + Confirm ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groups.size * 0.08 + 0.2, duration: 0.3 }}
        >
          <Card className="border-amber-200 overflow-hidden">
            <CardContent className="p-3.5 sm:p-4 space-y-3">
              {/* Summary stats */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {itemCount} article{itemCount > 1 ? 's' : ''} dans{' '}
                  {groupCount} pharmacie{groupCount > 1 ? 's' : ''}
                </span>
              </div>

              <Separator className="bg-amber-100" />

              {/* Grand total */}
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-foreground">
                  Total à payer
                </span>
                <span className="text-xl font-bold text-amber-700 dark:text-amber-400">
                  {formatFCFA(subtotal)}
                </span>
              </div>

              {/* Confirm button */}
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full h-12 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-xl font-semibold text-sm"
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
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 bg-white/82 dark:bg-gray-950/82 backdrop-blur-xl border-t border-amber-100/80 dark:border-amber-900/50 lg:hidden">
        <div className="w-full px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-base font-bold text-amber-700 dark:text-amber-400">
              {formatFCFA(subtotal)}
            </p>
          </div>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="h-11 px-5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-xl font-semibold text-sm flex-shrink-0"
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
