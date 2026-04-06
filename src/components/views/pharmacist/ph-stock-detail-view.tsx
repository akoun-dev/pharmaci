'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Pill,
  Clock,
  Save,
  Trash2,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  Loader2,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ViewHeader } from '@/components/view-header';
import { PharmacistPageHeader } from '@/components/views/pharmacist/ph-page-header';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';

interface StockData {
  id: string;
  pharmacyId: string;
  medicationId: string;
  price: number;
  inStock: boolean;
  quantity: number;
  updatedAt: string;
  expirationDate: string | null;
  needsPrescription: boolean;
  medication: {
    id: string;
    name: string;
    commercialName: string;
    category?: string | null;
    form?: string | null;
    description?: string | null;
    activePrinciple?: string | null;
  };
}

interface HistoryEntry {
  id: string;
  type: string;
  quantity: number;
  note?: string | null;
  createdAt: string;
  medication: {
    name: string;
    commercialName: string;
  };
}

const HISTORY_CONFIG: Record<string, { icon: typeof ArrowUp; color: string; bgColor: string; label: string }> = {
  entry: { icon: ArrowUp, color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'Entrée' },
  exit: { icon: ArrowDown, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Sortie' },
  adjustment: { icon: RotateCcw, color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'Ajustement' },
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function PharmacistStockDetailView() {
  const { selectedStockId, goBack, setCurrentView } = useAppStore();

  const [stock, setStock] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit fields
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editInStock, setEditInStock] = useState(true);
  const [editNeedsPrescription, setEditNeedsPrescription] = useState(false);
  const [editExpirationDate, setEditExpirationDate] = useState('');
  const [saving, setSaving] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState(false);

  const fetchStock = useCallback(async () => {
    if (!selectedStockId) {
      setLoading(false);
      setError('Stock non sélectionné');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/pharmacist/stocks/${selectedStockId}`);
      if (!res.ok) throw new Error('Stock non trouvé');
      const data = await res.json();
      setStock(data);
      setEditPrice(String(data.price));
      setEditQuantity(String(data.quantity));
      setEditInStock(data.inStock);
      setEditNeedsPrescription(data.needsPrescription || false);
      setEditExpirationDate(data.expirationDate ? data.expirationDate.split('T')[0] : '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  }, [selectedStockId]);

  const fetchHistory = useCallback(async (append = false) => {
    if (!selectedStockId) return;

    try {
      if (!append) {
        setHistoryLoading(true);
      } else {
        setLoadingMoreHistory(true);
      }
      const offset = append ? historyOffset : 0;
      const res = await fetch(`/api/pharmacist/stocks/${selectedStockId}/history?limit=50&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        const entries = Array.isArray(data.history) ? data.history : [];
        if (append) {
          setHistory((prev) => [...prev, ...entries]);
        } else {
          setHistory(entries);
        }
        setHistoryTotal(data.total || 0);
        setHistoryOffset(offset + entries.length);
      }
    } catch {
      // Non-critical
    } finally {
      setHistoryLoading(false);
      setLoadingMoreHistory(false);
    }
  }, [selectedStockId, historyOffset]);

  useEffect(() => {
    fetchStock();
    fetchHistory();
  }, [fetchStock, fetchHistory]);

  const handleSave = async () => {
    if (!selectedStockId) return;

    const parsedPrice = parseFloat(editPrice);
    const parsedQuantity = parseInt(editQuantity, 10);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error('Le prix doit être un nombre positif');
      return;
    }
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      toast.error('La quantité doit être un entier positif');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/pharmacist/stocks/${selectedStockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parsedPrice, quantity: parsedQuantity, inStock: editInStock, needsPrescription: editNeedsPrescription, expirationDate: editExpirationDate || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      setStock(data);
      setEditPrice(String(data.price));
      setEditQuantity(String(data.quantity));
      setEditInStock(data.inStock);
      setEditNeedsPrescription(data.needsPrescription || false);
      setEditExpirationDate(data.expirationDate ? data.expirationDate.split('T')[0] : '');
      toast.success('Stock mis à jour avec succès');
      setHistoryOffset(0);
      fetchHistory(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur serveur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStockId) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/pharmacist/stocks/${selectedStockId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      toast.success('Médicament supprimé du stock');
      setCurrentView('ph-stock-list');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur serveur');
    } finally {
      setDeleting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 py-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  // Error state
  if (error || !stock) {
    return (
      <div className="w-full px-4 sm:px-6 py-4">
        <ViewHeader title="Détail du stock" icon={<Package className="h-5 w-5 text-orange-600" />} back />
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-700 mb-1">{error || 'Stock non trouvé'}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-red-200 text-red-600 hover:bg-red-50"
              onClick={goBack}
            >
              Retour aux stocks
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const medName = stock.medication.commercialName || stock.medication.name;
  const genericName = stock.medication.commercialName ? stock.medication.name : null;
  const currentQty = stock.quantity;

  // Expiration status
  let expirationStatus: 'expired' | 'soon' | 'ok' | null = null;
  let expirationDiffDays = 0;
  if (stock.expirationDate) {
    const now = new Date();
    const exp = new Date(stock.expirationDate);
    expirationDiffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (expirationDiffDays < 0) expirationStatus = 'expired';
    else if (expirationDiffDays <= 30) expirationStatus = 'soon';
    else expirationStatus = 'ok';
  }

  const formattedExpirationDate = stock.expirationDate
    ? new Date(stock.expirationDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const qtyColor = !stock.inStock || currentQty === 0
    ? 'text-red-600'
    : currentQty < 10
    ? 'text-orange-600'
    : currentQty <= 20
    ? 'text-amber-600'
    : 'text-orange-600';

  const qtyBgColor = !stock.inStock || currentQty === 0
    ? 'bg-red-50'
    : currentQty < 10
    ? 'bg-orange-50'
    : currentQty <= 20
    ? 'bg-amber-50'
    : 'bg-orange-50';

  return (
    <div className="pb-6">
      <div className="w-full px-4 sm:px-6">
        {/* Header */}
        <PharmacistPageHeader
          title="Détail du stock"
          description="Consultez les quantités, les informations produit et l’état du stock pour cette référence en pharmacie."
          icon={<Package className="h-5 w-5" />}
          action={
            <Button
              variant="ghost"
              size="sm"
              className="h-10 rounded-2xl bg-white/12 px-4 text-white hover:bg-white/18"
              onClick={goBack}
            >
              Retour
            </Button>
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Medication info header */}
          <Card className="border-orange-100 mb-3">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Pill className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-base">{medName}</h2>
                  {genericName && genericName !== medName && (
                    <p className="text-xs text-muted-foreground mt-0.5">{genericName}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {stock.needsPrescription && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-200 text-amber-700 bg-amber-50">
                        <FileText className="h-3 w-3 mr-0.5" />
                        Sur ordonnance
                      </Badge>
                    )}
                    {stock.medication.category && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {stock.medication.category}
                      </Badge>
                    )}
                    {stock.medication.form && (
                      <span className="text-[11px] text-muted-foreground">{stock.medication.form}</span>
                    )}
                  </div>
                  {stock.medication.description && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {stock.medication.description}
                    </p>
                  )}
                  {stock.medication.activePrinciple && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      <span className="font-medium">Principe actif :</span> {stock.medication.activePrinciple}
                    </p>
                  )}
                  {formattedExpirationDate && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Expiration : {formattedExpirationDate}</span>
                      {expirationStatus === 'expired' && (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0 ml-1">Périmé</Badge>
                      )}
                      {expirationStatus === 'soon' && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] px-1.5 py-0 ml-1">Expire bientôt</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current stock card */}
          <Card className="border-orange-100 mb-3">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className={`${qtyBgColor} rounded-xl p-3 text-center`}>
                  <p className="text-xs text-muted-foreground mb-1">Quantité</p>
                  <p className={`text-3xl font-bold ${qtyColor}`}>{currentQty}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">unités</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Prix</p>
                  <p className="text-2xl font-bold text-orange-700">{stock.price.toLocaleString('fr-FR')}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">FCFA</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center">
                <Badge
                  variant="outline"
                  className={`text-xs px-3 py-1 ${
                    stock.inStock
                      ? 'border-orange-200 text-orange-700 bg-orange-50'
                      : 'border-red-200 text-red-700 bg-red-50'
                  }`}
                >
                  {stock.inStock ? '✓ En stock' : '✕ Rupture de stock'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Edit section */}
          <Card className="border-orange-100 mb-3">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Save className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold text-sm">Modifier le stock</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Prix (FCFA)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="h-10 border-orange-200 focus:border-orange-400 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Quantité</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="h-10 border-orange-200 focus:border-orange-400 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date d&apos;expiration</Label>
                <Input
                  type="date"
                  value={editExpirationDate}
                  onChange={(e) => setEditExpirationDate(e.target.value)}
                  className="h-10 border-orange-200 focus:border-orange-400 text-sm"
                />
                {expirationStatus === 'expired' && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Ce produit est périmé depuis {Math.abs(expirationDiffDays)} jours
                  </p>
                )}
                {expirationStatus === 'soon' && (
                  <p className="text-[11px] text-orange-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Ce produit expire dans {expirationDiffDays} jours
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">En stock</Label>
                  <p className="text-[11px] text-muted-foreground">Désactiver si le produit est en rupture</p>
                </div>
                <Switch
                  checked={editInStock}
                  onCheckedChange={setEditInStock}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-amber-600" />
                    Sur ordonnance
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Le patient doit se présenter avec son ordonnance</p>
                </div>
                <Switch
                  checked={editNeedsPrescription}
                  onCheckedChange={setEditNeedsPrescription}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white h-11"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mise à jour...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Mettre à jour
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Stock history */}
          <Card className="border-orange-100 mb-3">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold text-sm">Historique des mouvements</h3>
              </div>

              {historyLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-6">
                  <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Aucun mouvement enregistré</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.map((entry, index) => {
                    const config = HISTORY_CONFIG[entry.type] || HISTORY_CONFIG.adjustment;
                    const Icon = config.icon;
                    const isPositive = entry.type === 'entry';

                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] px-1.5 py-0 ${config.bgColor} ${config.color} border-0`}
                            >
                              {config.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                              {formatDate(entry.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs font-semibold mt-1">
                            {isPositive ? '+' : '-'}{entry.quantity} unités
                          </p>
                          {entry.note && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{entry.note}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  {/* Load more history button */}
                  {history.length > 0 && history.length < historyTotal && (
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchHistory(true)}
                        disabled={loadingMoreHistory}
                        className="w-full text-xs text-orange-700 hover:bg-orange-50 border border-orange-200"
                      >
                        {loadingMoreHistory ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            Chargement...
                          </>
                        ) : (
                          `Voir plus (${historyTotal - history.length} restants)`
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-11 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 mt-2"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer ce médicament
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce médicament ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action va retirer <strong>{medName}</strong> de votre stock. Un historique de sortie sera
                  automatiquement créé. Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Suppression...
                    </div>
                  ) : (
                    'Supprimer'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </div>
    </div>
  );
}
