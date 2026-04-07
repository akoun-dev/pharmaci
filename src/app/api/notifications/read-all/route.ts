import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { markAllNotificationsAsRead } from '@/lib/notifications';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const result = await markAllNotificationsAsRead(session.userId);

    if (!result) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
