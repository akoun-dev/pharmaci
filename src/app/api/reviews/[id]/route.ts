import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Read userId from auth headers (set by middleware)
    const userId = request.headers.get('X-User-Id');

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Find the review and check ownership
    const review = await db.review.findUnique({
      where: { id },
      select: { userId: true, pharmacyId: true, rating: true },
    });

    if (!review) {
      return NextResponse.json({ error: 'Avis non trouvé' }, { status: 404 });
    }

    // Check if the user owns this review or is admin
    const userRole = request.headers.get('X-User-Role');
    if (review.userId !== userId && userRole !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Delete the review
    await db.review.delete({
      where: { id },
    });

    // Update pharmacy rating
    const allReviews = await db.review.findMany({
      where: { pharmacyId: review.pharmacyId },
      select: { rating: true },
    });

    if (allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await db.pharmacy.update({
        where: { id: review.pharmacyId },
        data: {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: allReviews.length,
        },
      });
    } else {
      await db.pharmacy.update({
        where: { id: review.pharmacyId },
        data: {
          rating: 0,
          reviewCount: 0,
        },
      });
    }

    return NextResponse.json({ message: 'Avis supprimé' });
  } catch (error) {
    logger.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
