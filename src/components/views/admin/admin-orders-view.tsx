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
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  confirmed: {
    label: 'Confirmée',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  ready: {
    label: 'Prête',
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
          icon={<ClipboardList className="h-5 w-5 text-violet-600" />}
        />
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Erreur de chargement</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-violet-200 text-violet-700 hover:bg-violet-50"
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 pb-28">
      {/* ── Header ── */}
      <ViewHeader
        title="Gestion des commandes"
        icon={<ClipboardList className="h-5 w-5 text-violet-600" />}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700">
              {total}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-violet-600"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      {/* ── Search + Date Filters ── */}
      <div className="space-y-2 mb-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par patient, pharmacie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm border-violet-200 focus:border-violet-400"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className={`h-10 w-10 shrink-0 ${
              showFilters
                ? 'border-violet-300 bg-violet-50 text-violet-700'
                : 'border-violet-200'
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
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Depuis</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9 text-xs border-violet-200"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    Jusqu&apos;au
                  </Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9 text-xs border-violet-200"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs text-muted-foreground"
                  onClick={clearFilters}
                >
                  <X className="h-3 w-3 mr-1" />
                  Effacer
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const count = statusCounts[tab.key] || 0;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                isActive
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-violet-100 text-violet-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Stats summary ── */}
      <Card className="border-violet-100 mb-4">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
            {Object.entries(STATUS_CONFIG)
              .filter(([key]) => key !== 'picked_up')
              .map(([key, cfg]) => {
                const stat = orderStats[key];
                return (
                  <div key={key} className="text-center space-y-0.5">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {cfg.label}
                    </p>
                    <p className="text-sm sm:text-base font-bold text-foreground">
                      {stat?.count || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {stat?.total ? formatPrice(stat.total) : '0 FCFA'}
                    </p>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* ── Orders list ── */}
      {orders.length === 0 ? (
        <Card className="border-violet-100">
          <CardContent className="p-8 text-center">
            <Inbox className="h-10 w-10 text-violet-300 mx-auto mb-3" />
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
                    className="border-violet-100 overflow-hidden cursor-pointer hover:border-violet-300 transition-colors active:scale-[0.99] duration-150"
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
                        <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-violet-700">
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
                        <Pill className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-sm truncate">
                            {order.medication.commercialName || order.medication.name}
                          </p>
                          {order.medication.name !== order.medication.commercialName && (
                            <p className="text-xs text-muted-foreground truncate">
                              {order.medication.name}
                            </p>
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
                          Qté: {order.quantity}
                        </span>
                        <span className="font-semibold text-foreground text-sm">
                          {formatPrice(order.totalPrice)}
                        </span>
                        {order.paymentMethod && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-gray-200 text-muted-foreground"
                          >
                            <CreditCard className="h-2.5 w-2.5 mr-0.5" />
                            {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                          </Badge>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="border-t border-violet-100/80 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground pt-2">
                          {formatRelativeTime(order.createdAt)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-violet-400 pt-2" />
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
        theme="violet"
      />

      {/* ── Order Detail Dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        {selectedOrder && (
          <DialogContent className="sm:max-w-lg mx-auto p-0 gap-0 overflow-hidden rounded-2xl border-violet-200 max-h-[90dvh] flex flex-col">
            {/* Dialog header */}
            <DialogHeader className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 text-white shrink-0">
              <DialogTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Commande #{selectedOrder.id.slice(0, 8)}
              </DialogTitle>
              <DialogDescription className="text-violet-200 text-xs mt-1">
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
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
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
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
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
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
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
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Quantité</p>
                      <p className="text-sm font-semibold flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-violet-500" />
                        {selectedOrder.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Total</p>
                      <p className="text-sm font-bold text-violet-700">
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
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-[11px] text-muted-foreground">
                        Heure de récupération
                      </p>
                      <p className="text-sm font-medium flex items-center gap-1 text-violet-700">
                        <Clock className="h-3.5 w-3.5" />
                        {selectedOrder.pickupTime}
                      </p>
                    </div>
                  )}

                  {selectedOrder.note && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
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
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-amber-50 border border-amber-200'
                    }`}
                  >
                    <span className="text-lg font-bold tracking-[0.3em] font-mono">
                      {selectedOrder.verificationCode}
                    </span>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 border-0 ${
                        selectedOrder.verifiedAt
                          ? 'bg-emerald-200 text-emerald-800'
                          : 'bg-amber-200 text-amber-800'
                      }`}
                    >
                      {selectedOrder.verifiedAt ? 'Vérifié' : 'Non vérifié'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Dialog footer - status actions */}
            <DialogFooter className="px-5 py-4 border-t border-violet-100 shrink-0 space-y-3">
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
