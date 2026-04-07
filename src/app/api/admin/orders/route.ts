import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { Prisma } from '@prisma/client';

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
    const status = searchParams.get('status');
    const pharmacyId = searchParams.get('pharmacyId');
    const userId = searchParams.get('userId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const q = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (pharmacyId) {
      where.pharmacyId = pharmacyId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (dateFrom) {
      where.createdAt = { ...(where.createdAt as Prisma.DateTimeFilter | undefined), gte: new Date(dateFrom) };
    }

    if (dateTo) {
      where.createdAt = { ...(where.createdAt as Prisma.DateTimeFilter | undefined), lte: new Date(dateTo) };
    }

    if (q) {
      // Pour la recherche par médicament, on doit d'abord trouver les orderIds correspondants
      const medicationOrders = await db.orderItem.findMany({
        where: {
          medication: {
            OR: [
              { name: { contains: q } },
              { commercialName: { contains: q } },
            ],
          },
        },
        select: { orderId: true },
      });

      const medicationOrderIds = [...new Set(medicationOrders.map(o => o.orderId))];

      where.OR = [
        { note: { contains: q } },
        { user: { name: { contains: q } } },
        { user: { email: { contains: q } } },
        { pharmacy: { name: { contains: q } } },
      ];

      // Ajouter les IDs des commandes contenant le médicament recherché
      if (medicationOrderIds.length > 0) {
        where.OR.push({ id: { in: medicationOrderIds } });
      }
    }

    const [orders, total, orderStats] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, city: true } },
          pharmacy: { select: { id: true, name: true, city: true, address: true } },
          items: {
            include: {
              medication: {
                select: {
                  id: true,
                  name: true,
                  commercialName: true,
                  form: true,
                  imageUrl: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.order.count({ where }),
      db.order.groupBy({
        by: ['status'],
        _count: true,
        _sum: { totalPrice: true },
      }),
    ]);

    const orderStatsMap: Record<string, { count: number; total: number }> = {};
    for (const o of orderStats) {
      orderStatsMap[o.status] = {
        count: o._count,
        total: o._sum.totalPrice || 0,
      };
    }

    return NextResponse.json({
      items: orders.map((o) => ({
        id: o.id,
        userId: o.userId,
        pharmacyId: o.pharmacyId,
        status: o.status,
        totalQuantity: o.totalQuantity,
        totalPrice: o.totalPrice,
        note: o.note,
        verificationCode: o.verificationCode,
        verifiedAt: o.verifiedAt?.toISOString() || null,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        user: o.user,
        pharmacy: o.pharmacy,
        items: o.items,
      })),
      total,
      limit,
      offset,
      orderStats: orderStatsMap,
    });
  } catch (error) {
    logger.error('Erreur liste commandes admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
