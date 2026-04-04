'use client';

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
  CreditCard,
  ChevronRight,
  Truck,
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
import { useAppStore } from '@/store/app-store';
import { PAYMENT_LABELS } from '@/lib/navigation';
import { toast } from 'sonner';

interface OrderData {
  id: string;
  status: string;
  deliveryStatus: string;
  quantity: number;
  totalPrice: number;
  note?: string | null;
  paymentMethod?: string | null;
  pickupTime?: string | null;
  verificationCode?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  user: {
    name: string;
    phone: string | null;
  };
  medication: {
    name: string;
    commercialName: string;
    form?: string;
  };
}

type FilterTab = 'all' | 'pending' | 'confirmed' | 'ready' | 'picked_up' | 'cancelled';
type OrderTypeTab = 'all' | 'commande' | 'reservation';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'En attente',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  confirmed: {
    label: 'Confirmée',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  ready: {
    label: 'Prêtée',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  picked_up: {
    label: 'Récupérée',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  cancelled: {
    label: 'Annulée',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
};

const DELIVERY_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pickup: {
    label: 'Retrait',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  preparing: {
    label: 'En préparation',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  ready: {
    label: 'Prêt',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  delivering: {
    label: 'En livraison',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  delivered: {
    label: 'Livré',
    className: 'bg-green-100 text-green-700 border-green-200',
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        toast.success('Commande vérifiée avec succès ! 🎉');
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
    try {
      setScanError(null);
      setScanMode(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const text = barcodes[0].rawValue;
              const match = text.match(/PHARMAPP-[a-zA-Z0-9]+-([A-Z2-9]{6})$/);
              if (match) { cleanupScanner(); await handleVerify(match[1]); }
              else if (/^[A-Z2-9]{6}$/.test(text.toUpperCase().trim())) {
                cleanupScanner(); await handleVerify(text.toUpperCase().trim());
              }
            }
          } catch { /* continue scanning */ }
        }, 500);
      } else {
        setScanError("La détection QR n'est pas supportée sur ce navigateur.");
      }
    } catch {
      setScanError("Impossible d'accéder à la caméra.");
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

  // Loading skeletons
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-4">
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <ViewHeader title="Commandes" icon={<ClipboardList className="h-5 w-5 text-emerald-600" />} />
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Erreur de chargement</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 pb-28">
      {/* Header */}
      <ViewHeader
        title="Commandes"
        icon={<ClipboardList className="h-5 w-5 text-emerald-600" />}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{total}</Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-600" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      {/* Search + Date Filters */}
      <div className="space-y-2 mb-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par patient..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 text-sm border-emerald-200 focus:border-emerald-400" />
          </div>
          <Button variant="outline" size="icon" className={`h-10 w-10 shrink-0 ${showFilters || hasActiveFilters ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-emerald-200'}`} onClick={() => setShowFilters(!showFilters)}>
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
              <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery('')} className="hover:text-red-600"><X className="h-2.5 w-2.5" /></button>
              </Badge>
            )}
            {dateFrom && (
              <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                {dateFrom}
                <button onClick={() => setDateFrom('')} className="hover:text-red-600"><X className="h-2.5 w-2.5" /></button>
              </Badge>
            )}
            {dateTo && (
              <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                → {dateTo}
                <button onClick={() => setDateTo('')} className="hover:text-red-600"><X className="h-2.5 w-2.5" /></button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Order type toggle */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
        {ORDER_TYPE_TABS.map((tab) => {
          const isActive = orderTypeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setOrderTypeTab(tab.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${isActive ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
              {tab.key === 'commande' && <Package className="h-3 w-3" />}
              {tab.key === 'reservation' && <Clock className="h-3 w-3" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter tabs — uses global statusCounts from API */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const count = statusCounts[tab.key] || 0;
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${isActive ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
              {tab.label}
              <span className={`text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {typeFiltered.length === 0 ? (
        <Card className="border-emerald-100">
          <CardContent className="p-8 text-center">
            <Inbox className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">{activeTab === 'all' ? 'Aucune commande' : `Aucune commande ${STATUS_CONFIG[activeTab]?.label?.toLowerCase() || ''}`}</h3>
            <p className="text-sm text-muted-foreground">{hasActiveFilters ? 'Aucune commande ne correspond à vos filtres' : activeTab === 'all' ? 'Les nouvelles commandes apparaîtront ici' : `Aucune commande avec le statut "${STATUS_CONFIG[activeTab]?.label || ''}"`}</p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={clearFilters}>
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
              const deliveryInfo = DELIVERY_STATUS_CONFIG[order.deliveryStatus] || DELIVERY_STATUS_CONFIG.pickup;
              const isReservation = !!order.pickupTime;
              const isVerified = !!order.verifiedAt;
              return (
                <motion.div key={order.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
                  <Card className={`${isVerified ? 'border-emerald-300 bg-emerald-50/20' : 'border-emerald-100'} overflow-hidden cursor-pointer hover:border-emerald-300 transition-colors active:scale-[0.99] duration-150`} onClick={() => handleOrderClick(order.id)}>
                    <CardContent className="p-4 space-y-2.5">
                      {/* Top row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-mono text-muted-foreground flex-shrink-0">#{order.id.slice(0, 8)}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${isReservation ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                            {isReservation ? 'Réservation' : 'Commande'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isVerified && (
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 border-0">
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
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-emerald-700">{order.user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{order.user.name}</p>
                          {order.user.phone && <p className="text-xs text-muted-foreground">{order.user.phone}</p>}
                        </div>
                      </div>

                      {/* Medication info */}
                      <div className="flex items-start gap-2">
                        <Pill className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{order.medication.commercialName || order.medication.name}</p>
                          {order.medication.name !== order.medication.commercialName && (
                            <p className="text-xs text-muted-foreground truncate">{order.medication.name}</p>
                          )}
                        </div>
                      </div>

                      {/* Verification code */}
                      {order.verificationCode && (
                        <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${isVerified ? 'bg-emerald-100 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                          {isVerified ? (
                            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : (
                            <SearchCode className="h-4 w-4 text-amber-600 shrink-0" />
                          )}
                          <span className="text-[11px] font-medium text-muted-foreground shrink-0">Code :</span>
                          <span className="text-sm font-bold tracking-[0.25em] font-mono flex-1">{order.verificationCode}</span>
                          {isVerified ? (
                            <Badge className="bg-emerald-200 text-emerald-800 text-[9px] px-1.5 py-0 border-0 shrink-0 font-medium">
                              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />Vérifié
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-200 text-amber-800 text-[9px] px-1.5 py-0 border-0 shrink-0 font-medium">
                              <SearchCode className="h-2.5 w-2.5 mr-0.5" />Non vérifié
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Details row */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Package className="h-3 w-3" />{order.quantity}</span>
                        <span className="font-semibold text-foreground text-sm">{formatPrice(order.totalPrice)}</span>
                        {order.paymentMethod && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-200 text-muted-foreground">
                            <CreditCard className="h-2.5 w-2.5 mr-0.5" />{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                          </Badge>
                        )}
                      </div>

                      {/* Pickup time */}
                      {order.pickupTime && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                          <Clock className="h-3 w-3" />
                          <span>Récupération prévue : {order.pickupTime}</span>
                        </div>
                      )}

                      {/* Delivery status badge */}
                      {order.deliveryStatus !== 'pickup' && (
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${deliveryInfo.className}`}>
                          {order.deliveryStatus === 'delivering' && <Truck className="h-2.5 w-2.5 mr-0.5" />}
                          {deliveryInfo.label}
                        </Badge>
                      )}

                      {/* Footer */}
                      <div className="border-t border-emerald-100/80 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground pt-2">{formatRelativeTime(order.createdAt)}</span>
                        <ChevronRight className="h-4 w-4 text-emerald-400 pt-2" />
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
          <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-6">
            {loadingMore ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Chargement...</>) : (`Charger plus (${total - orders.length} restantes)`)}
          </Button>
        </div>
      )}

      {/* ── Floating Verify Button ── */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pointer-events-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button
              onClick={() => { setVerifyCode(''); setVerifyError(null); setScanMode(false); setScanError(null); setVerifyDialogOpen(true); }}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/25 text-sm font-medium"
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
        <DialogContent className="sm:max-w-md mx-auto p-0 gap-0 overflow-hidden rounded-2xl border-emerald-200">
          <DialogHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-white shrink-0">
            <DialogTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Vérifier une commande
            </DialogTitle>
            <DialogDescription className="text-emerald-200 text-xs mt-1">
              Saisissez le code du patient ou scannez le QR code
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => { cleanupScanner(); setScanMode(false); setScanError(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${!scanMode ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'}`}
              >
                <Keyboard className="h-4 w-4" />
                Saisie manuelle
              </button>
              <button
                onClick={() => { setScanError(null); startCameraScan(); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${scanMode ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'}`}
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
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-xl -translate-x-[1px] -translate-y-[1px]" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-xl translate-x-[1px] -translate-y-[1px]" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-xl -translate-x-[1px] translate-y-[1px]" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-xl translate-x-[1px] translate-y-[1px]" />
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
                className="h-12 text-center text-2xl font-mono tracking-[0.4em] font-bold border-emerald-200 focus:border-emerald-400"
                maxLength={6}
                disabled={verifying}
                autoFocus={!scanMode}
              />
              <Button
                onClick={() => handleVerify(verifyCode)}
                disabled={verifyCode.length !== 6 || verifying}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-40"
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
