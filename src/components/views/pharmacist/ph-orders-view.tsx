'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Pill,
  Package,
  Clock,
  RefreshCw,
  AlertCircle,
  Inbox,
  ChevronRight,
  Search,
  Calendar,
  X,
  XCircle,
  Loader2,
  ShieldCheck,
  Camera,
  Smartphone,
  Keyboard,
  SearchCode,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { PharmacistPageHeader } from '@/components/views/pharmacist/ph-page-header';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';
import { useCapacitorBarcode } from '@/hooks/use-capacitor-barcode';
import { Haptics } from '@/lib/capacitor';

interface OrderData {
  id: string;
  status: string;
  totalQuantity: number;
  totalPrice: number;
  note?: string | null;
  pickupTime?: string | null;
  verificationCode?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  user: {
    name: string;
    phone: string | null;
  };
  items: {
    medication: {
      name: string;
      commercialName: string;
      form?: string;
    };
    quantity: number;
    price: number;
  }[];
}

type FilterTab = 'all' | 'pending' | 'confirmed' | 'ready' | 'picked_up' | 'cancelled';
type OrderTypeTab = 'all' | 'commande' | 'reservation';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'En attente',
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/50',
  },
  confirmed: {
    label: 'Confirmée',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50',
  },
  ready: {
    label: 'Prêtée',
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/50',
  },
  picked_up: {
    label: 'Récupérée',
    className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  },
  cancelled: {
    label: 'Annulée',
    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50',
  },
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'pending', label: 'En attente' },
  { key: 'confirmed', label: 'Confirmées' },
  { key: 'ready', label: 'Prêtées' },
  { key: 'picked_up', label: 'Récupérées' },
  { key: 'cancelled', label: 'Annulées' },
];

