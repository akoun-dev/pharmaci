import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pharmacy = await db.pharmacy.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        stocks: {
          include: {
            medication: true,
          },
        },
      },
    });

    if (!pharmacy) {
      return NextResponse.json({ error: 'Pharmacie non trouvée' }, { status: 404 });
    }

    // Check if favorite
    const userId = _request.nextUrl.searchParams.get('userId') || '';
    let isFavorite = false;
    if (userId) {
      const fav = await db.favorite.findUnique({
        where: { userId_pharmacyId: { userId, pharmacyId: id } },
      });
      isFavorite = !!fav;
    }

    return NextResponse.json({
      ...pharmacy,
      services: JSON.parse(pharmacy.services || '[]'),
      paymentMethods: JSON.parse(pharmacy.paymentMethods || '[]'),
      parkingInfo: pharmacy.parkingInfo,
      isFavorite,
    });
  } catch (error) {
    console.error('Error fetching pharmacy:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
