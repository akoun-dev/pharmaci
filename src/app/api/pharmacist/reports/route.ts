import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';

function getPeriodDates(period: string) {
  const now = new Date();
  let start: Date;
  let previousStart: Date;
  let previousEnd: Date;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      previousStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      previousEnd = start;
      break;
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1); // Monday
      start.setHours(0, 0, 0, 0);
      previousStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousEnd = start;
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      previousEnd = start;
      break;
    case 'month':
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = start;
      break;
  }

  return { start, previousStart, previousEnd, end: now };
}

function getDailyDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true, linkedPharmacyId: true },
    });

    if (!user || user.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Accès réservé aux pharmaciens' }, { status: 403 });
    }

    if (!user.linkedPharmacyId) {
      return NextResponse.json({ error: 'Aucune pharmacie liée à votre compte' }, { status: 403 });
    }

    const pharmacyId = user.linkedPharmacyId;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const { start, previousStart, previousEnd, end } = getPeriodDates(period);

    // Run all queries in parallel
    const [
      revenueResult,
      previousRevenueResult,
      orderCountResult,
      previousOrderCountResult,
      orders,
      previousOrders,
      stockStats,
      statusCounts,
    ] = await Promise.all([
      // Current period revenue (completed orders)
      db.order.aggregate({
        where: {
          pharmacyId,
          status: { in: ['confirmed', 'ready', 'picked_up'] },
          createdAt: { gte: start, lte: end },
        },
        _sum: { totalPrice: true },
      }),

      // Previous period revenue
      db.order.aggregate({
        where: {
          pharmacyId,
          status: { in: ['confirmed', 'ready', 'picked_up'] },
          createdAt: { gte: previousStart, lt: previousEnd },
        },
        _sum: { totalPrice: true },
      }),

      // Current period order count
      db.order.count({
        where: {
          pharmacyId,
          createdAt: { gte: start, lte: end },
        },
      }),

      // Previous period order count
      db.order.count({
        where: {
          pharmacyId,
          createdAt: { gte: previousStart, lt: previousEnd },
        },
      }),

      // All orders in period (for top medications and daily revenue)
      db.order.findMany({
        where: {
          pharmacyId,
          createdAt: { gte: start, lte: end },
        },
        include: {
          medication: {
            select: {
              id: true,
              name: true,
              commercialName: true,
            },
          },
        },
      }),

      // Previous period orders (for comparison)
      db.order.findMany({
        where: {
          pharmacyId,
          createdAt: { gte: previousStart, lt: previousEnd },
        },
        select: { totalPrice: true, createdAt: true },
      }),

      // Stock stats
      db.pharmacyMedication.findMany({
        where: { pharmacyId },
        select: {
          id: true,
          inStock: true,
          quantity: true,
          expirationDate: true,
        },
      }),

      // Status breakdown
      db.order.groupBy({
        by: ['status'],
        where: {
          pharmacyId,
          createdAt: { gte: start, lte: end },
        },
        _count: { id: true },
      }),
    ]);

    const revenue = revenueResult._sum.totalPrice || 0;
    const previousRevenue = previousRevenueResult._sum.totalPrice || 0;
    const orderCount = orderCountResult;
    const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

    // Revenue percentage change
    let revenueChange = 0;
    if (previousRevenue > 0) {
      revenueChange = Math.round(((revenue - previousRevenue) / previousRevenue) * 100);
    }

    // Top medications by revenue
    const medMap = new Map<string, { name: string; commercialName: string; quantity: number; revenue: number }>();
    for (const order of orders) {
      const key = order.medicationId;
      const existing = medMap.get(key);
      const orderRevenue = order.totalPrice;
      if (existing) {
        existing.quantity += order.quantity;
        existing.revenue += orderRevenue;
      } else {
        medMap.set(key, {
          name: order.medication.name,
          commercialName: order.medication.commercialName,
          quantity: order.quantity,
          revenue: orderRevenue,
        });
      }
    }
    const topMedications = Array.from(medMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Daily revenue for charts
    const dailyDates = getDailyDates(start, end);
    const dailyOrdersMap = new Map<string, { revenue: number; orders: number }>();
    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      const existing = dailyOrdersMap.get(dateKey);
      if (existing) {
        existing.revenue += order.totalPrice;
        existing.orders += 1;
      } else {
        dailyOrdersMap.set(dateKey, { revenue: order.totalPrice, orders: 1 });
      }
    }
    const dailyRevenue = dailyDates.map((d) => {
      const dateKey = d.toISOString().split('T')[0];
      const data = dailyOrdersMap.get(dateKey);
      return {
        date: dateKey,
        revenue: data?.revenue || 0,
        orders: data?.orders || 0,
      };
    });

    // Stock stats
    const totalItems = stockStats.length;
    const inStock = stockStats.filter((s) => s.inStock && s.quantity > 0).length;
    const outOfStock = stockStats.filter((s) => !s.inStock || s.quantity === 0).length;
    const lowStock = stockStats.filter((s) => s.inStock && s.quantity > 0 && s.quantity < 10).length;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiredCount = stockStats.filter((s) => s.expirationDate && s.expirationDate < now).length;
    const expiringSoonCount = stockStats.filter(
      (s) => s.expirationDate && s.expirationDate >= now && s.expirationDate <= thirtyDaysFromNow
    ).length;

    // Status breakdown
    const statusBreakdown = {
      pending: 0,
      confirmed: 0,
      ready: 0,
      picked_up: 0,
      cancelled: 0,
    };
    for (const sc of statusCounts) {
      const key = sc.status as keyof typeof statusBreakdown;
      if (key in statusBreakdown) {
        statusBreakdown[key] = sc._count.id;
      }
    }

    return NextResponse.json({
      revenue,
      previousRevenue,
      revenueChange,
      orderCount,
      avgOrderValue,
      topMedications,
      dailyRevenue,
      stockStats: {
        totalItems,
        inStock,
        outOfStock,
        lowStock,
        expiredCount,
        expiringSoonCount,
      },
      statusBreakdown,
    });
  } catch (error) {
    logger.error('Error fetching pharmacist reports:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // POST could be used to generate/export reports in the future
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}
