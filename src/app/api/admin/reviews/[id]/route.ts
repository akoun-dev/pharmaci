import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const admin = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { id } = await params;

    const review = await db.review.findUnique({
      where: { id },
      select: {
        id: true,
        pharmacyId: true,
        rating: true,
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 });
    }

    // Delete review
    await db.review.delete({ where: { id } });

    // Recalculate pharmacy rating
    const pharmacyReviews = await db.review.findMany({
      where: { pharmacyId: review.pharmacyId },
      select: { rating: true },
    });

    const newRating = pharmacyReviews.length > 0
      ? pharmacyReviews.reduce((sum, r) => sum + r.rating, 0) / pharmacyReviews.length
      : 0;

    await db.pharmacy.update({
      where: { id: review.pharmacyId },
      data: {
        rating: Math.round(newRating * 10) / 10,
        reviewCount: pharmacyReviews.length,
      },
    });

    return NextResponse.json({
      message: 'Avis supprimé avec succès',
      deletedId: id,
      pharmacyNewRating: Math.round(newRating * 10) / 10,
      pharmacyReviewCount: pharmacyReviews.length,
    });
  } catch (error) {
    logger.error('Erreur suppression avis admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
