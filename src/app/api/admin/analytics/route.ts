import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Determine date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const [
      // Revenue by pharmacy
      revenueByPharmacy,
      // Orders by city
      ordersByCity,
      // User registrations by month (last 12 months)
      userRegistrations,
      // Medication category distribution
      categoryDistribution,
      // Total stats for period
      totalOrdersInPeriod,
      totalRevenueInPeriod,
      newUsersInPeriod,
      // Order status distribution
      orderStatusDistribution,
    ] = await Promise.all([
      // Revenue breakdown by pharmacy
      db.order.groupBy({
        by: ['pharmacyId'],
        where: {
          status: { in: ['confirmed', 'ready', 'picked_up'] },
          createdAt: { gte: startDate },
        },
        _sum: { totalPrice: true },
        _count: true,
        orderBy: { _sum: { totalPrice: 'desc' } },
      }).then(async (groups) => {
        const pharmacyIds = groups.map((g) => g.pharmacyId);
        const pharmacies = pharmacyIds.length > 0
          ? await db.pharmacy.findMany({
              where: { id: { in: pharmacyIds } },
              select: { id: true, name: true, city: true },
            })
          : [];
        return groups.map((g) => {
          const pharmacy = pharmacies.find((p) => p.id === g.pharmacyId);
          return {
            pharmacyId: g.pharmacyId,
            name: pharmacy?.name || 'Inconnu',
            city: pharmacy?.city || '',
            revenue: g._sum.totalPrice || 0,
            orderCount: g._count,
          };
        });
      }),

      // Orders by city
      db.order.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          pharmacy: { select: { city: true } },
        },
      }).then((orders) => {
        const cityMap: Record<string, number> = {};
        for (const o of orders) {
          const city = o.pharmacy.city || 'Autre';
          cityMap[city] = (cityMap[city] || 0) + 1;
        }
        return Object.entries(cityMap)
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count);
      }),

      // User registrations by month (last 12 months)
      db.user.groupBy({
        by: ['createdAt'],
        _count: true,
      }).then((groups) => {
        const monthMap: Record<string, number> = {};
        for (const g of groups) {
          const key = `${g.createdAt.getFullYear()}-${String(g.createdAt.getMonth() + 1).padStart(2, '0')}`;
          monthMap[key] = (monthMap[key] || 0) + g._count;
        }

        const monthNames = [
          'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
          'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
        ];

        const registrations: { month: string; year: number; monthLabel: string; count: number }[] = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          registrations.push({
            month: key,
            year: d.getFullYear(),
            monthLabel: monthNames[d.getMonth()],
            count: monthMap[key] || 0,
          });
        }
        return registrations;
      }),

      // Medication category distribution
      db.medication.groupBy({
        by: ['category'],
        _count: true,
      }).then((groups) => {
        return groups
          .filter((g) => g.category)
          .map((g) => ({
            category: g.category,
            count: g._count,
          }))
          .sort((a, b) => b.count - a.count);
      }),

      // Total orders in period
      db.order.count({
        where: { createdAt: { gte: startDate } },
      }),

      // Total revenue in period
      db.order.aggregate({
        where: {
          status: { in: ['confirmed', 'ready', 'picked_up'] },
          createdAt: { gte: startDate },
        },
        _sum: { totalPrice: true },
      }),

      // New users in period
      db.user.count({
        where: { createdAt: { gte: startDate } },
      }),

      // Order status distribution in period
      db.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of orderStatusDistribution) {
      statusMap[s.status] = s._count;
    }

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      summary: {
        totalOrders: totalOrdersInPeriod,
        totalRevenue: totalRevenueInPeriod._sum.totalPrice || 0,
        newUsers: newUsersInPeriod,
        averageOrderValue: totalOrdersInPeriod > 0
          ? (totalRevenueInPeriod._sum.totalPrice || 0) / totalOrdersInPeriod
          : 0,
      },
      revenueByPharmacy,
      ordersByCity,
      userRegistrations,
      categoryDistribution,
      orderStatusDistribution: statusMap,
    });
  } catch (error) {
    logger.error('Erreur analytics admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
