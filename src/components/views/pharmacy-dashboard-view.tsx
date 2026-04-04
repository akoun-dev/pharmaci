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

export function PharmacyDashboardView() {
  const {
    setCurrentView,
  } = useAppStore();

  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  return (
    <div className="pb-4">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ViewHeader title="Gestion de stock" back icon={<Building2 className="h-5 w-5 text-emerald-600" />} />

        {/* Pharmacy selector */}
        <div className="mb-4">
          <Select value={selectedPharmacyId} onValueChange={setSelectedPharmacyId}>
            <SelectTrigger className="border-emerald-200">
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
          <Card className="border-emerald-100">
            <CardContent className="p-3 text-center">
              <Package className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
              <p className="text-lg font-bold text-emerald-700">{totalMeds}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-100">
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
              <p className="text-lg font-bold text-emerald-700">{inStockCount}</p>
              <p className="text-[10px] text-muted-foreground">En stock</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-100">
            <CardContent className="p-3 text-center">
              <XCircle className="h-5 w-5 mx-auto text-red-500 mb-1" />
              <p className="text-lg font-bold text-red-600">{outOfStockCount}</p>
              <p className="text-[10px] text-muted-foreground">Rupture</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-100">
            <CardContent className="p-3 text-center">
              <AlertTriangle className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold text-amber-600">{lowStockCount}</p>
              <p className="text-[10px] text-muted-foreground">Stock bas</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Low stock alerts */}
        {lowStockCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-4">
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Alertes stock bas ({lowStockCount})
                  </span>
                </div>
                <div className="space-y-1">
                  {stocks
                    .filter((s) => s.inStock && s.quantity < 20)
                    .slice(0, 3)
                    .map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="text-amber-700">{s.medication.name}</span>
                        <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
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
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            Inventaire
          </h3>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : stocks.length === 0 ? (
            <Card className="border-emerald-100">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-2">
                  <Boxes className="w-10 h-10 text-emerald-600" />
                </div>
                <p className="text-sm text-muted-foreground">Aucun médicament enregistré</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {stocks.map((stock) => (
                <Card
                  key={stock.id}
                  className={`border ${stock.inStock ? 'border-emerald-100' : 'border-red-100'} overflow-hidden`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{stock.medication.name}</span>
                          {stock.inStock ? (
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 h-4">
                              En stock
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 h-4">
                              Rupture
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
                        className={`border-emerald-200 text-xs ${
                          stock.inStock
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
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
                            className="h-7 text-xs border-emerald-200"
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
                            className="h-7 text-xs border-emerald-200"
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
