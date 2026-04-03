import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const city = searchParams.get('city') || '';
    const isGuard = searchParams.get('isGuard') === 'true';
    const is24h = searchParams.get('is24h') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { address: { contains: q } },
        { city: { contains: q } },
        { district: { contains: q } },
      ];
    }
    if (city) {
      where.city = city;
    }
    if (isGuard) {
      where.isGuard = true;
    }
    if (is24h) {
      where.isOpen24h = true;
    }

    const pharmacies = await db.pharmacy.findMany({
      where,
      take: limit,
      orderBy: { rating: 'desc' },
    });

    // Check user favorites
    const userId = searchParams.get('userId') || '';
    let favorites: Set<string> = new Set();
    if (userId) {
      const userFavs = await db.favorite.findMany({
        where: { userId },
        select: { pharmacyId: true },
      });
      favorites = new Set(userFavs.map((f) => f.pharmacyId));
    }

    return NextResponse.json(
      pharmacies.map((p) => ({
        ...p,
        services: JSON.parse(p.services || '[]'),
        paymentMethods: JSON.parse(p.paymentMethods || '[]'),
        parkingInfo: p.parkingInfo,
        isFavorite: favorites.has(p.id),
      }))
    );
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
