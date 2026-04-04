'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Building2,
  Pill,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Clock,
  BarChart3,
  Trophy,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AdminDashboardData {
  totalUsers: number;
  usersByRole: { patient: number; pharmacist: number; admin: number };
  totalPharmacies: number;
  guardPharmaciesCount: number;
  totalMedications: number;
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  totalRevenue: number;
  newUsersThisMonth: number;
  newOrdersToday: number;
  avgOrderValue: number;
  topPharmacies: TopPharmacy[];
  topMedications: TopMedication[];
  recentOrders: RecentAdminOrder[];
  monthlyRevenueTrend: MonthlyRevenue[];
}

interface TopPharmacy {
  id: string;
  name: string;
  revenue: number;
  orderCount: number;
}

interface TopMedication {
  id: string;
  name: string;
  orderCount: number;
  quantitySold: number;
}

interface RecentAdminOrder {
  id: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  user: { name: string };
  pharmacy: { name: string };
  medication: { name: string; commercialName: string };
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
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
  const dayDiff = Math.floor(
    (today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24),
  );

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
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  ready: {
    label: 'Prête',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
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
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminDashboardView() {
  const { currentUser, setCurrentView, selectOrder } = useAppStore();

  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- Fetch dashboard data ---- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) throw new Error('Erreur lors du chargement du tableau de bord');

      const json = await res.json();
      // Map from nested API structure to flat view structure
      const api = json;
      setData({
        totalUsers: api.users?.total ?? 0,
        usersByRole: {
          patient: api.users?.byRole?.patients ?? 0,
          pharmacist: api.users?.byRole?.pharmacists ?? 0,
          admin: api.users?.byRole?.admins ?? 0,
        },
        totalPharmacies: api.pharmacies?.total ?? 0,
        guardPharmaciesCount: api.pharmacies?.onGuard ?? 0,
        totalMedications: api.medications?.total ?? 0,
        totalOrders: api.orders?.total ?? 0,
        ordersByStatus: api.orders?.byStatus ?? {},
        totalRevenue: api.revenue?.total ?? 0,
        newUsersThisMonth: api.users?.newThisMonth ?? 0,
        newOrdersToday: api.orders?.newToday ?? 0,
        avgOrderValue: api.orders?.averageValue ?? 0,
        topPharmacies: (api.topPharmacies ?? []).map((p: Record<string, unknown>) => ({
          id: p.pharmacyId,
          name: p.name,
          revenue: p.revenue,
          orderCount: p.orderCount ?? 0,
        })),
        topMedications: (api.topMedications ?? []).map((m: Record<string, unknown>) => ({
          id: m.medicationId,
          name: m.name,
          orderCount: m.orderCount,
          quantitySold: m.totalQuantity,
        })),
        recentOrders: api.recentOrders ?? [],
        monthlyRevenueTrend: api.revenue?.monthlyTrend ?? [],
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- Derived ---- */
  const firstName = currentUser?.name?.split(' ')[0] ?? 'Admin';
  const maxTrendRevenue = data
    ? Math.max(...data.monthlyRevenueTrend.map((m) => m.revenue), 1)
    : 1;

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 lg:pb-6 pt-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* ─── HEADER ─── */}
        <motion.div variants={itemVariants}>
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 px-5 py-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-violet-200" />
                  <p className="text-sm font-medium text-violet-100">
                    Administration
                  </p>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold mt-1">
                  Bonjour, {firstName} 👋
                </h1>
                <p className="text-sm text-violet-100 mt-1">
                  Vue d&apos;ensemble de la plateforme Pharma CI
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('admin-analytics')}
                className="text-white hover:bg-white/10 h-9 px-3"
              >
                <BarChart3 className="h-4 w-4 mr-1.5" />
                <span className="text-xs font-medium">Analyses</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ─── LOADING SKELETON ─── */}
        {loading && (
          <motion.div variants={itemVariants} className="space-y-6">
            {/* KPI skeletons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-violet-100">
                  <CardContent className="p-3 sm:p-4">
                    <Skeleton className="h-8 w-8 rounded-full mb-2" />
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-5 w-14" />
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Chart skeleton */}
            <Skeleton className="h-56 w-full rounded-xl" />
            {/* Tables skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-violet-100">
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-violet-100">
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            {/* Recent orders skeleton */}
            <Card className="border-violet-100">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
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
                <p className="text-sm text-red-600 text-center px-4">
                  {error}
                </p>
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
        {!loading && !error && data && (
          <>
            {/* ── KPI CARDS ── */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
            >
              {/* Total utilisateurs */}
              <Card className="border-violet-100">
                <CardContent className="p-3 sm:p-4">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-violet-100 mb-2">
                    <Users className="h-4 w-4 text-violet-600" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                    Total utilisateurs
                  </p>
                  <p className="text-base sm:text-lg font-bold mt-0.5 leading-tight">
                    {data.totalUsers}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {data.usersByRole.patient} patients ·{' '}
                    {data.usersByRole.pharmacist} pharmaciens
                  </p>
                </CardContent>
              </Card>

              {/* Total pharmacies */}
              <Card className="border-violet-100">
                <CardContent className="p-3 sm:p-4">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-violet-100 mb-2">
                    <Building2 className="h-4 w-4 text-violet-600" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                    Total pharmacies
                  </p>
                  <p className="text-base sm:text-lg font-bold mt-0.5 leading-tight">
                    {data.totalPharmacies}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {data.guardPharmaciesCount} en garde
                  </p>
                </CardContent>
              </Card>

              {/* Total médicaments */}
              <AdminStatCard
                icon={<Pill className="h-4 w-4" />}
                label="Total médicaments"
                value={String(data.totalMedications)}
                iconBg="bg-violet-100"
                iconColor="text-violet-600"
              />

              {/* Total commandes */}
              <Card className="border-violet-100">
                <CardContent className="p-3 sm:p-4">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-violet-100 mb-2">
                    <ShoppingCart className="h-4 w-4 text-violet-600" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                    Total commandes
                  </p>
                  <p className="text-base sm:text-lg font-bold mt-0.5 leading-tight">
                    {data.totalOrders}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <StatusMini
                      status="pending"
                      count={data.ordersByStatus.pending ?? 0}
                    />
                    <StatusMini
                      status="confirmed"
                      count={data.ordersByStatus.confirmed ?? 0}
                    />
                    <StatusMini
                      status="ready"
                      count={data.ordersByStatus.ready ?? 0}
                    />
                    <StatusMini
                      status="picked_up"
                      count={data.ordersByStatus.picked_up ?? 0}
                    />
                    <StatusMini
                      status="cancelled"
                      count={data.ordersByStatus.cancelled ?? 0}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Chiffre d'affaires */}
              <AdminStatCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Chiffre d'affaires"
                value={formatFCFA(data.totalRevenue)}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
              />

              {/* Nouveaux utilisateurs */}
              <Card className="border-violet-100">
                <CardContent className="p-3 sm:p-4">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 mb-2">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                    Nouveaux utilisateurs
                  </p>
                  <p className="text-base sm:text-lg font-bold mt-0.5 leading-tight">
                    {data.newUsersThisMonth}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    ce mois · {data.newOrdersToday} commandes/jour
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── MONTHLY REVENUE TREND ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-violet-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-violet-600" />
                    Tendances revenus mensuels
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 h-7 px-2"
                    onClick={() => setCurrentView('admin-analytics')}
                  >
                    Détails
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {data.monthlyRevenueTrend.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                      <BarChart3 className="h-8 w-8 opacity-40" />
                      <p className="text-xs">Aucune donnée disponible</p>
                    </div>
                  ) : (
                    <div className="flex items-end gap-2 sm:gap-3 h-44">
                      {data.monthlyRevenueTrend.map((item) => {
                        const heightPct =
                          maxTrendRevenue > 0
                            ? (item.revenue / maxTrendRevenue) * 100
                            : 0;
                        return (
                          <div
                            key={item.month}
                            className="flex-1 flex flex-col items-center gap-1.5"
                          >
                            <span className="text-[10px] sm:text-xs font-medium text-violet-700 leading-tight">
                              {formatFCFA(item.revenue)}
                            </span>
                            <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(heightPct, 2)}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                                className="w-full max-w-[48px] rounded-t-md bg-gradient-to-t from-violet-600 to-violet-400"
                                title={`${item.month} : ${formatFCFA(item.revenue)}`}
                              />
                            </div>
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {item.month}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ── TOP PHARMACIES & TOP MEDICATIONS ── */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Top 5 pharmacies */}
              <Card className="border-violet-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Top 5 pharmacies
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 h-7 px-2"
                    onClick={() => setCurrentView('admin-pharmacies')}
                  >
                    Voir tout
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {data.topPharmacies.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                      <Building2 className="h-8 w-8 opacity-40" />
                      <p className="text-xs">Aucune pharmacie enregistrée</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {data.topPharmacies.map((pharma, idx) => (
                        <div
                          key={pharma.id}
                          className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-violet-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {pharma.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {pharma.orderCount} commandes
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-violet-700 shrink-0">
                            {formatFCFA(pharma.revenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top 5 medications */}
              <Card className="border-violet-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <Pill className="h-4 w-4 text-violet-600" />
                    Top 5 médicaments
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 h-7 px-2"
                    onClick={() => setCurrentView('admin-medications')}
                  >
                    Voir tout
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {data.topMedications.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                      <Pill className="h-8 w-8 opacity-40" />
                      <p className="text-xs">Aucun médicament enregistré</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {data.topMedications.map((med, idx) => (
                        <div
                          key={med.id}
                          className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-violet-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {med.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {med.quantitySold} unités vendues
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-violet-700 shrink-0">
                            {med.orderCount} cmd
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ── COMMANDES RÉCENTES ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-violet-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-violet-600" />
                    Commandes récentes
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 h-7 px-2"
                    onClick={() => setCurrentView('admin-orders')}
                  >
                    Voir tout
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {data.recentOrders.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                      <ShoppingCart className="h-8 w-8 opacity-40" />
                      <p className="text-xs">Aucune commande récente</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-[500px] overflow-y-auto">
                      {data.recentOrders.map((order) => {
                        const statusCfg =
                          STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                        return (
                          <button
                            key={order.id}
                            onClick={() => {
                              selectOrder(order.id);
                              setCurrentView('admin-orders');
                            }}
                            className="flex items-center justify-between w-full text-left py-2.5 px-2 rounded-lg hover:bg-violet-50 transition-colors"
                          >
                            <div className="min-w-0 flex-1 mr-3">
                              <p className="text-sm font-medium truncate">
                                {order.medication.commercialName ||
                                  order.medication.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {order.pharmacy.name} · {order.user.name} ·{' '}
                                {formatRelativeTime(order.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-semibold text-violet-700 hidden sm:inline">
                                {formatFCFA(order.totalPrice)}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[11px] ${statusCfg.className}`}
                              >
                                {statusCfg.label}
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

            {/* ── QUICK STATS FOOTER ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-violet-100">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Panier moyen
                      </p>
                      <p className="text-sm font-bold text-violet-700 mt-0.5">
                        {formatFCFA(data.avgOrderValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Commandes/jour
                      </p>
                      <p className="text-sm font-bold text-violet-700 mt-0.5">
                        {data.newOrdersToday}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Pharmacies en garde
                      </p>
                      <p className="text-sm font-bold text-violet-700 mt-0.5">
                        {data.guardPharmaciesCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Admins
                      </p>
                      <p className="text-sm font-bold text-violet-700 mt-0.5">
                        {data.usersByRole.admin}
                      </p>
                    </div>
                  </div>
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

function AdminStatCard({
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
    <Card className="border-violet-100">
      <CardContent className="p-3 sm:p-4">
        <div
          className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${iconBg} mb-2`}
        >
          <span className={iconColor}>{icon}</span>
        </div>
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
          {label}
        </p>
        <p className="text-base sm:text-lg font-bold mt-0.5 leading-tight truncate">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function StatusMini({
  status,
  count,
}: {
  status: string;
  count: number;
}) {
  if (count === 0) return null;
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span
      className={`inline-block text-[9px] leading-tight px-1.5 py-0.5 rounded font-medium ${cfg.className}`}
    >
      {cfg.label.split(' ')[0]} {count}
    </span>
  );
}
