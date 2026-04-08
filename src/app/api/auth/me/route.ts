import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/auth/me — Get current user from session
export async function GET(request: Request) {
  try {
    const payload = await getSessionFromCookie(request);
    if (!payload) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        city: true,
        address: true,
        authProvider: true,
        emailVerified: true,
        phoneVerified: true,
        linkedPharmacyId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    logger.error('Session error:', error);
    return NextResponse.json({ error: 'Erreur de session' }, { status: 500 });
  }
}
