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

    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const q = searchParams.get('q')?.trim() || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // Base where clause
    const where: Prisma.OrderWhereInput = { pharmacyId };

    if (status) {
      where.status = status;
    }

    // Search filter: patient name
    if (q) {
      where.user = {
        name: { contains: q, mode: 'insensitive' },
      };
    }

    // Date range filters
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      where.createdAt = { ...(where.createdAt as Prisma.DateTimeNullableFilter || {}), gte: from };
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt = { ...(where.createdAt as Prisma.DateTimeNullableFilter || {}), lte: to };
    }

    // Count per status (global, without search/date filters — only pharmacyId)
    const statusCountsRaw = await db.order.groupBy({
      by: ['status'],
      where: { pharmacyId },
      _count: { status: true },
    });

    const statusCounts: Record<string, number> = {};
    let totalCount = 0;
    for (const row of statusCountsRaw) {
      statusCounts[row.status] = row._count.status;
      totalCount += row._count.status;
    }
    statusCounts['all'] = totalCount;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, phone: true } },
          medication: {
            select: {
              id: true,
              name: true,
              commercialName: true,
              form: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.order.count({ where }),
    ]);

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        deliveryStatus: o.deliveryStatus,
        quantity: o.quantity,
        totalPrice: o.totalPrice,
        note: o.note,
        paymentMethod: o.paymentMethod,
        pickupTime: o.pickupTime,
        verificationCode: o.verificationCode,
        verifiedAt: o.verifiedAt?.toISOString() || null,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        user: o.user,
        medication: o.medication,
      })),
      total,
      limit,
      offset,
      statusCounts,
    });
  } catch (error) {
    console.error('Error fetching pharmacist orders:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
