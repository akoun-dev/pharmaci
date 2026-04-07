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

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const where: Prisma.NotificationWhereInput = {
      userId: session.userId,
    };

    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        data: n.data,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
