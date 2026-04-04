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
    const rating = searchParams.get('rating');
    const pharmacyId = searchParams.get('pharmacyId');
    const hasReply = searchParams.get('hasReply');
    const q = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Prisma.ReviewWhereInput = {};

    if (rating) {
      const ratingNum = parseInt(rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        where.rating = ratingNum;
      }
    }

    if (pharmacyId) {
      where.pharmacyId = pharmacyId;
    }

    if (hasReply === 'true') {
      where.reply = { not: null };
    } else if (hasReply === 'false') {
      where.reply = null;
    }

    if (q) {
      where.OR = [
        { comment: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { pharmacy: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true, city: true } },
          pharmacy: { select: { id: true, name: true, city: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.review.count({ where }),
    ]);

    // Rating distribution
    const ratingDistribution = await db.review.groupBy({
      by: ['rating'],
      _count: true,
    });

    const ratingMap: Record<string, number> = {};
    for (const r of ratingDistribution) {
      ratingMap[r.rating] = r._count;
    }

    return NextResponse.json({
      items: reviews.map((r) => ({
        id: r.id,
        userId: r.userId,
        pharmacyId: r.pharmacyId,
        rating: r.rating,
        comment: r.comment,
        reply: r.reply,
        replyAt: r.replyAt?.toISOString() || null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        user: r.user,
        pharmacy: r.pharmacy,
      })),
      total,
      limit,
      offset,
      ratingDistribution: ratingMap,
    });
  } catch (error) {
    logger.error('Erreur liste avis admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
