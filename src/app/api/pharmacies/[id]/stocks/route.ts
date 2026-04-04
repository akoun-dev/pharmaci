import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify pharmacist role from auth headers (set by middleware)
    const userRole = request.headers.get('X-User-Role');

    if (userRole !== 'pharmacist') {
      return NextResponse.json(
        { error: 'Seuls les pharmaciens peuvent modifier les stocks.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { medicationId, inStock, quantity, price } = body;

    if (!medicationId) {
      return NextResponse.json({ error: 'medicationId requis' }, { status: 400 });
    }

    const stock = await db.pharmacyMedication.upsert({
      where: {
        pharmacyId_medicationId: {
          pharmacyId: id,
          medicationId,
        },
      },
      update: {
        ...(inStock !== undefined && { inStock }),
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(price !== undefined && { price: parseFloat(price) }),
      },
      create: {
        pharmacyId: id,
        medicationId,
        inStock: inStock ?? true,
        quantity: quantity ? parseInt(quantity) : 0,
        price: price ? parseFloat(price) : 0,
      },
    });

    return NextResponse.json(stock);
  } catch (error) {
    logger.error('Error updating stock:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
