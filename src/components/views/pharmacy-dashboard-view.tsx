'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Pill,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Building2,
  BarChart3,
  Boxes,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/app-store';
import { ViewHeader } from '@/components/view-header';
import { toast } from 'sonner';
import { useCapacitorNotifications } from '@/hooks/use-capacitor-notifications';
import { useLowStockAlert } from '@/hooks/use-low-stock-alert';

export function PharmacyDashboardView() {
  const {
    setCurrentView,
  } = useAppStore();

  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Hook pour les alertes de stock bas
  useLowStockAlert();

  const fetchPharmacies = useCallback(async () => {
    try {
      const res = await fetch('/api/pharmacies?limit=20');
      const data = await res.json();
      setPharmacies(data);
      if (data.length > 0 && !selectedPharmacyId) {
        setSelectedPharmacyId(data[0].id);
      }
    } catch (error) {
      logger.error('Error fetching pharmacies:', error);
    }
  }, []);

  const fetchStocks = useCallback(async () => {
    if (!selectedPharmacyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pharmacies/${selectedPharmacyId}/medications`);
      const data = await res.json();
      setStocks(data);
    } catch (error) {
      logger.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPharmacyId]);

  useEffect(() => {
    fetchPharmacies();
  }, [fetchPharmacies]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const handleUpdateStock = async (stock: any, updates: Partial<{ inStock: boolean; quantity: number; price: number }>) => {
    setUpdatingId(stock.id);
    try {
      const res = await fetch(`/api/pharmacies/${selectedPharmacyId}/stocks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationId: stock.medicationId,
          ...updates,
        }),
      });
      
      if (res.ok) {
        toast.success('Stock mis à jour');

        // Vérifier si le stock passe sous le seuil critique
        const updatedQuantity = updates.quantity || stock.quantity;
        if (updatedQuantity > 0 && updatedQuantity < LOW_STOCK_THRESHOLD && !stock.lowStockAlertSent) {
          await scheduleLowStockNotification(stock.medication.name, updatedQuantity);
          // Marquer comme notifié (à implémenter côté backend)
          await fetch(`/api/pharmacies/${selectedPharmacyId}/stocks/${stock.id}/alert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lowStockAlertSent: true }),
          });
        }

        fetchStocks();
      } else {
        toast.error('Erreur de mise à jour');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setUpdatingId(null);
    }
  };

  const selectedPharmacy = pharmacies.find((p) => p.id === selectedPharmacyId);

  const totalMeds = stocks.length;
  const inStockCount = stocks.filter((s) => s.inStock).length;
  const outOfStockCount = stocks.filter((s) => !s.inStock).length;
  const lowStockCount = stocks.filter((s) => s.inStock && s.quantity < 20).length;
  const { schedule: scheduleNotification } = useCapacitorNotifications();

  // Seuil de stock bas
  const LOW_STOCK_THRESHOLD = 20;

  // Fonction pour programmer une notification de stock bas
  const scheduleLowStockNotification = async (medicationName: string, quantity: number) => {
    try {
      await scheduleNotification({
        title: '⚠️ Alerte Stock Bas',
        body: `${medicationName} : il ne reste que ${quantity} unités en stock !`,
        largeBody: `Le médicament ${medicationName} a atteint le seuil critique de stock. Il ne reste que ${quantity} unités. Veuillez passer une commande de réapprovisionnement rapidement.`,
        schedule: {
          at: new Date(Date.now() + 5 * 60 * 1000), // Dans 5 minutes
        }
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  };

  return (
    <div className="pb-4">
      <div className="w-full px-4 sm:px-6">
        <ViewHeader title="Gestion de stock" back icon={<Building2 className="h-5 w-5 text-orange-600" />} />

        {/* Pharmacy selector */}
        <div className="mb-4">
          <Select value={selectedPharmacyId} onValueChange={setSelectedPharmacyId}>
            <SelectTrigger className="border-orange-200 dark:border-orange-900/50 dark:bg-gray-950/70 dark:text-gray-100">
              <SelectValue placeholder="Sélectionner une pharmacie" />
            </SelectTrigger>
            <SelectContent>
              {pharmacies.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} - {p.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-2 mb-4"
        >
          <Card className="border-orange-100 dark:border-orange-900/50 dark:bg-gray-950/70">
            <CardContent className="p-3 text-center">
              <Package className="h-5 w-5 mx-auto text-orange-600 mb-1" />
              <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{totalMeds}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-orange-100 dark:border-orange-900/50 dark:bg-gray-950/70">
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="h-5 w-5 mx-auto text-orange-600 mb-1" />
              <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{inStockCount}</p>
              <p className="text-[10px] text-muted-foreground">En stock</p>
            </CardContent>
          </Card>
          <Card className="border-orange-100 dark:border-red-900/40 dark:bg-gray-950/70">
            <CardContent className="p-3 text-center">
              <XCircle className="h-5 w-5 mx-auto text-red-500 mb-1" />
              <p className="text-lg font-bold text-red-600">{outOfStockCount}</p>
              <p className="text-[10px] text-muted-foreground">Rupture</p>
            </CardContent>
          </Card>
          <Card className="border-orange-100 dark:border-amber-900/50 dark:bg-gray-950/70">
            <CardContent className="p-3 text-center">
              <AlertTriangle className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold text-amber-600 dark:text-amber-300">{lowStockCount}</p>
              <p className="text-[10px] text-muted-foreground">Stock bas</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Low stock alerts */}
        {lowStockCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-4">
            <Card className="border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Alertes stock bas ({lowStockCount})
                  </span>
                </div>
                <div className="space-y-1">
                  {stocks
                    .filter((s) => s.inStock && s.quantity < 20)
                    .slice(0, 3)
                    .map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="text-red-700 dark:text-red-200">{s.medication.name}</span>
                        <Badge variant="outline" className="border-red-300 text-[10px] text-red-700 dark:border-red-800 dark:text-red-200">
                          {s.quantity} unités
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stock table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-orange-600" />
            Inventaire
          </h3>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : stocks.length === 0 ? (
            <Card className="border-orange-100 dark:border-orange-900/50 dark:bg-gray-950/70">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-2">
                  <Boxes className="w-10 h-10 text-orange-600" />
                </div>
                <p className="text-sm text-muted-foreground">Aucun médicament enregistré</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {stocks.map((stock) => (
                <Card
                  key={stock.id}
                  className={`overflow-hidden border ${stock.inStock ? 'border-orange-100 dark:border-orange-900/50' : 'border-red-100 dark:border-red-900/50'} dark:bg-gray-950/70`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-orange-600 flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{stock.medication.name}</span>
                          {stock.inStock ? (
                            <Badge className="h-4 bg-orange-100 px-1.5 text-[10px] text-orange-700 dark:bg-orange-950/40 dark:text-orange-200">
                              En stock
                            </Badge>
                          ) : (
                            <Badge className="h-4 bg-red-100 px-1.5 text-[10px] text-red-700 dark:bg-red-950/40 dark:text-red-200">
                              Rupture
                            </Badge>
                          )}
                          {stock.inStock && stock.quantity < 20 && (
                            <Badge className="h-4 bg-red-100 px-1.5 text-[10px] text-red-700 dark:bg-red-950/40 dark:text-red-200">
                              Stock bas
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 pl-6">
                          {stock.medication.commercialName} • {stock.medication.form}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStock(stock, { inStock: !stock.inStock })}
                        disabled={updatingId === stock.id}
                        className={`border-orange-200 text-xs dark:border-orange-900/50 ${
                          stock.inStock
                            ? 'text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40'
                            : 'text-orange-600 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-950/40'
                        }`}
                      >
                        {stock.inStock ? 'Rupture' : 'Réappro'}
                      </Button>
                    </div>

                    {stock.inStock && (
                      <div className="flex items-center gap-2 pl-6">
                        <div className="flex-1">
                          <label className="text-[10px] text-muted-foreground">Qté</label>
                          <Input
                            type="number"
                            value={stock.quantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 0;
                              setStocks(
                                stocks.map((s) =>
                                  s.id === stock.id ? { ...s, quantity: newQty } : s
                                )
                              );
                            }}
                            onBlur={() =>
                              handleUpdateStock(stock, { quantity: stock.quantity })
                            }
                            className="h-7 border-orange-200 text-xs dark:border-orange-900/50 dark:bg-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-muted-foreground">Prix (FCFA)</label>
                          <Input
                            type="number"
                            value={stock.price}
                            onChange={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0;
                              setStocks(
                                stocks.map((s) =>
                                  s.id === stock.id ? { ...s, price: newPrice } : s
                                )
                              );
                            }}
                            onBlur={() =>
                              handleUpdateStock(stock, { price: stock.price })
                            }
                            className="h-7 border-orange-200 text-xs dark:border-orange-900/50 dark:bg-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