const ORDER_TYPE_TABS: { key: OrderTypeTab; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'commande', label: 'Commandes' },
  { key: 'reservation', label: 'Réservations' },
];

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `il y a ${diffMin}min`;
    if (diffH < 24) return `il y a ${diffH}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR', { useGrouping: true }) + ' FCFA';
}

export function PharmacistOrdersView() {
  const { currentUser, selectOrder, setCurrentView } = useAppStore();

  // Hook pour le scan QR code
  const { scan: scanQRCode, loading: scanningQR } = useCapacitorBarcode();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [orderTypeTab, setOrderTypeTab] = useState<OrderTypeTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({ all: 0 });
  const currentLimit = 10;
  const offsetRef = useRef(0);
  // Keep a ref for search debounce
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Verification dialog state
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const pharmacyId = currentUser?.linkedPharmacyId;

  // Debounce search query
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  const fetchOrders = useCallback(async (append = false) => {
    if (!pharmacyId) {
      setLoading(false);
      return;
    }
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }
      if (!append) offsetRef.current = 0;
      const params = new URLSearchParams({
        limit: String(currentLimit),
        offset: String(offsetRef.current),
      });
      if (activeTab !== 'all') params.set('status', activeTab);
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const res = await fetch(`/api/pharmacist/orders?${params}`);
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      const fetchedOrders = Array.isArray(data.orders) ? data.orders : [];
      if (append) {
        setOrders((prev) => [...prev, ...fetchedOrders]);
      } else {
        setOrders(fetchedOrders);
      }
      setTotal(data.total || 0);
      offsetRef.current = offsetRef.current + fetchedOrders.length;
      // Use API-provided status counts (global, not affected by search/date filters)
      if (data.statusCounts) {
        setStatusCounts(data.statusCounts);
      }
    } catch {
      setError('Impossible de charger les commandes');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [pharmacyId, activeTab, currentLimit, debouncedSearch, dateFrom, dateTo]);

  useEffect(() => {
    setOrders([]);
    fetchOrders(false);
  }, [activeTab, fetchOrders]);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setLoading(true);
    offsetRef.current = 0;
    fetchOrders(false);
  };

  const handleLoadMore = () => {
    if (loadingMore || orders.length >= total) return;
    fetchOrders(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const handleOrderClick = (orderId: string) => {
    selectOrder(orderId);
    setCurrentView('ph-order-detail');
  };

  // ── Scanner cleanup ──
  const cleanupScanner = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanupScanner();
  }, [cleanupScanner]);

  // ── Verify handler ──
  const handleVerify = async (code: string) => {
    if (!code.trim() || verifying) return;
    const normalized = code.toUpperCase().trim();
    try {
      setVerifying(true);
      setVerifyError(null);
      const res = await fetch('/api/pharmacist/orders/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || 'Erreur de vérification');
        toast.error(data.error || 'Code invalide');
        return;
      }
      if (data.alreadyVerified) {
        toast.info('Cette commande a déjà été vérifiée');
      } else {
        toast.success('Commande vérifiée avec succès !');
      }

      // Redirect to the verified order detail page
      selectOrder(data.id);
      setCurrentView('ph-order-detail');
      setVerifyCode('');
      cleanupScanner();
      setVerifyDialogOpen(false);
    } catch {
      setVerifyError('Erreur serveur');
      toast.error('Erreur de vérification');
    } finally {
      setVerifying(false);
    }
  };

  const startCameraScan = async () => {
    Haptics.medium();
    setScanError(null);
    setScanMode(true);

    try {
      const result = await scanQRCode({
        text: 'Placez le QR code de la commande dans le cadre'
      });

      if (result) {
        const content = result.content;
        const match = content.match(/PHARMAPP-[a-zA-Z0-9]+-([A-Z2-9]{6})$/);

        if (match) {
          setScanMode(false);
          await handleVerify(match[1]);
        } else if (/^[A-Z2-9]{6}$/.test(content.toUpperCase().trim())) {
          setScanMode(false);
          await handleVerify(content.toUpperCase().trim());
        } else {
          Haptics.error();
          toast.error('QR code invalide');
          setScanMode(false);
        }
      } else {
        setScanMode(false);
      }
    } catch {
      Haptics.error();
      setScanError('Scan annulé ou erreur');
      setScanMode(false);
    }
  };

  // Client-side order type filter (reservation vs commande)
  const typeFiltered = orderTypeTab === 'all'
    ? orders
    : orderTypeTab === 'reservation'
    ? orders.filter((o) => !!o.pickupTime)
    : orders.filter((o) => !o.pickupTime);

  const hasMore = orders.length < total;

  const hasActiveFilters = searchQuery || dateFrom || dateTo;
  const pendingCount = statusCounts.pending || 0;
  const readyCount = statusCounts.ready || 0;
  const verifiedCount = orders.filter((order) => !!order.verifiedAt).length;
  const activeStatusLabel = FILTER_TABS.find((tab) => tab.key === activeTab)?.label || 'Toutes';
  const openVerifyDialog = () => {
    setVerifyCode('');
    setVerifyError(null);
    setScanMode(false);
    setScanError(null);
    setVerifyDialogOpen(true);
  };

  // Loading skeletons
  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 py-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-20 flex-shrink-0 rounded-full" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full px-4 sm:px-6 py-4">
        <ViewHeader title="Commandes" icon={<ClipboardList className="h-5 w-5 text-amber-600" />} />
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Erreur de chargement</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-950/30">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-4 pb-28">
      {/* Header */}
      <PharmacistPageHeader
        title="Commandes"
        description="Suivez les retraits, contrôlez les statuts et vérifiez les codes client depuis le centre de commande de la pharmacie."
        icon={<ClipboardList className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="border border-white/20 bg-white/12 text-xs text-white">
              {total}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-2xl bg-white/12 text-white hover:bg-white/18 hover:text-white"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-4"
      >
        <Card className="border-amber-100 overflow-hidden shadow-sm dark:border-amber-900/50 dark:shadow-none">
          <div className="bg-gradient-to-br from-white via-amber-50/40 to-amber-100/60 dark:from-gray-900 dark:via-amber-950/20 dark:to-amber-950/35">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/50">
                      {activeStatusLabel}
                    </Badge>
                    <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-900/50 dark:text-amber-300">
                      {total} commande{total > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-foreground">
                    Gérez les retraits dans un flux plus clair
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    Suivez les commandes actives, repérez celles à préparer et lancez la vérification client sans quitter votre page.
                  </p>
                </div>
                <Button
                  onClick={openVerifyDialog}
                  className="bg-green-600 hover:bg-green-700 text-white sm:min-w-[190px]"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Vérifier un code
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="rounded-2xl border border-amber-100 bg-white/90 px-3 py-3 dark:border-amber-900/50 dark:bg-gray-900/90">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">En attente</p>
                  <p className="mt-1 text-lg font-bold text-amber-700 dark:text-amber-300">{pendingCount}</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-white/90 px-3 py-3 dark:border-amber-900/50 dark:bg-gray-900/90">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Prêtes</p>
                  <p className="mt-1 text-lg font-bold text-amber-700 dark:text-amber-300">{readyCount}</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-white/90 px-3 py-3 dark:border-amber-900/50 dark:bg-gray-900/90">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Vérifiées</p>
                  <p className="mt-1 text-lg font-bold text-amber-700 dark:text-amber-300">{verifiedCount}</p>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      <Card className="border-amber-100 mb-4 overflow-hidden dark:border-amber-900/50">
        <CardContent className="p-3 sm:p-4 space-y-3">
          {/* Search + Date Filters */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600" />
                <Input placeholder="Rechercher par patient..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 text-sm border-amber-200 focus:border-amber-400 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20" />
              </div>
              <Button variant="outline" size="icon" className={`h-10 w-10 shrink-0 ${showFilters || hasActiveFilters ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300' : 'border-amber-200 dark:border-amber-900/50'}`} onClick={() => setShowFilters(!showFilters)}>
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
            {showFilters && (
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Depuis</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-xs" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Jusqu&apos;au</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-xs" />
                </div>
                <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" />Effacer
                </Button>
              </div>
            )}
            {hasActiveFilters && !showFilters && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {searchQuery && (
                  <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 gap-1 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50">
                    &quot;{searchQuery}&quot;
                    <button onClick={() => setSearchQuery('')} className="hover:text-red-600"><X className="h-2.5 w-2.5" /></button>
                  </Badge>
                )}
                {dateFrom && (
                  <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 gap-1 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50">
                    {dateFrom}
                    <button onClick={() => setDateFrom('')} className="hover:text-red-600"><X className="h-2.5 w-2.5" /></button>
                  </Badge>
                )}
                {dateTo && (
                  <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 gap-1 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50">
                    → {dateTo}
                    <button onClick={() => setDateTo('')} className="hover:text-red-600"><X className="h-2.5 w-2.5" /></button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Order type toggle */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {ORDER_TYPE_TABS.map((tab) => {
              const isActive = orderTypeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setOrderTypeTab(tab.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${isActive ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50 dark:hover:bg-amber-950/50'}`}>
                  {tab.key === 'commande' && <Package className="h-3 w-3" />}
                  {tab.key === 'reservation' && <Clock className="h-3 w-3" />}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Filter tabs — uses global statusCounts from API */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {FILTER_TABS.map((tab) => {
              const count = statusCounts[tab.key] || 0;
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${isActive ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50 dark:hover:bg-amber-950/50'}`}>
                  {tab.label}
                  <span className={`text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 ${isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Orders list */}
      {typeFiltered.length === 0 ? (
        <Card className="border-amber-100">
          <CardContent className="p-8 text-center">
            <Inbox className="h-10 w-10 text-amber-300 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">{activeTab === 'all' ? 'Aucune commande' : `Aucune commande ${STATUS_CONFIG[activeTab]?.label?.toLowerCase() || ''}`}</h3>
            <p className="text-sm text-muted-foreground">{hasActiveFilters ? 'Aucune commande ne correspond à vos filtres' : activeTab === 'all' ? 'Les nouvelles commandes apparaîtront ici' : `Aucune commande avec le statut "${STATUS_CONFIG[activeTab]?.label || ''}"`}</p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-3 border-amber-200 text-amber-700 hover:bg-amber-50" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" />
                Effacer les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-3">
            {typeFiltered.map((order, index) => {
              const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const isReservation = !!order.pickupTime;
              const isVerified = !!order.verifiedAt;
              return (
                <motion.div key={order.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
                  <Card className={`${isVerified ? 'border-amber-300 bg-amber-50/20 dark:bg-amber-950/20 dark:border-amber-700/50' : 'border-amber-100 dark:border-amber-900/50 dark:bg-gray-900/90'} overflow-hidden cursor-pointer hover:border-amber-300 transition-colors active:scale-[0.99] duration-150 dark:hover:border-amber-700/50`} onClick={() => handleOrderClick(order.id)}>
                    <CardContent className="p-4 space-y-2.5">
                      {/* Top row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-mono text-muted-foreground flex-shrink-0">#{order.id.slice(0, 8)}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${isReservation ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50'}`}>
                            {isReservation ? 'Réservation' : 'Commande'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isVerified && (
                            <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 border-0 dark:bg-amber-900/60 dark:text-amber-200">
                              <ShieldCheck className="h-3 w-3 mr-0.5" />
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-[11px] px-2 py-0.5 flex-shrink-0 ${statusInfo.className}`}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Patient info */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 dark:bg-amber-950/40">
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{order.user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{order.user.name}</p>
                          {order.user.phone && <p className="text-xs text-muted-foreground">{order.user.phone}</p>}
                        </div>
                      </div>

                      {/* Medication info */}
                      <div className="flex items-start gap-2">
                        <Pill className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          {order.items.length === 1 ? (
                            <>
                              <p className="text-sm truncate">{order.items[0].medication.commercialName || order.items[0].medication.name}</p>
                              {order.items[0].medication.name !== order.items[0].medication.commercialName && (
                                <p className="text-xs text-muted-foreground truncate">{order.items[0].medication.name}</p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm truncate">{order.items.length} médicaments</p>
                          )}
                        </div>
                      </div>

                      {/* Verification code */}
                      {order.verificationCode && (
                        <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${isVerified ? 'bg-amber-100 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50' : 'bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50'}`}>
                          {isVerified ? (
                            <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                          ) : (
                            <SearchCode className="h-4 w-4 text-amber-600 shrink-0" />
                          )}
                          <span className="text-[11px] font-medium text-muted-foreground shrink-0">Code :</span>
                          <span className="text-sm font-bold tracking-[0.25em] font-mono flex-1">{order.verificationCode}</span>
                          {isVerified ? (
                            <Badge className="bg-amber-200 text-amber-800 text-[9px] px-1.5 py-0 border-0 shrink-0 font-medium dark:bg-amber-900/60 dark:text-amber-200">
                              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />Vérifié
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-200 text-amber-800 text-[9px] px-1.5 py-0 border-0 shrink-0 font-medium dark:bg-amber-900/60 dark:text-amber-200">
                              <SearchCode className="h-2.5 w-2.5 mr-0.5" />Non vérifié
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Details row */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Package className="h-3 w-3" />{order.totalQuantity}</span>
                        <span className="font-semibold text-foreground text-sm">{formatPrice(order.totalPrice)}</span>
                      </div>

                      {/* Pickup time */}
                      {order.pickupTime && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-300">
                          <Clock className="h-3 w-3" />
                          <span>Récupération prévue : {order.pickupTime}</span>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="border-t border-amber-100/80 flex items-center justify-between dark:border-amber-900/50">
                        <span className="text-[11px] text-muted-foreground pt-2">{formatRelativeTime(order.createdAt)}</span>
                        <ChevronRight className="h-4 w-4 text-amber-400 pt-2" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Load more */}
      {typeFiltered.length > 0 && hasMore && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore} className="border-green-200 text-green-700 hover:bg-green-50 px-6 dark:border-green-900/50 dark:text-green-300 dark:hover:bg-green-950/30">
            {loadingMore ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Chargement...</>) : (`Charger plus (${total - orders.length} restantes)`)}
          </Button>
        </div>
      )}

      {/* ── Floating Verify Button ── */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 left-0 right-0 z-40 pointer-events-none">
        <div className="w-full px-4 sm:px-6 pointer-events-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button
              onClick={openVerifyDialog}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-600/25 text-sm font-medium"
            >
              <ShieldCheck className="h-5 w-5 mr-2" />
              Vérifier une commande
            </Button>
          </motion.div>
        </div>
      </div>

      {/* ── Verify Dialog ── */}
      <Dialog open={verifyDialogOpen} onOpenChange={(open) => {
        if (!open) { cleanupScanner(); setScanMode(false); setVerifyCode(''); setVerifyError(null); setScanError(null); }
        setVerifyDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md mx-auto p-0 gap-0 overflow-hidden rounded-2xl border-amber-200 dark:border-amber-900/50 dark:bg-gray-950">
          <DialogHeader className="bg-gradient-to-r from-amber-600 to-amber-800 px-5 py-4 text-white shrink-0">
            <DialogTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Vérifier une commande
            </DialogTitle>
            <DialogDescription className="text-amber-200 text-xs mt-1">
              Saisissez le code du patient ou scannez le QR code
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => { cleanupScanner(); setScanMode(false); setScanError(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${!scanMode ? 'bg-amber-100 text-amber-700 border-2 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50' : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'}`}
              >
                <Keyboard className="h-4 w-4" />
                Saisie manuelle
              </button>
              <button
                onClick={() => { setScanError(null); startCameraScan(); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${scanMode ? 'bg-amber-100 text-amber-700 border-2 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50' : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'}`}
              >
                <Camera className="h-4 w-4" />
                Scanner QR
              </button>
            </div>

            {/* Camera view */}
            {scanMode && (
              <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3]">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                {!streamRef.current && !scanError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 space-y-2">
                    <Camera className="h-8 w-8" />
                    <p className="text-xs">Démarrage de la caméra...</p>
                  </div>
                )}
                {verifying && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                    <p className="text-xs text-white">Vérification en cours...</p>
                  </div>
                )}
                {streamRef.current && !verifying && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white/50 rounded-2xl">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-400 rounded-tl-xl -translate-x-[1px] -translate-y-[1px]" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-400 rounded-tr-xl translate-x-[1px] -translate-y-[1px]" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-400 rounded-bl-xl -translate-x-[1px] translate-y-[1px]" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-400 rounded-br-xl translate-x-[1px] translate-y-[1px]" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {scanMode && scanError && (
              <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3">
                <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{scanError}</p>
              </div>
            )}

            {scanMode && !scanError && streamRef.current && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Pointez la caméra vers le QR code du patient</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-[11px] text-muted-foreground">ou</span>
              <Separator className="flex-1" />
            </div>

            {/* Manual code input */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">Code de vérification (6 caractères)</label>
              <Input
                value={verifyCode}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6);
                  setVerifyCode(val);
                  setVerifyError(null);
                }}
                placeholder="Ex: A3K9X2"
                className="h-12 text-center text-2xl font-mono tracking-[0.4em] font-bold border-amber-200 focus:border-amber-400 dark:border-amber-900/50 dark:bg-gray-900"
                maxLength={6}
                disabled={verifying}
                autoFocus={!scanMode}
              />
              <Button
                onClick={() => handleVerify(verifyCode)}
                disabled={verifyCode.length !== 6 || verifying}
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-40"
              >
                {verifying ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Vérification...</>
                ) : (
                  <><ShieldCheck className="h-4 w-4 mr-2" />Vérifier le code</>
                )}
              </Button>
            </div>

            {verifyError && (
              <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3">
                <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{verifyError}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
