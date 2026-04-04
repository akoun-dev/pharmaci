import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';

const DEFAULT_PREFS: Record<string, boolean> = {
  new_orders: true,
  stock_alerts: true,
  reviews: false,
  messages: true,
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true, notificationPreferences: true },
    });

    if (!user || user.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Accès réservé aux pharmaciens' }, { status: 403 });
    }

    let prefs: Record<string, boolean>;
    try {
      prefs = { ...DEFAULT_PREFS, ...JSON.parse(user.notificationPreferences) };
    } catch {
      prefs = { ...DEFAULT_PREFS };
    }

    return NextResponse.json(prefs);
  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true, notificationPreferences: true },
    });

    if (!user || user.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Accès réservé aux pharmaciens' }, { status: 403 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    // Merge existing preferences with updates
    let prefs: Record<string, boolean>;
    try {
      prefs = { ...DEFAULT_PREFS, ...JSON.parse(user.notificationPreferences) };
    } catch {
      prefs = { ...DEFAULT_PREFS };
    }

    // Only update known keys with boolean values
    const allowedKeys = Object.keys(DEFAULT_PREFS);
    for (const [key, value] of Object.entries(body)) {
      if (allowedKeys.includes(key) && typeof value === 'boolean') {
        prefs[key] = value;
      }
    }

    await db.user.update({
      where: { id: session.userId },
      data: { notificationPreferences: JSON.stringify(prefs) },
    });

    return NextResponse.json(prefs);
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
