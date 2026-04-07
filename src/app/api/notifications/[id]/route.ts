import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { markNotificationAsRead } from '@/lib/notifications';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    // Verify notification belongs to user
    const notification = await db.notification.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification introuvable' }, { status: 404 });
    }

    if (notification.userId !== session.userId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const updated = await markNotificationAsRead(id);

    if (!updated) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
