'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
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
  Search,
  Calendar,
  X,
  XCircle,
  Loader2,
  Building2,
  User,
  Phone,
  MapPin,
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
  DialogFooter,
} from '@/components/ui/dialog';
import { ViewHeader } from '@/components/view-header';
import { AdminPageHeader } from '@/components/views/admin/admin-page-header';
import { PAYMENT_LABELS } from '@/lib/navigation';
import { toast } from 'sonner';
import { SmartPagination } from '@/components/ui/smart-pagination';

// ── Types ──────────────────────────────────────────────────────────────────

interface OrderData {
  id: string;
  status: string;
  deliveryStatus?: string;
  quantity: number;
  totalPrice: number;
  note?: string | null;
  paymentMethod?: string | null;
  pickupTime?: string | null;
  verificationCode?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    phone: string | null;
    email?: string;
    city?: string;
  };
  pharmacy: {
    id: string;
    name: string;
    city: string;
    address?: string;
  };
  medication: {
    id: string;
    name: string;
    commercialName: string;
    form?: string;
    category?: string;
  };
}

interface OrderStats {
  count: number;
  total: number;
}

type FilterTab = 'all' | 'pending' | 'confirmed' | 'ready' | 'picked_up' | 'cancelled';

// ── Config ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'En attente',
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/50',
  },
  confirmed: {
    label: 'Confirmée',
    className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/50',
  },
  ready: {
    label: 'Prête',
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
  { key: 'ready', label: 'Prêtes' },
  { key: 'picked_up', label: 'Récupérées' },
  { key: 'cancelled', label: 'Annulées' },
];

const STATUS_TRANSITIONS: Record<string, { label: string; value: string }[]> = {
  pending: [
    { label: 'Confirmée', value: 'confirmed' },
    { label: 'Annulée', value: 'cancelled' },
  ],
  confirmed: [
    { label: 'Prête', value: 'ready' },
    { label: 'Annulée', value: 'cancelled' },
  ],
  ready: [
    { label: 'Récupérée', value: 'picked_up' },
    { label: 'Annulée', value: 'cancelled' },
  ],
  picked_up: [],
  cancelled: [
    { label: 'En attente', value: 'pending' },
  ],
};

const PAGE_SIZE = 20;

// ── Helpers ────────────────────────────────────────────────────────────────

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

