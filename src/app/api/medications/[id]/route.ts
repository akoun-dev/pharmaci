import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const medication = await db.medication.findUnique({
      where: { id },
      include: {
        alternatives: {
          include: {
            alternative: true,
          },
        },
        stocks: {
          where: { inStock: true },
          include: {
            pharmacy: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                district: true,
                phone: true,
                isGuard: true,
                isOpen24h: true,
                rating: true,
                latitude: true,
                longitude: true,
              },
            },
          },
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!medication) {
      return NextResponse.json({ error: 'Médicament non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      ...medication,
      genericAlternatives: medication.alternatives.map((a) => a.alternative),
      availablePharmacies: medication.stocks.map((s) => ({
        ...s.pharmacy,
        stockId: s.id,
        price: s.price,
        quantity: s.quantity,
        needsPrescription: s.needsPrescription,
      })),
    });
  } catch (error) {
    logger.error('Error fetching medication:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
