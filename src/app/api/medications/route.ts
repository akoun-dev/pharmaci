import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const pathology = searchParams.get('pathology') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const countOnly = searchParams.get('count') === 'true';

    const where: Record<string, unknown> = {};

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

    const medications = await db.medication.findMany({
      where,
      take: limit,
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
    });

    return NextResponse.json(
      medications.map((m) => ({
        ...m,
        availablePharmacyCount: m._count.stocks,
      }))
    );
  } catch (error) {
    console.error('Error fetching medications:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