function formatDateFull(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export function AdminOrdersView() {
  // ── State ──
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Order stats from API
  const [orderStats, setOrderStats] = useState<Record<string, OrderStats>>({});

  // Detail dialog
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // ── Fetch ──
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((currentPage - 1) * PAGE_SIZE),
      });

      if (activeTab !== 'all') {
        params.set('status', activeTab);
      }
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }
      if (dateFrom) {
        params.set('dateFrom', dateFrom);
      }
      if (dateTo) {
        params.set('dateTo', dateTo);
      }

      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();

      setOrders(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total || 0);
      setOrderStats(data.orderStats || {});
    } catch {
      setError('Impossible de charger les commandes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, currentPage, searchQuery, dateFrom, dateTo]);

  // Initial load and when filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset to page 1 when filters change (except page)
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, dateFrom, dateTo]);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    fetchOrders();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  // ── Pagination helpers ──
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // ── Detail dialog ──
  const handleOrderClick = (order: OrderData) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur de mise à jour');
      }

      const updatedOrder = await res.json();

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: updatedOrder.status } : o
        )
      );

      // Update selected order if in dialog
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: updatedOrder.status } : prev
        );
      }

      toast.success(
        `Commande mise à jour : ${STATUS_CONFIG[newStatus]?.label || newStatus}`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur serveur';
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  // ── Stats for tabs ──
  const statusCounts: Record<string, number> = { all: total };
  for (const [key, val] of Object.entries(orderStats)) {
    statusCounts[key] = val.count;
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-20 flex-shrink-0 rounded-full" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <ViewHeader
          title="Gestion des commandes"
          icon={<ClipboardList className="h-5 w-5 text-amber-600" />}
        />
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Erreur de chargement</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-950/30"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 pb-28 space-y-4">
      <AdminPageHeader
        title="Gestion des commandes"
        description="Suivez les commandes de la plateforme, les statuts en cours et les recherches multi-critères depuis une même vue."
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

      <div className="rounded-[26px] border border-amber-100 bg-white/90 p-4 shadow-sm shadow-amber-100/40 dark:border-amber-900/50 dark:bg-gray-900/90 dark:shadow-none sm:p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl bg-amber-50/70 px-3 py-3 dark:bg-amber-950/30">
            <p className="text-[11px] uppercase tracking-[0.16em] text-amber-700/80 dark:text-amber-300/80">Total</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{total}</p>
          </div>
          <div className="rounded-2xl bg-green-50/70 px-3 py-3 dark:bg-green-950/30">
            <p className="text-[11px] uppercase tracking-[0.16em] text-green-700/80 dark:text-green-300/80">Statut actif</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{FILTER_TABS.find((tab) => tab.key === activeTab)?.label || 'Toutes'}</p>
          </div>
          <div className="rounded-2xl bg-amber-50/70 px-3 py-3 dark:bg-amber-950/30">
            <p className="text-[11px] uppercase tracking-[0.16em] text-amber-700/80 dark:text-amber-300/80">Recherche</p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">{searchQuery.trim() || 'Toutes les commandes'}</p>
          </div>
          <div className="rounded-2xl bg-green-50/70 px-3 py-3 dark:bg-green-950/30">
            <p className="text-[11px] uppercase tracking-[0.16em] text-green-700/80 dark:text-green-300/80">Période</p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">{dateFrom || dateTo ? `${dateFrom || '...'} → ${dateTo || '...'}` : 'Aucun filtre date'}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par patient, pharmacie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-2xl border-amber-200 bg-amber-50/40 pl-9 text-sm focus:border-green-400 dark:border-amber-900/50 dark:bg-amber-950/20"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className={`h-11 w-11 shrink-0 rounded-2xl ${
                showFilters
                  ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300'
                  : 'border-amber-200 text-amber-700 dark:border-amber-900/50 dark:text-amber-300'
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid items-end gap-2 rounded-2xl border border-amber-100 bg-amber-50/40 p-3 dark:border-amber-900/50 dark:bg-amber-950/20 sm:grid-cols-[1fr_1fr_auto]">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Depuis</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-10 rounded-xl border-amber-200 bg-white text-xs focus:border-green-400 dark:border-amber-900/50 dark:bg-gray-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Jusqu&apos;au</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-10 rounded-xl border-amber-200 bg-white text-xs focus:border-green-400 dark:border-amber-900/50 dark:bg-gray-900"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 rounded-xl text-green-700 hover:bg-green-50 hover:text-green-800"
                    onClick={clearFilters}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Effacer
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const count = statusCounts[tab.key] || 0;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50'
                }`}
              >
                {tab.label}
                <span
                  className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {Object.entries(STATUS_CONFIG)
            .filter(([key]) => key !== 'picked_up')
            .map(([key, cfg]) => {
              const stat = orderStats[key];
              return (
                <div key={key} className="rounded-2xl border border-amber-100 bg-white px-3 py-3 text-center dark:border-amber-900/50 dark:bg-gray-900">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{cfg.label}</p>
                  <p className="text-sm sm:text-base font-bold text-foreground">{stat?.count || 0}</p>
                  <p className="text-[10px] text-muted-foreground">{stat?.total ? formatPrice(stat.total) : '0 FCFA'}</p>
                </div>
              );
            })}
        </div>
      </div>

      {/* ── Orders list ── */}
      {orders.length === 0 ? (
        <Card className="border-amber-100">
          <CardContent className="p-8 text-center">
            <Inbox className="h-10 w-10 text-amber-300 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">
              {activeTab === 'all'
                ? 'Aucune commande'
                : `Aucune commande ${STATUS_CONFIG[activeTab]?.label?.toLowerCase() || ''}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'all'
                ? 'Les nouvelles commandes apparaîtront ici'
                : `Aucune commande avec le statut "${STATUS_CONFIG[activeTab]?.label || ''}"`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${currentPage}-${searchQuery}-${dateFrom}-${dateTo}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {orders.map((order, index) => {
              const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    className="cursor-pointer overflow-hidden border-amber-100 bg-white/90 shadow-sm shadow-amber-100/30 transition-colors duration-150 hover:border-amber-300 active:scale-[0.99] dark:border-amber-900/50 dark:bg-gray-900/90 dark:shadow-none dark:hover:border-amber-700/50"
                    onClick={() => handleOrderClick(order)}
                  >
                    <CardContent className="p-4 space-y-2.5">
                      {/* Top row: ID + Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
                            #{order.id.slice(0, 8)}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[11px] px-2 py-0.5 flex-shrink-0 ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {/* Patient info */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 dark:bg-amber-950/40">
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                            {order.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">
                            {order.user.name}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {order.user.phone && (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <Phone className="h-2.5 w-2.5" />
                                {order.user.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Medication + Pharmacy info */}
                      <div className="flex items-start gap-2">
                        <Pill className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          {order.items.length === 1 ? (
                            <>
                              <p className="text-sm truncate">
                                {order.items[0].medication.commercialName || order.items[0].medication.name}
                              </p>
                              {order.items[0].medication.name !== order.items[0].medication.commercialName && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {order.items[0].medication.name}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm truncate">{order.items.length} médicaments</p>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">
                              {order.pharmacy.name}
                              {order.pharmacy.city && ` — ${order.pharmacy.city}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Qté: {order.totalQuantity}
                        </span>
                        <span className="text-sm font-semibold text-green-700">
                          {formatPrice(order.totalPrice)}
                        </span>
                      </div>

                      {/* Footer */}
                      <div className="border-t border-amber-100/80 flex items-center justify-between dark:border-amber-900/50">
                        <span className="text-[11px] text-muted-foreground pt-2">
                          {formatRelativeTime(order.createdAt)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-green-500 pt-2" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Pagination ── */}
      <SmartPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        total={total}
        pageSize={PAGE_SIZE}
        theme="amber"
      />

      {/* ── Order Detail Dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        {selectedOrder && (
            <DialogContent className="sm:max-w-lg mx-auto p-0 gap-0 overflow-hidden rounded-2xl border-amber-200 dark:border-amber-900/50 dark:bg-gray-950 max-h-[90dvh] flex flex-col">
              {/* Dialog header */}
              <DialogHeader className="bg-gradient-to-r from-amber-600 to-amber-800 px-5 py-4 text-white shrink-0">
              <DialogTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Commande #{selectedOrder.id.slice(0, 8)}
              </DialogTitle>
              <DialogDescription className="text-amber-200 text-xs mt-1">
                Détails et gestion de la commande
              </DialogDescription>
            </DialogHeader>

            {/* Dialog body - scrollable */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Statut actuel
                </span>
                <Badge
                  variant="outline"
                  className={`text-[11px] px-2.5 py-0.5 ${
                    STATUS_CONFIG[selectedOrder.status]?.className || ''
                  }`}
                >
                  {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                </Badge>
              </div>

              <Separator />

              {/* Patient section */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Patient
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 dark:bg-gray-900">
                  <p className="text-sm font-semibold">{selectedOrder.user.name}</p>
                  {selectedOrder.user.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedOrder.user.phone}
                    </p>
                  )}
                  {selectedOrder.user.email && (
                    <p className="text-xs text-muted-foreground">
                      {selectedOrder.user.email}
                    </p>
                  )}
                  {selectedOrder.user.city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedOrder.user.city}
                    </p>
                  )}
                </div>
              </div>

              {/* Pharmacy section */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Pharmacie
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 dark:bg-gray-900">
                  <p className="text-sm font-semibold">{selectedOrder.pharmacy.name}</p>
                  {selectedOrder.pharmacy.address && (
                    <p className="text-xs text-muted-foreground">
                      {selectedOrder.pharmacy.address}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedOrder.pharmacy.city}
                  </p>
                </div>
              </div>

              {/* Medication section */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5" />
                  Médicament
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 dark:bg-gray-900">
                  <p className="text-sm font-semibold">
                    {selectedOrder.medication.commercialName ||
                      selectedOrder.medication.name}
                  </p>
                  {selectedOrder.medication.name !==
                    selectedOrder.medication.commercialName && (
                    <p className="text-xs text-muted-foreground">
                      {selectedOrder.medication.name}
                    </p>
                  )}
                  {selectedOrder.medication.form && (
                    <p className="text-xs text-muted-foreground">
                      Forme : {selectedOrder.medication.form}
                    </p>
                  )}
                  {selectedOrder.medication.category && (
                    <p className="text-xs text-muted-foreground">
                      Catégorie : {selectedOrder.medication.category}
                    </p>
                  )}
                </div>
              </div>

              {/* Order details */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Détails de la commande
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 dark:bg-gray-900">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Quantité</p>
                      <p className="text-sm font-semibold flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-amber-500" />
                        {selectedOrder.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Total</p>
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                        {formatPrice(selectedOrder.totalPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Paiement</p>
                      <p className="text-sm flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                        {selectedOrder.paymentMethod
                          ? PAYMENT_LABELS[selectedOrder.paymentMethod] ||
                            selectedOrder.paymentMethod
                          : 'Non spécifié'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Créée le</p>
                      <p className="text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatRelativeTime(selectedOrder.createdAt)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDateFull(selectedOrder.createdAt)}
                      </p>
                    </div>
                  </div>

                  {selectedOrder.pickupTime && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-[11px] text-muted-foreground">
                        Heure de récupération
                      </p>
                      <p className="text-sm font-medium flex items-center gap-1 text-amber-700 dark:text-amber-300">
                        <Clock className="h-3.5 w-3.5" />
                        {selectedOrder.pickupTime}
                      </p>
                    </div>
                  )}

                  {selectedOrder.note && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-[11px] text-muted-foreground">Note</p>
                      <p className="text-sm">{selectedOrder.note}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification info */}
              {selectedOrder.verificationCode && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Vérification
                  </h4>
                  <div
                    className={`rounded-lg p-3 flex items-center gap-3 ${
                      selectedOrder.verifiedAt
                        ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50'
                        : 'bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50'
                    }`}
                  >
                    <span className="text-lg font-bold tracking-[0.3em] font-mono">
                      {selectedOrder.verificationCode}
                    </span>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 border-0 ${
                        selectedOrder.verifiedAt
                          ? 'bg-amber-200 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                          : 'bg-amber-200 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                      }`}
                    >
                      {selectedOrder.verifiedAt ? 'Vérifié' : 'Non vérifié'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Dialog footer - status actions */}
            <DialogFooter className="px-5 py-4 border-t border-amber-100 dark:border-amber-900/50 shrink-0 space-y-3">
              {STATUS_TRANSITIONS[selectedOrder.status]?.length > 0 ? (
                <div className="space-y-2 w-full">
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Changer le statut :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_TRANSITIONS[selectedOrder.status].map((transition) => {
                      const targetConfig =
                        STATUS_CONFIG[transition.value] || STATUS_CONFIG.pending;
                      return (
                        <Button
                          key={transition.value}
                          variant="outline"
                          size="sm"
                          disabled={updating}
                          onClick={() =>
                            handleStatusUpdate(selectedOrder.id, transition.value)
                          }
                          className={`text-xs h-9 px-3 ${targetConfig.className} hover:opacity-80 disabled:opacity-50`}
                        >
                          {updating ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : null}
                          {transition.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center w-full">
                  Cette commande est finalisée. Aucune action possible.
                </p>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
