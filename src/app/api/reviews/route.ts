import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pharmacyId = searchParams.get('pharmacyId');

    if (!pharmacyId) {
      return NextResponse.json({ error: 'pharmacyId requis' }, { status: 400 });
    }

    const reviews = await db.review.findMany({
      where: { pharmacyId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
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
    const { pharmacyId, rating, comment } = body;

    if (!pharmacyId || !rating) {
      return NextResponse.json(
        { error: 'pharmacyId et rating sont requis' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'La note doit être entre 1 et 5' }, { status: 400 });
    }

    const review = await db.review.create({
      data: { userId, pharmacyId, rating, comment },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Update pharmacy rating
    const allReviews = await db.review.findMany({
      where: { pharmacyId },
      select: { rating: true },
    });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await db.pharmacy.update({
      where: { id: pharmacyId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
