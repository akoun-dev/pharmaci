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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate start of month for 6 months ago
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      usersByRole,
      pharmacyStats,
      totalMedications,
      ordersByStatus,
      totalRevenue,
      newUsersThisMonth,
      newOrdersToday,
      avgOrderValue,
      topPharmacies,
      topMedications,
      recentOrders,
      monthlyRevenueTrend,
    ] = await Promise.all([
      // Users count by role
      db.user.groupBy({
        by: ['role'],
        _count: true,
      }),

      // Pharmacy stats with guard breakdown
      Promise.all([
        db.pharmacy.count(),
        db.pharmacy.count({ where: { isGuard: true } }),
      ]),

      // Total medications
      db.medication.count(),

      // Orders by status
      db.order.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Total revenue (confirmed/ready/picked_up)
      db.order.aggregate({
        where: { status: { in: ['confirmed', 'ready', 'picked_up'] } },
        _sum: { totalPrice: true },
      }),

      // New users this month
      db.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // New orders today
      db.order.count({
        where: { createdAt: { gte: startOfDay } },
      }),

      // Average order value
      db.order.aggregate({
        where: { status: { in: ['confirmed', 'ready', 'picked_up'] } },
        _avg: { totalPrice: true },
      }),

      // Top 5 pharmacies by revenue
      db.order.groupBy({
        by: ['pharmacyId'],
        where: { status: { in: ['confirmed', 'ready', 'picked_up'] } },
        _sum: { totalPrice: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 5,
      }).then(async (groups) => {
        const pharmacyIds = groups.map((g) => g.pharmacyId);
        const pharmacies = pharmacyIds.length > 0
          ? await db.pharmacy.findMany({
              where: { id: { in: pharmacyIds } },
              select: { id: true, name: true, city: true, rating: true },
            })
          : [];
        return groups.map((g) => {
          const pharmacy = pharmacies.find((p) => p.id === g.pharmacyId);
          return {
            pharmacyId: g.pharmacyId,
            name: pharmacy?.name || 'Inconnu',
            city: pharmacy?.city || '',
            rating: pharmacy?.rating || 0,
            revenue: g._sum.totalPrice || 0,
          };
        });
      }),

      // Top 5 medications by order count
      db.order.groupBy({
        by: ['medicationId'],
        _count: true,
        _sum: { quantity: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }).then(async (groups) => {
        const medIds = groups.map((g) => g.medicationId);
        const meds = medIds.length > 0
          ? await db.medication.findMany({
              where: { id: { in: medIds } },
              select: { id: true, name: true, commercialName: true, category: true, form: true },
            })
          : [];
        return groups.map((g) => {
          const med = meds.find((m) => m.id === g.medicationId);
          return {
            medicationId: g.medicationId,
            name: med?.name || 'Inconnu',
            commercialName: med?.commercialName || '',
            category: med?.category || '',
            form: med?.form || '',
            orderCount: g._count.id,
            totalQuantity: g._sum.quantity || 0,
          };
        });
      }),

      // Recent 10 orders
      db.order.findMany({
        include: {
          user: { select: { id: true, name: true, phone: true } },
          pharmacy: { select: { id: true, name: true, city: true } },
          medication: { select: { id: true, name: true, commercialName: true, form: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Monthly revenue trend (last 6 months)
      db.order.findMany({
        where: {
          status: { in: ['confirmed', 'ready', 'picked_up'] },
          createdAt: { gte: sixMonthsAgo },
        },
        select: {
          totalPrice: true,
          createdAt: true,
        },
      }),
    ]);

    // Build users by role map
    const usersByRoleMap: Record<string, number> = {};
    let totalUsers = 0;
    for (const u of usersByRole) {
      usersByRoleMap[u.role] = u._count;
      totalUsers += u._count;
    }

    // Build orders by status map
    const ordersByStatusMap: Record<string, number> = {};
    let totalOrders = 0;
    for (const o of ordersByStatus) {
      ordersByStatusMap[o.status] = o._count;
      totalOrders += o._count;
    }

    // Build monthly revenue trend
    const monthlyTrend: { month: string; year: number; monthNum: number; revenue: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const monthOrders = monthlyRevenueTrend.filter(
        (o) => o.createdAt >= monthStart && o.createdAt < monthEnd
      );

      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
      ];

      monthlyTrend.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        monthNum: d.getMonth() + 1,
        revenue: monthOrders.reduce((sum, o) => sum + o.totalPrice, 0),
        orders: monthOrders.length,
      });
    }

    return NextResponse.json({
      users: {
        total: totalUsers,
        byRole: {
          patients: usersByRoleMap['patient'] || 0,
          pharmacists: usersByRoleMap['pharmacist'] || 0,
          admins: usersByRoleMap['admin'] || 0,
        },
        newThisMonth: newUsersThisMonth,
      },
      pharmacies: {
        total: pharmacyStats[0],
        onGuard: pharmacyStats[1],
      },
      medications: {
        total: totalMedications,
      },
      orders: {
        total: totalOrders,
        byStatus: {
          pending: ordersByStatusMap['pending'] || 0,
          confirmed: ordersByStatusMap['confirmed'] || 0,
          ready: ordersByStatusMap['ready'] || 0,
          picked_up: ordersByStatusMap['picked_up'] || 0,
          cancelled: ordersByStatusMap['cancelled'] || 0,
        },
        newToday: newOrdersToday,
        averageValue: avgOrderValue._avg.totalPrice || 0,
      },
      revenue: {
        total: totalRevenue._sum.totalPrice || 0,
        monthlyTrend,
      },
      topPharmacies,
      topMedications,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        status: o.status,
        quantity: o.quantity,
        totalPrice: o.totalPrice,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        user: o.user,
        pharmacy: o.pharmacy,
        medication: o.medication,
      })),
    });
  } catch (error) {
    console.error('Erreur tableau de bord admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
