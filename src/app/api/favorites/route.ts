import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Read userId from auth headers (set by middleware)
    const userId = request.headers.get('X-User-Id');

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const favorites = await db.favorite.findMany({
      where: { userId },
      include: {
        pharmacy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      favorites.map((f) => ({
        ...f,
        pharmacy: { ...f.pharmacy, services: JSON.parse(f.pharmacy.services || '[]') },
      }))
    );
  } catch (error) {
    logger.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Read userId from auth headers (set by middleware)
    const userId = request.headers.get('X-User-Id');

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { pharmacyId } = body;

    if (!pharmacyId) {
      return NextResponse.json({ error: 'pharmacyId requis' }, { status: 400 });
    }

    const existing = await db.favorite.findUnique({
      where: { userId_pharmacyId: { userId, pharmacyId } },
    });

    if (existing) {
      await db.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ isFavorite: false });
    }

    const favorite = await db.favorite.create({
      data: { userId, pharmacyId },
    });

    return NextResponse.json({ isFavorite: true, favorite }, { status: 201 });
  } catch (error) {
    logger.error('Error toggling favorite:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
