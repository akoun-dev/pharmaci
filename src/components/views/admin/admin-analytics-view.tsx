'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { ViewHeader } from '@/components/view-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Building2,
  MapPin,
  Users,
  FlaskConical,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  UserPlus,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RevenueByPharmacy {
  name: string;
  revenue: number;
}

interface OrdersByCity {
  city: string;
  count: number;
}

interface UserRegistration {
  month: string;
  count: number;
}

interface MedicationCategory {
  category: string;
  count: number;
}

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  newUsers: number;
  revenueByPharmacy: RevenueByPharmacy[];
  ordersByCity: OrdersByCity[];
  userRegistrationsByMonth: UserRegistration[];
  medicationCategories: MedicationCategory[];
}

type Period = 'today' | 'week' | 'month' | 'year';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + ' FCFA';
}

function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR');
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
  { key: 'year', label: 'Cette année' },
];

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

export function AdminAnalyticsView() {
  const { setCurrentView } = useAppStore();
  const [period, setPeriod] = useState<Period>('month');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`);
      if (!res.ok) throw new Error('Erreur lors du chargement des analyses');
      const json = await res.json();
      setData({
        totalRevenue: json.summary?.totalRevenue ?? 0,
        totalOrders: json.summary?.totalOrders ?? 0,
        avgOrderValue: json.summary?.averageOrderValue ?? 0,
        newUsers: json.summary?.newUsers ?? 0,
        revenueByPharmacy: json.revenueByPharmacy ?? [],
        ordersByCity: json.ordersByCity ?? [],
        userRegistrationsByMonth: json.userRegistrations ?? [],
        medicationCategories: json.categoryDistribution ?? [],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  /* ---- Derived chart values ---- */
  const maxRevenue =
    data && data.revenueByPharmacy.length > 0
      ? Math.max(...data.revenueByPharmacy.map((r) => r.revenue), 1)
      : 1;

  const maxCityOrders =
    data && data.ordersByCity.length > 0
      ? Math.max(...data.ordersByCity.map((c) => c.count), 1)
      : 1;

  const maxRegistrations =
    data && data.userRegistrationsByMonth.length > 0
      ? Math.max(...data.userRegistrationsByMonth.map((r) => r.count), 1)
      : 1;

  const totalMedications =
    data?.medicationCategories.reduce((sum, c) => sum + c.count, 0) ?? 0;

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* ─── HEADER ─── */}
        <motion.div variants={itemVariants}>
          <ViewHeader
            title="Analyses détaillées"
            icon={<BarChart3 className="h-5 w-5 text-violet-600" />}
            back
          />
        </motion.div>

        {/* ─── PERIOD SELECTOR ─── */}
        <motion.div variants={itemVariants}>
          <div className="flex gap-1.5 p-1 bg-violet-50 rounded-xl">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`flex-1 text-xs sm:text-sm font-medium py-2 px-2 rounded-lg transition-all duration-200 ${
                  period === p.key
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-violet-600 hover:bg-violet-100/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ─── LOADING SKELETON ─── */}
        {loading && (
          <motion.div variants={itemVariants} className="space-y-5">
            {/* Metrics skeleton */}
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-violet-100">
                  <CardContent className="p-4">
                    <Skeleton className="h-8 w-8 rounded-full mb-2" />
                    <Skeleton className="h-3 w-24 mb-1" />
                    <Skeleton className="h-6 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Revenue chart skeleton */}
            <Card className="border-violet-100">
              <CardHeader className="pb-2 px-4 pt-4">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-28 shrink-0" />
                    <Skeleton className="h-5 flex-1 rounded-full" />
                    <Skeleton className="h-4 w-16 shrink-0" />
                  </div>
                ))}
              </CardContent>
            </Card>
            {/* City chart skeleton */}
            <Card className="border-violet-100">
              <CardHeader className="pb-2 px-4 pt-4">
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-end gap-2 h-40">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="flex-1 bg-violet-200/40 rounded-t-md"
                      style={{ height: `${30 + Math.random() * 70}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* User registrations skeleton */}
            <Card className="border-violet-100">
              <CardHeader className="pb-2 px-4 pt-4">
                <Skeleton className="h-5 w-44" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-end gap-2 h-32">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="flex-1 bg-violet-200/40 rounded-t-md"
                      style={{ height: `${20 + Math.random() * 80}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Categories skeleton */}
            <Card className="border-violet-100">
              <CardHeader className="pb-2 px-4 pt-4">
                <Skeleton className="h-5 w-52" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <Skeleton className="h-4 w-64 rounded-full" />
                <div className="flex flex-wrap gap-3 mt-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Skeleton className="h-3 w-3 rounded-sm" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
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
                  onClick={() => fetchAnalytics(period)}
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
            {/* ── TOP METRICS ── */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 gap-3"
            >
              {/* Revenue */}
              <Card className="border-violet-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-violet-100 mb-2">
                    <DollarSign className="h-4 w-4 text-violet-600" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    Chiffre d&apos;affaires
                  </p>
                  <p className="text-lg sm:text-xl font-bold mt-0.5 text-violet-700 truncate">
                    {formatFCFA(data.totalRevenue)}
                  </p>
                </CardContent>
              </Card>

              {/* Orders */}
              <Card className="border-violet-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 mb-2">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    Total commandes
                  </p>
                  <p className="text-lg sm:text-xl font-bold mt-0.5">
                    {formatNumber(data.totalOrders)}
                  </p>
                </CardContent>
              </Card>

              {/* Average order */}
              <Card className="border-violet-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-100 mb-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    Panier moyen
                  </p>
                  <p className="text-lg sm:text-xl font-bold mt-0.5">
                    {formatFCFA(data.avgOrderValue)}
                  </p>
                </CardContent>
              </Card>

              {/* New users */}
              <Card className="border-violet-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 mb-2">
                    <UserPlus className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    Nouveaux utilisateurs
                  </p>
                  <p className="text-lg sm:text-xl font-bold mt-0.5">
                    {data.newUsers}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── REVENUE BY PHARMACY (Horizontal Bar Chart) ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-violet-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-violet-600" />
                    CA par pharmacie
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-[11px] border-violet-200 text-violet-700"
                  >
                    {data.revenueByPharmacy.length} pharmacies
                  </Badge>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {data.revenueByPharmacy.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                      <Building2 className="h-8 w-8 opacity-40" />
                      <p className="text-xs">Aucune donnée disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-96 overflow-y-auto">
                      {data.revenueByPharmacy.map((item, i) => {
                        const pct =
                          maxRevenue > 0
                            ? (item.revenue / maxRevenue) * 100
                            : 0;
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-3 group"
                          >
                            {/* Pharmacy name */}
                            <div className="w-28 sm:w-36 shrink-0 min-w-0">
                              <p className="text-xs sm:text-sm font-medium truncate text-foreground">
                                {item.name}
                              </p>
                            </div>
                            {/* Bar */}
                            <div className="flex-1 h-6 bg-violet-50 rounded-full overflow-hidden relative">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-700 ease-out relative group-hover:from-violet-600 group-hover:to-violet-500"
                                style={{ width: `${Math.max(pct, 2)}%` }}
                              >
                                {/* Value on hover */}
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {formatFCFA(item.revenue)}
                                </div>
                              </div>
                            </div>
                            {/* Value */}
                            <span className="text-xs font-semibold text-violet-700 shrink-0 w-20 sm:w-24 text-right">
                              {formatFCFA(item.revenue)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ── ORDERS BY CITY (Bar Chart) ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-violet-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-violet-600" />
                    Commandes par ville
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-[11px] border-violet-200 text-violet-700"
                  >
                    {PERIODS.find((p) => p.key === period)?.label}
                  </Badge>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {data.ordersByCity.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                      <MapPin className="h-8 w-8 opacity-40" />
                      <p className="text-xs">Aucune donnée disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Y-axis labels + bars */}
                      <div className="flex gap-2">
                        {/* Y-axis labels */}
                        <div className="flex flex-col justify-between text-[10px] text-muted-foreground w-10 shrink-0 py-1">
                          <span>{maxCityOrders}</span>
                          <span>{Math.round(maxCityOrders / 2)}</span>
                          <span>0</span>
                        </div>
                        {/* Chart area */}
                        <div className="flex-1 relative">
                          {/* Horizontal grid lines */}
                          <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
                            <div className="border-t border-dashed border-gray-100" />
                            <div className="border-t border-dashed border-gray-100" />
                            <div className="border-t border-gray-100" />
                          </div>
                          {/* Bars */}
                          <div className="flex items-end gap-[3px] sm:gap-1.5 h-40 relative z-10 pt-1">
                            {data.ordersByCity.map((item, i) => {
                              const heightPct =
                                maxCityOrders > 0
                                  ? (item.count / maxCityOrders) * 100
                                  : 0;
                              return (
                                <div
                                  key={i}
                                  className="flex-1 flex flex-col items-center gap-1"
                                >
                                  <span className="text-[9px] text-muted-foreground font-medium truncate max-w-full hidden sm:block">
                                    {item.count > 0 ? formatNumber(item.count) : ''}
                                  </span>
                                  <div
                                    className="w-full rounded-t-md bg-gradient-to-t from-violet-500 to-violet-400 transition-all duration-500 ease-out min-h-[2px] relative group cursor-pointer hover:from-violet-600 hover:to-violet-500"
                                    style={{
                                      height: `${Math.max(heightPct, 2)}%`,
                                    }}
                                  >
                                    {/* Tooltip */}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                      {item.city} : {formatNumber(item.count)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* X-axis labels */}
                          <div className="flex gap-[3px] sm:gap-1.5 mt-1.5">
                            {data.ordersByCity.map((item, i) => (
                              <div
                                key={i}
                                className="flex-1 text-center"
                              >
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight block">
                                  {item.city}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ── USER REGISTRATIONS OVER TIME (Bar Chart) ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-violet-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-violet-600" />
                    Nouvelles inscriptions
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-[11px] border-violet-200 text-violet-700"
                  >
                    {data.userRegistrationsByMonth.reduce(
                      (s, r) => s + r.count,
                      0,
                    )}{' '}
                    au total
                  </Badge>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {data.userRegistrationsByMonth.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                      <Users className="h-8 w-8 opacity-40" />
                      <p className="text-xs">Aucune donnée disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Y-axis labels + bars */}
                      <div className="flex gap-2">
                        {/* Y-axis labels */}
                        <div className="flex flex-col justify-between text-[10px] text-muted-foreground w-10 shrink-0 py-1">
                          <span>{maxRegistrations}</span>
                          <span>{Math.round(maxRegistrations / 2)}</span>
                          <span>0</span>
                        </div>
                        {/* Chart area */}
                        <div className="flex-1 relative">
                          {/* Horizontal grid lines */}
                          <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
                            <div className="border-t border-dashed border-gray-100" />
                            <div className="border-t border-dashed border-gray-100" />
                            <div className="border-t border-gray-100" />
                          </div>
                          {/* Bars */}
                          <div className="flex items-end gap-[3px] sm:gap-1.5 h-32 relative z-10 pt-1">
                            {data.userRegistrationsByMonth.map((item, i) => {
                              const heightPct =
                                maxRegistrations > 0
                                  ? (item.count / maxRegistrations) * 100
                                  : 0;
                              return (
                                <div
                                  key={i}
                                  className="flex-1 flex flex-col items-center gap-1"
                                >
                                  <span className="text-[9px] text-muted-foreground font-medium hidden sm:block">
                                    {item.count > 0 ? item.count : ''}
                                  </span>
                                  <div
                                    className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500 ease-out min-h-[2px] relative group cursor-pointer hover:from-blue-600 hover:to-blue-500"
                                    style={{
                                      height: `${Math.max(heightPct, 2)}%`,
                                    }}
                                  >
                                    {/* Tooltip */}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                      {item.month} : {item.count}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* X-axis labels */}
                          <div className="flex gap-[3px] sm:gap-1.5 mt-1.5">
                            {data.userRegistrationsByMonth.map((item, i) => (
                              <div
                                key={i}
                                className="flex-1 text-center"
                              >
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight block">
                                  {data.userRegistrationsByMonth.length <= 12
                                    ? item.month
                                    : i % Math.ceil(data.userRegistrationsByMonth.length / 10) === 0
                                      ? item.month
                                      : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ── MEDICATION CATEGORY DISTRIBUTION (Stacked Bar) ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-violet-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <FlaskConical className="h-4 w-4 text-violet-600" />
                    Catégories de médicaments
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-[11px] border-violet-200 text-violet-700"
                  >
                    {formatNumber(totalMedications)} au total
                  </Badge>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {data.medicationCategories.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                      <FlaskConical className="h-8 w-8 opacity-40" />
                      <p className="text-xs">Aucune donnée disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Stacked bar */}
                      <div className="flex h-7 rounded-full overflow-hidden w-full">
                        {data.medicationCategories.map((item, i) => {
                          const pct =
                            totalMedications > 0
                              ? (item.count / totalMedications) * 100
                              : 0;
                          if (pct === 0) return null;
                          return (
                            <div
                              key={i}
                              className={`transition-all duration-700 ease-out ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
                              style={{ width: `${pct}%` }}
                              title={`${item.category} : ${item.count}`}
                            />
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap gap-x-3 gap-y-2">
                        {data.medicationCategories.map((item, i) => {
                          const pct =
                            totalMedications > 0
                              ? ((item.count / totalMedications) * 100).toFixed(0)
                              : '0';
                          return (
                            <CategoryLegendItem
                              key={i}
                              colorClass={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                              label={item.category}
                              count={item.count}
                              percentage={pct}
                            />
                          );
                        })}
                      </div>
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
/*  Constants & Sub-components                                         */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS = [
  'bg-violet-500',
  'bg-violet-400',
  'bg-blue-500',
  'bg-blue-400',
  'bg-emerald-500',
  'bg-emerald-400',
  'bg-amber-500',
  'bg-amber-400',
  'bg-rose-500',
  'bg-rose-400',
  'bg-cyan-500',
  'bg-teal-500',
];

function CategoryLegendItem({
  colorClass,
  label,
  count,
  percentage,
}: {
  colorClass: string;
  label: string;
  count: number;
  percentage: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-3 w-3 rounded-sm ${colorClass} shrink-0`} />
      <span className="text-xs text-muted-foreground">
        {label}{' '}
        <span className="font-semibold text-foreground">{count}</span>
        <span className="text-[11px]"> ({percentage}%)</span>
      </span>
    </div>
  );
}
