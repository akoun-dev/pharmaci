'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Search,
  Plus,
  SlidersHorizontal,
  Pill,
  ChevronRight,
  AlertCircle,
  X,
  Clock,
  Loader2,
  FileText,
  Download,
  Upload,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpRight,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ViewHeader } from '@/components/view-header';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'in_stock' | 'out_of_stock' | 'low_stock';
type SortOption = 'name_asc' | 'price_asc' | 'price_desc' | 'quantity_desc' | 'expiration_asc';

interface StockItem {
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
  };
}

interface ImportResult {
  success: boolean;
  total: number;
  created: number;
  updated: number;
  errors: { row: number; field: string; message: string }[];
}

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'in_stock', label: 'En stock' },
  { key: 'out_of_stock', label: 'Rupture' },
  { key: 'low_stock', label: 'Stock faible' },
];

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'name_asc', label: 'Nom A-Z' },
  { key: 'price_asc', label: 'Prix ↑' },
  { key: 'price_desc', label: 'Prix ↓' },
  { key: 'quantity_desc', label: 'Quantité ↑' },
  { key: 'expiration_asc', label: 'Expiration ↑' },
];

function getQuantityColor(qty: number, inStock: boolean): string {
  if (!inStock || qty === 0) return 'text-red-600 bg-red-50';
  if (qty < 10) return 'text-orange-600 bg-orange-50';
  if (qty <= 20) return 'text-amber-600 bg-amber-50';
  return 'text-emerald-600 bg-emerald-50';
}

function getQuantityBorderColor(qty: number, inStock: boolean): string {
  if (!inStock || qty === 0) return 'border-red-200';
  if (qty < 10) return 'border-orange-200';
  if (qty <= 20) return 'border-amber-200';
  return 'border-emerald-200';
}

function getExpirationStatus(expirationDate: string | null): 'expired' | 'soon' | 'ok' | null {
  if (!expirationDate) return null;
  const now = new Date();
  const exp = new Date(expirationDate);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'soon';
  return 'ok';
}

function formatExpirationDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function PharmacistStockListView() {
  const { currentUser, selectStock, setCurrentView } = useAppStore();

  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('name_asc');
  const [showSort, setShowSort] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const currentLimit = 20;
  const offsetRef = useRef(0);

  // Import/Export state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importStep, setImportStep] = useState<'select' | 'result'>('select');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStocks = useCallback(async (append = false) => {
    if (!currentUser?.linkedPharmacyId) {
      setLoading(false);
      setError('Aucune pharmacie associée à votre compte');
      return;
    }

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      if (!append) offsetRef.current = 0;
      const params = new URLSearchParams({
        limit: String(currentLimit),
        offset: String(offsetRef.current),
      });
      if (searchQuery) params.set('q', searchQuery);
      if (activeTab !== 'all') params.set('status', activeTab);
      params.set('sort', sortOption);

      const res = await fetch(`/api/pharmacist/stocks?${params}`);
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des stocks');
      }

      const data = await res.json();
      const fetchedStocks = Array.isArray(data.stocks) ? data.stocks : [];
      if (append) {
        setStocks((prev) => [...prev, ...fetchedStocks]);
      } else {
        setStocks(fetchedStocks);
      }
      setTotal(data.total || 0);
      offsetRef.current = offsetRef.current + fetchedStocks.length;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur serveur');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentUser?.linkedPharmacyId, searchQuery, activeTab, sortOption, currentLimit]);

  useEffect(() => {
    setStocks([]);
    fetchStocks(false);
  }, [fetchStocks]);

  const handleCardClick = (stockId: string) => {
    selectStock(stockId);
    setCurrentView('ph-stock-detail');
  };

  const handleSearchToggle = () => {
    if (searchOpen) {
      setSearchQuery('');
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
      setTimeout(() => {
        const input = document.getElementById('stock-search-input');
        if (input) input.focus();
      }, 100);
    }
  };

  // ── Export handler ──
  const handleExportExcel = async () => {
    setShowMoreMenu(false);
    try {
      setExporting(true);
      const res = await fetch('/api/pharmacist/stocks/excel');
      if (!res.ok) throw new Error("Erreur lors de l'export");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Stock exporté en Excel avec succès');
    } catch {
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  // ── Download template ──
  const handleDownloadTemplate = async () => {
    setShowMoreMenu(false);
    try {
      const res = await fetch('/api/pharmacist/stocks/excel/template');
      if (!res.ok) throw new Error("Erreur lors du téléchargement");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modele_import_pharmapp.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Modèle téléchargé');
    } catch {
      toast.error("Erreur lors du téléchargement du modèle");
    }
  };

  // ── Import handler ──
  const handleImportExcel = async () => {
    if (!importFile) return;
    try {
      setImporting(true);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', importFile);

      const res = await fetch('/api/pharmacist/stocks/excel/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'import");
        return;
      }

      setImportResult(data);
      setImportStep('result');

      if (data.created > 0 || data.updated > 0) {
        toast.success(`${data.created} ajouté(s), ${data.updated} mis à jour`);
      }

      // Refresh stock list
      fetchStocks(false);
    } catch {
      toast.error("Erreur lors de l'import");
    } finally {
      setImporting(false);
    }
  };

  const resetImportDialog = () => {
    setImportDialogOpen(false);
    setImportFile(null);
    setImportResult(null);
    setImportStep('select');
    setImporting(false);
  };

  return (
    <div className="pb-4">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <ViewHeader
          title="Gestion des Stocks"
          icon={<Package className="h-5 w-5 text-emerald-600" />}
          back={false}
          action={
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-emerald-600 hover:bg-emerald-50"
                onClick={handleSearchToggle}
              >
                {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 ${showSort ? 'text-emerald-600 bg-emerald-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                onClick={() => setShowSort(!showSort)}
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
              {/* More menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-emerald-600 hover:bg-emerald-50"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>

                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-10 z-50 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                    >
                      <button
                        onClick={handleExportExcel}
                        disabled={exporting}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-emerald-50 transition-colors disabled:opacity-50"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <Download className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">Exporter en Excel</p>
                          <p className="text-[11px] text-muted-foreground">Télécharger le stock complet</p>
                        </div>
                        {exporting && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
                      </button>

                      <Separator className="bg-gray-100" />

                      <button
                        onClick={() => { setShowMoreMenu(false); setImportDialogOpen(true); setImportStep('select'); setImportFile(null); setImportResult(null); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-emerald-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Upload className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">Importer depuis Excel</p>
                          <p className="text-[11px] text-muted-foreground">Ajouter ou mettre à jour en masse</p>
                        </div>
                      </button>

                      <Separator className="bg-gray-100" />

                      <button
                        onClick={handleDownloadTemplate}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-emerald-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                          <FileSpreadsheet className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">Modèle d&apos;import</p>
                          <p className="text-[11px] text-muted-foreground">Télécharger le fichier modèle</p>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          }
        />

        {/* Click-away overlay for menu */}
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMoreMenu(false)}
                />
              )}
            </AnimatePresence>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-3"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="stock-search-input"
                  placeholder="Rechercher un médicament..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 border-emerald-200 focus:border-emerald-400 bg-emerald-50/30"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sort dropdown */}
        <AnimatePresence>
          {showSort && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-3"
            >
              <div className="flex flex-wrap gap-1.5 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSortOption(opt.key);
                      setShowSort(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      sortOption === opt.key
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {stocks.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 ml-auto flex-shrink-0">
              {total}
            </Badge>
          )}
        </div>

        {/* Error state */}
        {error && !loading && (
          <Card className="border-red-200">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700 mb-1">Erreur</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => fetchStocks()}
              >
                Réessayer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && stocks.length === 0 && (
          <Card className="border-emerald-100">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <Package className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-sm mb-1">
                {searchQuery ? 'Aucun résultat' : 'Aucun médicament en stock'}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                {searchQuery
                  ? `Aucun médicament trouvé pour "${searchQuery}"`
                  : 'Ajoutez des médicaments pour commencer la gestion de votre stock'}
              </p>
              {!searchQuery && (
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button
                    onClick={() => setCurrentView('ph-stock-add')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un médicament
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setImportDialogOpen(true); setImportStep('select'); setImportFile(null); setImportResult(null); }}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importer Excel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stock list */}
        {!loading && !error && stocks.length > 0 && (
          <AnimatePresence>
            <div className="space-y-2.5">
              {stocks.map((stock, index) => {
                const medName = stock.medication.commercialName || stock.medication.name;
                const genericName = stock.medication.commercialName ? stock.medication.name : null;
                const qtyColor = getQuantityColor(stock.quantity, stock.inStock);
                const qtyBorder = getQuantityBorderColor(stock.quantity, stock.inStock);

                return (
                  <motion.div
                    key={stock.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className="border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                      onClick={() => handleCardClick(stock.id)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Pill className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm truncate leading-tight">{medName}</p>
                              {genericName && genericName !== medName && (
                                <p className="text-xs text-muted-foreground truncate">{genericName}</p>
                              )}
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {stock.medication.category && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {stock.medication.category}
                                  </Badge>
                                )}
                                {stock.medication.form && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {stock.medication.form}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <div className="flex items-center gap-1.5">
                              {stock.needsPrescription && (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">
                                  <FileText className="h-2.5 w-2.5 mr-0.5" />
                                  Ordonnance
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${
                                  stock.inStock
                                    ? 'border-emerald-200 text-emerald-700'
                                    : 'border-red-200 text-red-700'
                                }`}
                              >
                                {stock.inStock ? 'En stock' : 'Rupture'}
                              </Badge>
                              {(() => {
                                const expStatus = getExpirationStatus(stock.expirationDate);
                                if (expStatus === 'expired') {
                                  return (
                                    <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0">
                                      Périmé
                                    </Badge>
                                  );
                                }
                                if (expStatus === 'soon') {
                                  return (
                                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] px-1.5 py-0">
                                      Expire bientôt
                                    </Badge>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-1 pt-2 border-t border-emerald-50">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground">
                              {stock.price.toLocaleString('fr-FR')}{' '}
                              <span className="text-xs font-normal text-muted-foreground">FCFA</span>
                            </p>
                            {stock.expirationDate && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 flex-shrink-0">
                                <Clock className="h-3 w-3" />
                                {formatExpirationDate(stock.expirationDate)}
                              </span>
                            )}
                          </div>
                          <div
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold ${qtyColor} border ${qtyBorder}`}
                          >
                            <Package className="h-3 w-3" />
                            {stock.quantity} unités
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Load more button */}
        {!loading && !error && stocks.length > 0 && stocks.length < total && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => fetchStocks(true)}
              disabled={loadingMore}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-6"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : (
                `Charger plus (${total - stocks.length} restants)`
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Floating add button */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px)+1rem)] right-4 sm:right-6 z-40">
        <Button
          onClick={() => setCurrentView('ph-stock-add')}
          className="h-14 w-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* ── Import Dialog ── */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => { if (!open) resetImportDialog(); }}>
        <DialogContent className="sm:max-w-md mx-auto p-0 gap-0 overflow-hidden rounded-2xl border-emerald-200">
          <DialogHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-white shrink-0">
            <DialogTitle className="text-base flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {importStep === 'select' ? 'Importer un fichier Excel' : 'Résultat de l\'import'}
            </DialogTitle>
            <DialogDescription className="text-emerald-200 text-xs mt-1">
              {importStep === 'select'
                ? 'Ajoutez ou mettez à jour votre stock en masse'
                : 'Résumé du traitement de votre fichier'}
            </DialogDescription>
          </DialogHeader>

          <div className="p-5">
            {importStep === 'select' && (
              <div className="space-y-4">
                {/* Step 1: Download template */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">1</span>
                    Étape 1 : Télécharger le modèle
                  </div>
                  <Card className="border-amber-100 bg-amber-50/30">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2.5">
                        <FileSpreadsheet className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium">Téléchargez le modèle Excel et remplissez-le avec vos données</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Colonnes : Nom commercial, Nom générique, Catégorie, Forme, Prix, Quantité...
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        className="mt-2.5 w-full border-amber-200 text-amber-700 hover:bg-amber-50 h-9 text-xs"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Télécharger le modèle
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 2: Upload file */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">2</span>
                    Étape 2 : Charger votre fichier
                  </div>

                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      importFile
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setImportFile(file);
                      }}
                      className="hidden"
                    />
                    {importFile ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto">
                          <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                        </div>
                        <p className="text-sm font-medium text-emerald-700 truncate">{importFile.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {(importFile.size / 1024).toFixed(1)} Ko
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); setImportFile(null); }}
                          className="text-xs text-red-500 hover:text-red-700 underline"
                        >
                          Changer de fichier
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto">
                          <Upload className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium">Cliquez pour sélectionner un fichier</p>
                        <p className="text-[11px] text-muted-foreground">.xlsx uniquement</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Import button */}
                <Button
                  onClick={handleImportExcel}
                  disabled={!importFile || importing}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-40"
                >
                  {importing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Import en cours...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" />Importer le fichier</>
                  )}
                </Button>
              </div>
            )}

            {importStep === 'result' && importResult && (
              <div className="space-y-4">
                {/* Success summary */}
                <div className="grid grid-cols-3 gap-2">
                  <Card className="border-emerald-200 bg-emerald-50/50">
                    <CardContent className="p-3 text-center">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-emerald-700">{importResult.created}</p>
                      <p className="text-[10px] text-muted-foreground">Ajouté(s)</p>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-3 text-center">
                      <Package className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-blue-700">{importResult.updated}</p>
                      <p className="text-[10px] text-muted-foreground">Mis à jour</p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200 bg-gray-50/50">
                    <CardContent className="p-3 text-center">
                      <AlertCircle className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-600">{importResult.total}</p>
                      <p className="text-[10px] text-muted-foreground">Total traité</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Errors */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {importResult.errors.length} avertissement(s)
                    </div>
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-amber-200 divide-y divide-amber-100">
                      {importResult.errors.slice(0, 10).map((err, i) => (
                        <div key={i} className="px-3 py-2 flex items-start gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground bg-gray-100 rounded px-1.5 py-0.5 shrink-0">
                            L{err.row}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-amber-700">{err.field}</p>
                            <p className="text-[11px] text-muted-foreground">{err.message}</p>
                          </div>
                        </div>
                      ))}
                      {importResult.errors.length > 10 && (
                        <div className="px-3 py-2 text-[11px] text-muted-foreground text-center">
                          ...et {importResult.errors.length - 10} autres
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Success message */}
                {(importResult.created > 0 || importResult.updated > 0) && (
                  <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      Votre stock a été mis à jour avec succès. Consultez la liste ci-dessous pour vérifier les modifications.
                    </p>
                  </div>
                )}

                {/* Close button */}
                <Button
                  onClick={resetImportDialog}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                >
                  Fermer
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
