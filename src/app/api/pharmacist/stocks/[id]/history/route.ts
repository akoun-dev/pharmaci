import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true, linkedPharmacyId: true },
    });

    if (!user || user.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Accès réservé aux pharmaciens' }, { status: 403 });
    }

    if (!user.linkedPharmacyId) {
      return NextResponse.json({ error: 'Aucune pharmacie liée à votre compte' }, { status: 403 });
    }

    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify stock exists and belongs to user's pharmacy
    const stock = await db.pharmacyMedication.findFirst({
      where: { id, pharmacyId: user.linkedPharmacyId },
    });

    if (!stock) {
      return NextResponse.json({ error: 'Stock non trouvé' }, { status: 404 });
    }

    const where = {
      pharmacyId: stock.pharmacyId,
      medicationId: stock.medicationId,
    };

    const [history, total] = await Promise.all([
      db.stockHistory.findMany({
        where,
        include: {
          medication: {
            select: { name: true, commercialName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.stockHistory.count({ where }),
    ]);

    return NextResponse.json({ history, total, limit, offset });
  } catch (error) {
    logger.error('Error fetching stock history:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
