import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/auth';

// GET /api/orders/[id] - Get a single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        pharmacy: {
          select: {
            name: true, address: true, city: true, phone: true,
            latitude: true, longitude: true, parkingInfo: true, paymentMethods: true,
          },
        },
        items: {
          include: {
            medication: { select: { name: true, commercialName: true, form: true, needsPrescription: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (order.userId !== session.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    logger.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/orders/[id] - Cancel an order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            medication: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (order.userId !== session.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Impossible d\'annuler cette commande. Seules les commandes en attente ou confirmées peuvent être annulées.' },
        { status: 400 }
      );
    }

    // Restore stock quantity for all items
    await Promise.all(
      order.items.map(item =>
        db.pharmacyMedication.update({
          where: {
            pharmacyId_medicationId: { pharmacyId: order.pharmacyId, medicationId: item.medicationId },
          },
          data: {
            quantity: { increment: item.quantity },
            inStock: true,
          },
        })
      )
    );

    const updatedOrder = await db.order.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        pharmacy: {
          select: {
            name: true, address: true, city: true, phone: true,
            latitude: true, longitude: true, parkingInfo: true, paymentMethods: true,
          },
        },
        items: {
          include: {
            medication: { select: { name: true, commercialName: true, form: true, needsPrescription: true } },
          },
        },
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    logger.error('Error cancelling order:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
