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
      category: searchParams.get('category') || undefined,
      pathology: searchParams.get('pathology') || undefined,
    });

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Paramètres de recherche invalides', details: validatedParams.error.errors },
        { status: 400 }
      );
    }

    const { q, category, pathology } = validatedParams.data;

    // Validate pagination parameters
    const pagination = paginationSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    const { page = 1, limit = 50 } = pagination.success ? pagination.data : { page: 1, limit: 50 };

    const countOnly = searchParams.get('count') === 'true';

    const where: Record<string, unknown> = {};

    // SQLite uses LIKE by default which is case-insensitive for ASCII
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { commercialName: { contains: q } },
        { activePrinciple: { contains: q } },
        { pathology: { contains: q } },
      ];
    }
    if (category) {
      where.category = category;
    }
    if (pathology) {
      where.pathology = { contains: pathology };
    }

    // If count=true, return only the total count
    if (countOnly) {
      const total = await db.medication.count({ where });
      return NextResponse.json({ total });
    }

    const [medications, total] = await Promise.all([
      db.medication.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        include: {
          _count: {
            select: {
              stocks: {
                where: { inStock: true },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      db.medication.count({ where }),
    ]);

    return NextResponse.json({
      items: medications.map((m) => ({
        ...m,
        availablePharmacyCount: m._count.stocks,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching medications:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des médicaments' },
      { status: 500 }
    );
  }
}
