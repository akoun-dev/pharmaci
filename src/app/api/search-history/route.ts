import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/auth';

// POST /api/search-history - Record a search
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { query, searchType } = body;

    if (!query || !searchType) {
      return NextResponse.json(
        { error: 'La requête et le type de recherche sont requis' },
        { status: 400 }
      );
    }

    if (searchType !== 'medication' && searchType !== 'pharmacy') {
      return NextResponse.json(
        { error: 'Le type de recherche doit être "medication" ou "pharmacy"' },
        { status: 400 }
      );
    }

    await db.searchHistory.create({
      data: {
        userId: session.userId,
        query,
        searchType,
      },
    });

    // Keep only the last 20 search history entries per user
    const history = await db.searchHistory.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (history.length > 20) {
      const toDelete = history.slice(20);
      await db.searchHistory.deleteMany({
        where: {
          id: { in: toDelete.map((h) => h.id) },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving search history:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
