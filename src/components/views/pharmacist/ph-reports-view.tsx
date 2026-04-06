'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { ViewHeader } from '@/components/view-header';
import { PharmacistPageHeader } from '@/components/views/pharmacist/ph-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  AlertTriangle,
  Clock,
  XCircle,
  RefreshCw,
  Award,
  Loader2,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TopMedication {
  rank: number;
  medicationId: string;
  medicationName: string;
  quantitySold: number;
  revenue: number;
}

interface ChartDataPoint {
  label: string;
  value: number;
  date: string;
}

interface StockStatus {
  inStock: number;
  outOfStock: number;
  lowStock: number;
  expired: number;
  expiringSoon: number;
}

interface OrderStatusBreakdown {
  pending: number;
  confirmed: number;
  ready: number;
  pickedUp: number;
  cancelled: number;
}

interface ReportsData {
  revenue: number;
  previousRevenue: number;
  percentageChange: number;
  orderCount: number;
  avgOrderValue: number;
  topMedications: TopMedication[];
  chartData: ChartDataPoint[];
  stockStatus: StockStatus;
  orderStatusBreakdown: OrderStatusBreakdown;
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PharmacistReportsView() {
  const { setCurrentView } = useAppStore();
  const [period, setPeriod] = useState<Period>('month');
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drill-down state
  const [drillDownDate, setDrillDownDate] = useState<string | null>(null);
  const [drillDownOrders, setDrillDownOrders] = useState<{
    id: string;
    user: { name: string };
    medication: { name: string; commercialName: string };
    quantity: number;
    totalPrice: number;
    status: string;
    createdAt: string;
  }[]>([]);
  const [drillDownLoading, setDrillDownLoading] = useState(false);
  const [drillDownTotal, setDrillDownTotal] = useState(0);
  const [drillDownCount, setDrillDownCount] = useState(0);
  const [topMedication, setTopMedication] = useState<{ name: string; revenue: number; qty: number } | null>(null);

  const fetchReports = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pharmacist/reports?period=${p}`);
      if (!res.ok) throw new Error('Erreur lors du chargement des rapports');
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(period);
  }, [period, fetchReports]);

  const maxChartValue = data ? Math.max(...data.chartData.map((d) => d.value), 1) : 1;

  const totalOrders = data
    ? data.orderStatusBreakdown.pending +
      data.orderStatusBreakdown.confirmed +
      data.orderStatusBreakdown.ready +
      data.orderStatusBreakdown.pickedUp +
      data.orderStatusBreakdown.cancelled
    : 0;

  // Handle chart bar click — drill down into a specific day
  const handleBarClick = async (dateStr: string, label: string) => {
    setDrillDownDate(label);
    setDrillDownLoading(true);
    try {
      // Parse the date to create from/to filter
      const date = new Date(dateStr);
      const from = new Date(date);
      from.setHours(0, 0, 0, 0);
      const to = new Date(date);
      to.setHours(23, 59, 59, 999);

      const fromStr = from.toISOString().split('T')[0];
      const toStr = to.toISOString().split('T')[0];

      const res = await fetch(`/api/pharmacist/orders?limit=100&offset=0`);
      if (!res.ok) throw new Error('Erreur serveur');
      const respData = await res.json();
      const allOrders = Array.isArray(respData.orders) ? respData.orders : [];

      // Filter by date
      const dayOrders = allOrders.filter((o: { createdAt: string }) => {
        const oDate = new Date(o.createdAt);
        return oDate >= from && oDate <= to;
      });

      setDrillDownOrders(dayOrders);
      setDrillDownTotal(dayOrders.reduce((sum: number, o: { totalPrice: number }) => sum + o.totalPrice, 0));
      setDrillDownCount(dayOrders.length);

      // Find top medication
      if (dayOrders.length > 0) {
        const medMap: Record<string, { name: string; revenue: number; qty: number }> = {};
        dayOrders.forEach((o: { items: Array<{ medication: { name: string; commercialName: string }; quantity: number; price: number }>; totalQuantity: number; totalPrice: number }) => {
          o.items.forEach((item) => {
            const key = item.medication.commercialName || item.medication.name;
            if (!medMap[key]) medMap[key] = { name: key, revenue: 0, qty: 0 };
            medMap[key].revenue += item.price * item.quantity;
            medMap[key].qty += item.quantity;
          });
        });
        const top = Object.values(medMap).sort((a, b) => b.revenue - a.revenue)[0];
        setTopMedication(top || null);
      } else {
        setTopMedication(null);
      }
    } catch {
      toast.error('Impossible de charger les commandes du jour');
    } finally {
      setDrillDownLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* ─── HEADER ─── */}
        <motion.div variants={itemVariants}>
          <PharmacistPageHeader
            title="Rapports & Analyses"
            description="Consultez les indicateurs clés de votre pharmacie, les tendances et les synthèses exportables sur la période choisie."
            icon={<BarChart3 className="h-5 w-5" />}
          />
        </motion.div>

        {/* ─── PERIOD SELECTOR ─── */}
        <motion.div variants={itemVariants}>
          <div className="flex gap-1.5 p-1 bg-amber-50 rounded-xl">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`flex-1 text-xs sm:text-sm font-medium py-2 px-2 rounded-lg transition-all duration-200 ${
                  period === p.key
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-amber-600 hover:bg-amber-100/50'
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
            <Card className="border-amber-100">
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-3 w-28 mb-2" />
                <Skeleton className="h-8 w-40 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="border-amber-100">
                  <CardContent className="p-4">
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-6 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="border-amber-100">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-40">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1 bg-amber-200/40" style={{ height: `${30 + Math.random() * 70}%` }} />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-100">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-44" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
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
                  onClick={() => fetchReports(period)}
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
            {/* ── REVENUE CARD ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-amber-100 overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Chiffre d&apos;affaires</p>
                  <div className="flex items-end gap-3">
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">
                      {formatFCFA(data.revenue)}
                    </p>
                    <div className={`flex items-center gap-1 mb-1 text-sm font-medium ${
                      data.percentageChange >= 0 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {data.percentageChange >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>
                        {data.percentageChange >= 0 ? '+' : ''}
                        {data.percentageChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    vs période précédente ({formatFCFA(data.previousRevenue)})
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── STATS ROW ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
              <Card className="border-amber-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Total commandes</p>
                  <p className="text-lg sm:text-xl font-bold mt-0.5">{data.orderCount}</p>
                </CardContent>
              </Card>
              <Card className="border-amber-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100">
                      <Package className="h-4 w-4 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Panier moyen</p>
                  <p className="text-lg sm:text-xl font-bold mt-0.5">{formatFCFA(data.avgOrderValue)}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── DAILY REVENUE CHART (CSS-only bar chart) ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-amber-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                    CA journalier
                  </CardTitle>
                  <Badge variant="outline" className="text-[11px] border-amber-200 text-amber-700">
                    {PERIODS.find((p) => p.key === period)?.label}
                  </Badge>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {data.chartData.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                      <BarChart3 className="h-8 w-8 opacity-40" />
                      <p className="text-xs">Aucune donnée pour cette période</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Y-axis labels + bars */}
                      <div className="flex gap-2">
                        {/* Y-axis labels */}
                        <div className="flex flex-col justify-between text-[10px] text-muted-foreground w-14 shrink-0 py-1">
                          <span>{formatFCFA(maxChartValue)}</span>
                          <span>{formatFCFA(Math.round(maxChartValue / 2))}</span>
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
                          <div className="flex items-end gap-[3px] sm:gap-1 h-40 relative z-10 pt-1">
                            {data.chartData.map((d, i) => {
                              const height = maxChartValue > 0 ? (d.value / maxChartValue) * 100 : 0;
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                  <span className="text-[9px] text-muted-foreground font-medium truncate max-w-full hidden sm:block">
                                    {d.value > 0 ? formatFCFA(d.value) : ''}
                                  </span>
                                  <div
                                    className="w-full rounded-t-md bg-gradient-to-t from-amber-500 to-amber-400 transition-all duration-500 ease-out min-h-[2px] relative group cursor-pointer hover:from-amber-600 hover:to-amber-500"
                                    style={{ height: `${Math.max(height, 2)}%` }}
                                    onClick={() => handleBarClick(d.date, d.label)}
                                  >
                                    {/* Tooltip on hover */}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                      {formatFCFA(d.value)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* X-axis labels */}
                          <div className="flex gap-[3px] sm:gap-1 mt-1.5">
                            {data.chartData.map((d, i) => (
                              <div key={i} className="flex-1 text-center">
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                                  {data.chartData.length <= 12
                                    ? d.label
                                    : i % Math.ceil(data.chartData.length / 10) === 0
                                      ? d.label
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

            {/* ── TOP MEDICATIONS ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-amber-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-amber-600" />
                    Médicaments les plus vendus
                  </CardTitle>
                  <Badge variant="outline" className="text-[11px] border-amber-200 text-amber-700">
                    Top {data.topMedications.length}
                  </Badge>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {data.topMedications.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                      <Package className="h-8 w-8 opacity-40" />
                      <p className="text-xs">Aucune vente pour cette période</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {data.topMedications.map((med) => (
                        <div
                          key={med.medicationId}
                          className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-amber-50 transition-colors"
                        >
                          {/* Rank badge */}
                          <div className={`flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-bold shrink-0 ${
                            med.rank === 1
                              ? 'bg-amber-100 text-amber-700'
                              : med.rank === 2
                                ? 'bg-gray-200 text-gray-600'
                                : med.rank === 3
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-gray-100 text-gray-500'
                          }`}>
                            {med.rank}
                          </div>
                          {/* Medication name */}
                          <p className="text-sm font-medium flex-1 min-w-0 truncate">
                            {med.medicationName}
                          </p>
                          {/* Quantity */}
                          <span className="text-xs text-muted-foreground shrink-0">
                            {med.quantitySold} pcs
                          </span>
                          {/* Revenue */}
                          <span className="text-xs font-semibold text-amber-700 shrink-0">
                            {formatFCFA(med.revenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ── STOCK STATUS ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-amber-100">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-amber-600" />
                    État du stock
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StockStatCard
                      label="En stock"
                      value={data.stockStatus.inStock}
                      color="bg-amber-100"
                      textColor="text-amber-700"
                      iconColor="text-amber-500"
                    />
                    <StockStatCard
                      label="Rupture"
                      value={data.stockStatus.outOfStock}
                      color="bg-red-100"
                      textColor="text-red-700"
                      iconColor="text-red-500"
                    />
                    <StockStatCard
                      label="Stock faible"
                      value={data.stockStatus.lowStock}
                      color="bg-amber-100"
                      textColor="text-amber-700"
                      iconColor="text-amber-500"
                    />
                    <StockStatCard
                      label="Périmés"
                      value={data.stockStatus.expired}
                      color="bg-red-100"
                      textColor="text-red-700"
                      iconColor="text-red-500"
                    />
                    <StockStatCard
                      label="Bientôt périmés"
                      value={data.stockStatus.expiringSoon}
                      color="bg-orange-100"
                      textColor="text-orange-700"
                      iconColor="text-orange-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── ORDER STATUS BREAKDOWN ── */}
            <motion.div variants={itemVariants}>
              <Card className="border-amber-100">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
                    <ShoppingCart className="h-4 w-4 text-amber-600" />
                    Répartition des commandes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {totalOrders === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 opacity-40" />
                      <p className="text-xs">Aucune commande</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Stacked bar */}
                      <div className="flex h-6 rounded-full overflow-hidden w-full">
                        {data.orderStatusBreakdown.pending > 0 && (
                          <div
                            className="bg-amber-400 transition-all duration-500"
                            style={{ width: `${(data.orderStatusBreakdown.pending / totalOrders) * 100}%` }}
                          />
                        )}
                        {data.orderStatusBreakdown.confirmed > 0 && (
                          <div
                            className="bg-blue-400 transition-all duration-500"
                            style={{ width: `${(data.orderStatusBreakdown.confirmed / totalOrders) * 100}%` }}
                          />
                        )}
                        {data.orderStatusBreakdown.ready > 0 && (
                          <div
                            className="bg-amber-400 transition-all duration-500"
                            style={{ width: `${(data.orderStatusBreakdown.ready / totalOrders) * 100}%` }}
                          />
                        )}
                        {data.orderStatusBreakdown.pickedUp > 0 && (
                          <div
                            className="bg-gray-400 transition-all duration-500"
                            style={{ width: `${(data.orderStatusBreakdown.pickedUp / totalOrders) * 100}%` }}
                          />
                        )}
                        {data.orderStatusBreakdown.cancelled > 0 && (
                          <div
                            className="bg-red-400 transition-all duration-500"
                            style={{ width: `${(data.orderStatusBreakdown.cancelled / totalOrders) * 100}%` }}
                          />
                        )}
                      </div>
                      {/* Legend */}
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        <StatusLegendItem color="bg-amber-400" label="En attente" count={data.orderStatusBreakdown.pending} total={totalOrders} />
                        <StatusLegendItem color="bg-blue-400" label="Confirmées" count={data.orderStatusBreakdown.confirmed} total={totalOrders} />
                        <StatusLegendItem color="bg-amber-400" label="Prêtées" count={data.orderStatusBreakdown.ready} total={totalOrders} />
                        <StatusLegendItem color="bg-gray-400" label="Récupérées" count={data.orderStatusBreakdown.pickedUp} total={totalOrders} />
                        <StatusLegendItem color="bg-red-400" label="Annulées" count={data.orderStatusBreakdown.cancelled} total={totalOrders} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* ── DRILL-DOWN DIALOG ── */}
        <Dialog open={!!drillDownDate} onOpenChange={(open) => !open && setDrillDownDate(null)}>
          <DialogContent className="max-w-lg max-h-[80dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                Commandes du {drillDownDate}
              </DialogTitle>
              <DialogDescription>
                Détail des commandes pour cette journée
              </DialogDescription>
            </DialogHeader>

            {drillDownLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-amber-700">{drillDownCount}</p>
                    <p className="text-[11px] text-muted-foreground">Commandes</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-amber-700">{formatFCFA(drillDownTotal)}</p>
                    <p className="text-[11px] text-muted-foreground">CA total</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-amber-700">{topMedication ? topMedication.qty : 0}</p>
                    <p className="text-[11px] text-muted-foreground">Articles</p>
                  </div>
                </div>

                {/* Top medication */}
                {topMedication && (
                  <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
                    <Award className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-blue-600 font-medium">Médicament le plus vendu</p>
                      <p className="text-sm font-semibold truncate">{topMedication.name}</p>
                      <p className="text-[11px] text-muted-foreground">{formatFCFA(topMedication.revenue)} · {topMedication.qty} unités</p>
                    </div>
                  </div>
                )}

                {/* Orders list */}
                {drillDownOrders.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 opacity-40 mx-auto mb-2" />
                    <p className="text-sm">Aucune commande ce jour</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {drillDownOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {order.items.length === 1
                              ? (order.items[0].medication.commercialName || order.items[0].medication.name)
                              : `${order.items.length} médicaments`
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">{order.user.name} · ×{order.totalQuantity}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-semibold text-amber-700">{formatFCFA(order.totalPrice)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StockStatCard({
  label,
  value,
  color,
  textColor,
  iconColor,
}: {
  label: string;
  value: number;
  color: string;
  textColor: string;
  iconColor: string;
}) {
  return (
    <div className={`${color} rounded-xl p-3 sm:p-4`}>
      <p className={`text-[11px] sm:text-xs ${textColor} font-medium`}>{label}</p>
      <p className={`text-lg sm:text-xl font-bold ${textColor} mt-0.5`}>{value}</p>
    </div>
  );
}

function StatusLegendItem({
  color,
  label,
  count,
  total,
}: {
  color: string;
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-3 w-3 rounded-sm ${color} shrink-0`} />
      <span className="text-xs text-muted-foreground">
        {label} <span className="font-semibold text-foreground">{count}</span>
        <span className="text-[11px]"> ({pct}%)</span>
      </span>
    </div>
  );
}
