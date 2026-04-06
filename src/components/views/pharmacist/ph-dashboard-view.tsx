'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { PharmacistPageHeader } from '@/components/views/pharmacist/ph-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  Star,
  Bell,
  Plus,
  ClipboardList,
  User,
  ArrowRight,
  RefreshCw,
  Clock,
  Download,
  BarChart3,
  CalendarClock,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DashboardStats {
  pendingOrdersCount: number;
  todayOrdersCount: number;
  monthlyRevenue: number;
  todayRevenue: number;
  lowStockCount: number;
  totalMedicationsCount: number;
  unreadNotificationsCount: number;
}

interface RecentOrder {
  id: string;
  status: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  user: { name: string; phone: string };
  medication: { name: string; commercialName: string; form: string };
}

interface PharmacyProfile {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
}

interface LowStockItem {
  id: string;
  quantity: number;
  price: number;
  medication: {
    name: string;
    commercialName: string;
    form: string;
  };
}

interface ExpirationAlert {
  id: string;
  quantity: number;
  expirationDate: string;
  medication: {
    name: string;
    commercialName: string;
    form: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + ' FCFA';
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "À l'instant";
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffHour < 24) return `il y a ${diffHour}h`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDay = new Date(date);
  targetDay.setHours(0, 0, 0, 0);
  const dayDiff = Math.floor((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) return "aujourd'hui";
  if (dayDiff === 1) return 'hier';
  if (dayDiff < 7) return `il y a ${dayDiff}j`;

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'En attente',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  confirmed: {
    label: 'Confirmée',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  ready: {
    label: 'Prête',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  picked_up: {
    label: 'Récupérée',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
  cancelled: {
    label: 'Annulée',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
};

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PharmacistDashboardView() {
  const { currentUser, setCurrentView, selectOrder, selectStock } = useAppStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [pharmacy, setPharmacy] = useState<PharmacyProfile | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [expirationAlerts, setExpirationAlerts] = useState<ExpirationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTodayRevenue, setShowTodayRevenue] = useState(false);

  /* ---- Fetch all data in parallel ---- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, profileRes, stocksRes, allStocksRes] = await Promise.all([
        fetch('/api/pharmacist/dashboard'),
        fetch('/api/pharmacist/profile'),
        fetch('/api/pharmacist/stocks?status=low_stock&sort=quantity_desc'),
        fetch('/api/pharmacist/stocks?limit=100'),
      ]);

      if (!dashboardRes.ok) throw new Error('Erreur lors du chargement du tableau de bord');
      if (!profileRes.ok) throw new Error('Erreur lors du chargement du profil');
      if (!stocksRes.ok) throw new Error('Erreur lors du chargement des alertes stock');
      if (!allStocksRes.ok) throw new Error('Erreur lors du chargement des stocks');

      const dashboard = await dashboardRes.json();
      const profile = await profileRes.json();
      const stocksData = await stocksRes.json();
      const allStocksData = await allStocksRes.json();
      const stocks: LowStockItem[] = Array.isArray(stocksData.stocks) ? stocksData.stocks : (Array.isArray(stocksData) ? stocksData : []);
      const allStocks: (LowStockItem & { expirationDate: string | null })[] = Array.isArray(allStocksData.stocks) ? allStocksData.stocks : (Array.isArray(allStocksData) ? allStocksData : []);

      setStats({
        pendingOrdersCount: dashboard.pendingOrdersCount ?? 0,
        todayOrdersCount: dashboard.todayOrdersCount ?? 0,
        monthlyRevenue: dashboard.monthlyRevenue ?? 0,
        todayRevenue: dashboard.todayRevenue ?? 0,
        lowStockCount: dashboard.lowStockCount ?? 0,
        totalMedicationsCount: dashboard.totalMedicationsCount ?? 0,
        unreadNotificationsCount: dashboard.unreadNotificationsCount ?? 0,
      });
      setRecentOrders(dashboard.recentOrders ?? []);
      setPharmacy({
        id: profile.id,
        name: profile.name,
        rating: profile.rating ?? 0,
        reviewCount: profile.reviewCount ?? 0,
      });
      setLowStockItems(stocks.slice(0, 5));

      // Compute expiration alerts: expired or expiring within 30 days
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiring = allStocks
        .filter((s) => s.expirationDate && new Date(s.expirationDate) <= thirtyDays)
        .sort((a, b) => new Date(a.expirationDate!).getTime() - new Date(b.expirationDate!).getTime())
        .slice(0, 5) as ExpirationAlert[];
      setExpirationAlerts(expiring);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- Derived values ---- */
  const firstName = currentUser?.name?.split(' ')[0] ?? 'Pharmacien';

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="w-full px-4 sm:px-6 pb-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* ─── HEADER ─── */}
        <motion.div variants={itemVariants}>
          <PharmacistPageHeader
            title="Tableau de bord"
            description={
              pharmacy
                ? `${pharmacy.name} : suivez vos commandes, vos alertes de stock et les performances de votre pharmacie depuis cette vue d’ensemble.`
                : `Bonjour, ${firstName}. Suivez vos commandes, vos alertes de stock et les performances de votre pharmacie depuis cette vue d’ensemble.`
            }
            icon={<BarChart3 className="h-5 w-5" />}
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('ph-reports')}
                className="h-10 rounded-2xl bg-white/12 px-4 text-white hover:bg-white/18"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Export
              </Button>
            }
          />
        </motion.div>

        {/* ─── LOADING SKELETON ─── */}
        {loading && (
          <motion.div variants={itemVariants} className="space-y-5">
            {/* Stats skeletons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-amber-100">
                  <CardContent className="p-3 sm:p-4">
                    <Skeleton className="h-8 w-8 rounded-full mb-2" />
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-5 w-14" />
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Actions skeletons */}
            <Skeleton className="h-16 w-full rounded-xl" />
            {/* Recent orders skeletons */}
            <Card className="border-amber-100">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
            {/* Low stock skeletons */}
            <Card className="border-amber-100">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-5 w-10 rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── ERROR STATE ─── */}
        {!loading && error && (
          <motion.div variants={itemVariants}>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex flex-col items-center gap-3 py-8">
                <AlertTriangle className="h-10 w-10 text-red-400" />
                <p className="text-sm text-red-600 text-center px-4">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  className="border-red-200 text-red-600 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── MAIN CONTENT ─── */}
        {!loading && !error && stats && (
          <>
            {/* ── STATS CARDS ── */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              <StatCard
                icon={<ShoppingCart className="h-4 w-4" />}
                label="Commandes en attente"
                value={String(stats.pendingOrdersCount)}
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
              />
              {/* Revenue card with toggle */}
              <Card className="border-amber-100">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100">
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                    </div>
                    <button
                      onClick={() => setShowTodayRevenue(!showTodayRevenue)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                        showTodayRevenue
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {showTodayRevenue ? "Aujourd'hui" : 'Ce mois'}
                    </button>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                    {showTodayRevenue ? 'CA journalier' : 'CA du mois'}
                  </p>
                  <p className="text-base sm:text-lg font-bold mt-0.5 leading-tight truncate">
                    {showTodayRevenue ? formatFCFA(stats.todayRevenue) : formatFCFA(stats.monthlyRevenue)}
                  </p>
                </CardContent>
              </Card>
              <StatCard
                icon={<Package className="h-4 w-4" />}
                label="Médicaments en stock"
                value={String(stats.totalMedicationsCount)}
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
              />
              <StatCard
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Stock faible"
                value={String(stats.lowStockCount)}
                iconBg="bg-red-100"
                iconColor="text-red-600"
              />
              <StatCard
                icon={<Star className="h-4 w-4" />}
                label="Note moyenne"
                value={pharmacy ? `${pharmacy.rating.toFixed(1)} ★` : '—'}
                iconBg="bg-yellow-100"
                iconColor="text-yellow-600"
              />
              <StatCard
                icon={<Bell className="h-4 w-4" />}
                label="Alertes non lues"
                value={String(stats.unreadNotificationsCount)}
                iconBg="bg-red-100"
                iconColor="text-red-600"
              />
            </motion.div>

            {/* ── ACTIONS RAPIDES ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-amber-100">
                <CardContent className="p-3 sm:p-4">
                  <div className="grid grid-cols-4 gap-2">
                    <ActionButton
                      icon={<Plus className="h-5 w-5" />}
                      label="Nouvelle entrée"
                      onClick={() => setCurrentView('ph-stock-add')}
                    />
                    <ActionButton
                      icon={<ClipboardList className="h-5 w-5" />}
                      label="Commandes"
                      onClick={() => setCurrentView('ph-orders')}
                    />
                    <ActionButton
                      icon={<BarChart3 className="h-5 w-5" />}
                      label="Rapports"
                      onClick={() => setCurrentView('ph-reports')}
                    />
                    <ActionButton
                      icon={<Bell className="h-5 w-5" />}
                      label="Alertes"
                      onClick={() => setCurrentView('ph-notifications')}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── COMMANDES RÉCENTES ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-amber-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Commandes récentes
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-7 px-2"
                    onClick={() => setCurrentView('ph-orders')}
                  >
                    Voir tout
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {recentOrders.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                      <ShoppingCart className="h-8 w-8 opacity-40" />
                      <p className="text-xs">Aucune commande récente</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {recentOrders.map((order) => {
                        const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                        return (
                          <button
                            key={order.id}
                            onClick={() => {
                              selectOrder(order.id);
                              setCurrentView('ph-order-detail');
                            }}
                            className="flex items-center justify-between w-full text-left py-2.5 px-1 rounded-lg hover:bg-amber-50 transition-colors"
                          >
                            <div className="min-w-0 flex-1 mr-3">
                              <p className="text-sm font-medium truncate">
                                {order.items.length === 1
                                  ? (order.items[0].medication.commercialName || order.items[0].medication.name)
                                  : `${order.items.length} médicaments`
                                }
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {order.user.name} · {formatRelativeTime(order.createdAt)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[11px] shrink-0 ${statusCfg.className}`}
                            >
                              {statusCfg.label}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ── ALERTES EXPIRATION ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-amber-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4 text-amber-500" />
                    Alertes expiration
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-7 px-2"
                    onClick={() => {
                      setCurrentView('ph-stock-list');
                    }}
                  >
                    Voir tout
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {expirationAlerts.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                      <CalendarClock className="h-8 w-8 opacity-40" />
                      <p className="text-xs">Aucune expiration prochaine</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {expirationAlerts.map((alert) => {
                        const expDate = new Date(alert.expirationDate);
                        const now = new Date();
                        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        const isExpired = diffDays < 0;
                        return (
                          <button
                            key={alert.id}
                            onClick={() => {
                              selectStock(alert.id);
                              setCurrentView('ph-stock-detail');
                            }}
                            className="flex items-center justify-between w-full text-left py-2.5 px-1 rounded-lg hover:bg-amber-50 transition-colors"
                          >
                            <div className="min-w-0 mr-3">
                              <p className="text-sm font-medium truncate">
                                {alert.medication.commercialName || alert.medication.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {expDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground">Qté: {alert.quantity}</span>
                              <Badge
                                variant="outline"
                                className={`text-[11px] ${
                                  isExpired
                                    ? 'bg-red-100 text-red-700 border-red-200'
                                    : 'bg-amber-100 text-amber-700 border-amber-200'
                                }`}
                              >
                                {isExpired ? `Périmé ${Math.abs(diffDays)}j` : `${diffDays}j`}
                              </Badge>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ── ALERTES STOCKS ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-amber-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Alertes stocks
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-7 px-2"
                    onClick={() => setCurrentView('ph-stock-list')}
                  >
                    Réappro.
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {lowStockItems.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                      <Package className="h-8 w-8 opacity-40" />
                      <p className="text-xs">Tous les stocks sont à niveau</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {lowStockItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-2.5 px-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <p className="text-sm font-medium truncate mr-3">
                            {item.medication.commercialName || item.medication.name}
                          </p>
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-700 border-red-200 text-[11px] shrink-0"
                          >
                            {item.quantity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
  icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="border-amber-100">
      <CardContent className="p-3 sm:p-4">
        <div className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${iconBg} mb-2`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">{label}</p>
        <p className="text-base sm:text-lg font-bold mt-0.5 leading-tight truncate">{value}</p>
      </CardContent>
    </Card>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 py-2 rounded-xl hover:bg-amber-50 active:bg-amber-100 transition-colors"
    >
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-100 text-amber-700">
        {icon}
      </div>
      <span className="text-[11px] font-medium text-muted-foreground leading-tight text-center">
        {label}
      </span>
    </button>
  );
}
