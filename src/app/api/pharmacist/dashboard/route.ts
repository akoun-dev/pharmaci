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
      select: { role: true, linkedPharmacyId: true },
    });

    if (!user || user.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Accès réservé aux pharmaciens' }, { status: 403 });
    }

    if (!user.linkedPharmacyId) {
      return NextResponse.json({ error: 'Aucune pharmacie liée à votre compte' }, { status: 403 });
    }

    const pharmacyId = user.linkedPharmacyId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      pendingOrdersCount,
      todayOrdersCount,
      monthlyRevenue,
      todayRevenue,
      lowStockCount,
      totalMedicationsCount,
      unreadNotificationsCount,
      recentOrders,
    ] = await Promise.all([
      // Pending orders count
      db.order.count({
        where: { pharmacyId, status: 'pending' },
      }),

      // Today's orders count
      db.order.count({
        where: {
          pharmacyId,
          createdAt: { gte: startOfDay },
        },
      }),

      // Total revenue this month
      db.order.aggregate({
        where: {
          pharmacyId,
          status: { in: ['confirmed', 'ready', 'picked_up'] },
          createdAt: { gte: startOfMonth },
        },
        _sum: { totalPrice: true },
      }),

      // Today's revenue
      db.order.aggregate({
        where: {
          pharmacyId,
          status: { in: ['confirmed', 'ready', 'picked_up'] },
          createdAt: { gte: startOfDay },
        },
        _sum: { totalPrice: true },
      }),
      // Low stock count (quantity < 10)
      db.pharmacyMedication.count({
        where: {
          pharmacyId,
          quantity: { lt: 10 },
          inStock: true,
        },
      }),

      // Total medications count
      db.pharmacyMedication.count({
        where: { pharmacyId },
      }),

      // Unread notifications count
      db.notification.count({
        where: {
          userId: session.userId,
          read: false,
        },
      }),

      // Recent orders (last 5)
      db.order.findMany({
        where: { pharmacyId },
        include: {
          user: { select: { name: true, phone: true } },
          medication: { select: { name: true, commercialName: true, form: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      pendingOrdersCount,
      todayOrdersCount,
      monthlyRevenue: monthlyRevenue._sum.totalPrice || 0,
      todayRevenue: todayRevenue._sum.totalPrice || 0,
      lowStockCount,
      totalMedicationsCount,
      unreadNotificationsCount,
      recentOrders: recentOrders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching pharmacist dashboard:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
