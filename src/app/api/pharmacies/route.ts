import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { searchParamsSchema, paginationSchema } from '@/lib/validations';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate and sanitize search parameters
    const validatedParams = searchParamsSchema.safeParse({
      q: searchParams.get('q') || undefined,
      city: searchParams.get('city') || undefined,
      district: searchParams.get('district') || undefined,
      isGuard: searchParams.get('isGuard') || undefined,
      is24h: searchParams.get('is24h') || undefined,
    });

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Paramètres de recherche invalides', details: validatedParams.error.errors },
        { status: 400 }
      );
    }

    const { q, city, isGuard, is24h } = validatedParams.data;

    // Validate pagination parameters
    const pagination = paginationSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    const { page = 1, limit = 50 } = pagination.success ? pagination.data : { page: 1, limit: 50 };

    const where: Record<string, unknown> = {};

    if (q) {
      // SQLite uses LIKE by default which is case-insensitive for ASCII
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
    if (isGuard === 'true') {
      where.isGuard = true;
    }
    if (is24h === 'true') {
      where.isOpen24h = true;
    }

    const [pharmacies, total] = await Promise.all([
      db.pharmacy.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { rating: 'desc' },
      }),
      db.pharmacy.count({ where }),
    ]);

    // Check user favorites (if userId provided)
    const userId = searchParams.get('userId') || '';
    let favorites: Set<string> = new Set();
    if (userId) {
      const userFavs = await db.favorite.findMany({
        where: { userId },
        select: { pharmacyId: true },
      });
      favorites = new Set(userFavs.map((f) => f.pharmacyId));
    }

    return NextResponse.json({
      items: pharmacies.map((p) => ({
        ...p,
        services: JSON.parse(p.services || '[]'),
        parkingInfo: p.parkingInfo,
        isFavorite: favorites.has(p.id),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching pharmacies:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des pharmacies' },
      { status: 500 }
    );
  }
}
