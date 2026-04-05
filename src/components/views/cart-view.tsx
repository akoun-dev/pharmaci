'use client';

import { logger } from '@/lib/logger';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  Store,
  MapPin,
  Package,
  MessageSquare,
  Pill,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ViewHeader } from '@/components/view-header';
import { useCartStore, type CartItem } from '@/store/cart-store';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';

function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

export function CartView() {
  const {
    items,
    note,
    removeItem,
    updateQuantity,
    setNote,
    getItemCount,
    getSubtotal,
    getPharmacyGroups,
  } = useCartStore();

  const { setCurrentView } = useAppStore();

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const groups = getPharmacyGroups();
  const groupCount = groups.size;

  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }
    setCurrentView('cart-checkout');
  };

  // ═══ Empty State ═══
  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <ViewHeader
          title="Mon Panier"
          icon={<ShoppingBag className="h-5 w-5 text-emerald-600" />}
          back
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <ShoppingBag className="h-10 w-10 text-emerald-300" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">
            Votre panier est vide
          </h2>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
            Parcourez les médicaments disponibles et ajoutez-les à votre panier
          </p>
          <Button
            onClick={() => setCurrentView('search')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 px-6"
          >
            <Search className="h-4 w-4 mr-2" />
            Rechercher des médicaments
          </Button>
        </motion.div>
      </div>
    );
  }

  // ═══ Cart Content ═══
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 pb-40">
      <ViewHeader
        title="Mon Panier"
        icon={<ShoppingBag className="h-5 w-5 text-emerald-600" />}
        back
        action={
          itemCount > 0 && (
            <Badge className="bg-emerald-600 text-white text-xs px-2 py-0.5">
              {itemCount}
            </Badge>
          )
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* ═══ Pharmacy Groups ═══ */}
        {Array.from(groups.entries()).map(([pharmacyId, pharmacyItems], groupIdx) => {
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
              transition={{ delay: groupIdx * 0.08, duration: 0.3 }}
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
                  </div>
                </div>

                <CardContent className="p-0">
                  {pharmacyItems.map((item, itemIdx) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                      isLast={itemIdx === pharmacyItems.length - 1}
                    />
                  ))}

                  {/* Pharmacy subtotal with order count hint */}
                  <div className="px-3.5 py-2.5 bg-gray-50/50 dark:bg-gray-900/30 border-t border-emerald-50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">
                        Sous-total {pharmacyName}
                      </span>
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatFCFA(pharmacySubtotal)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Package className="h-3 w-3" />
                      <span>
                        {pharmacyItems.length === 1
                          ? '1 médicament'
                          : `${pharmacyItems.length} médicaments`} • 1 commande créée
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* ═══ Order Summary Section ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groups.size * 0.08 + 0.1, duration: 0.3 }}
        >
          <Card className="border-emerald-100 overflow-hidden">
            <CardContent className="p-3.5 sm:p-4 space-y-4">
              {/* Grand total */}
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-foreground">
                  Total
                </span>
                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {formatFCFA(subtotal)}
                </span>
              </div>

              <Separator className="bg-emerald-100" />

              {/* Note */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Note (optionnel)
                  </label>
                </div>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Instructions spéciales, préférences..."
                  className="min-h-[72px] rounded-xl border-emerald-100 focus:border-emerald-400 text-sm resize-none"
                />
              </div>

              <Separator className="bg-emerald-100" />

              {/* Order count info */}
              {groupCount > 1 ? (
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed mb-1">
                      <strong>{groupCount} commandes seront créées</strong> — une par pharmacie
                    </p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-500">
                      Chaque pharmacie préparera votre commande indépendamment
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                  <Store className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    <strong>1 commande sera créée</strong> auprès de votre pharmacie
                  </p>
                </div>
              )}

              {/* Validate button */}
              <Button
                onClick={handleProceedToCheckout}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm"
              >
                Valider la commande
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ═══ Sticky Bottom Bar (mobile) ═══ */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-t border-emerald-100 dark:border-emerald-900/50 lg:hidden">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
              {formatFCFA(subtotal)}
            </p>
          </div>
          <Button
            onClick={handleProceedToCheckout}
            className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm"
          >
            Valider
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══ Cart Item Row ═══ */
function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  isLast,
}: {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  isLast: boolean;
}) {
  const lineTotal = item.price * item.quantity;

  return (
    <div className={!isLast ? 'border-b border-emerald-50' : ''}>
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        {/* Medication icon */}
        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center flex-shrink-0">
          <Pill className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Medication info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {item.medicationName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {item.medicationForm}
            </span>
            <span className="text-[10px] text-muted-foreground/60">·</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {formatFCFA(item.price)}
            </span>
          </div>

          {/* Prescription badge */}
          {item.needsPrescription && (
            <Badge className="mt-1 text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200">
              Ordonnance
            </Badge>
          )}
        </div>

        {/* Quantity controls + remove */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <button
            onClick={() => onRemove(item.id)}
            className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            aria-label="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {/* Quantity selector */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-muted-foreground hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm font-semibold text-foreground">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              disabled={item.quantity >= item.maxQuantity}
              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-muted-foreground hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Line total */}
          <p className="text-xs font-semibold text-foreground whitespace-nowrap">
            {formatFCFA(lineTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}
