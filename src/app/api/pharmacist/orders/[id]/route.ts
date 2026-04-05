import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';

const ALLOWED_STATUSES = ['confirmed', 'ready', 'picked_up', 'cancelled'];

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

    const order = await db.order.findFirst({
      where: { id, pharmacyId: user.linkedPharmacyId },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            medication: {
              select: { id: true, name: true, commercialName: true, form: true, needsPrescription: true },
            },
          },
        },
        pharmacy: {
          select: { name: true, address: true, city: true, phone: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    return NextResponse.json({
      id: order.id,
      status: order.status,
      totalQuantity: order.totalQuantity,
      totalPrice: order.totalPrice,
      note: order.note,
      verificationCode: order.verificationCode,
      verifiedAt: order.verifiedAt?.toISOString() || null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      user: order.user,
      items: order.items,
      pharmacy: order.pharmacy,
    });
  } catch (error) {
    logger.error('Error fetching order detail:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
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
    const body = await request.json();
    const { status } = body;

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Statut invalide. Valeurs autorisées : ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Check order belongs to this pharmacy and get items for stock restoration
    const existing = await db.order.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            medicationId: true,
            quantity: true,
          },
        },
      },
    });

    if (!existing || existing.pharmacyId !== user.linkedPharmacyId) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    // If cancelling, restore stock for all items
    if (status === 'cancelled' && existing.status !== 'cancelled') {
      await Promise.all(
        existing.items.map((item) =>
          db.pharmacyMedication.update({
            where: {
              pharmacyId_medicationId: {
                pharmacyId: user.linkedPharmacyId,
                medicationId: item.medicationId,
              },
            },
            data: {
              quantity: { increment: item.quantity },
              inStock: true,
            },
          })
        )
      );
    }

    // Build update data
    const updateData: Record<string, string> = {};
    if (status) updateData.status = status;

    const updated = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            medication: {
              select: {
                id: true,
                name: true,
                commercialName: true,
                form: true,
                needsPrescription: true,
              },
            },
          },
        },
        pharmacy: {
          select: { name: true, address: true, city: true, phone: true },
        },
      },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      totalQuantity: updated.totalQuantity,
      totalPrice: updated.totalPrice,
      note: updated.note,
      verificationCode: updated.verificationCode,
      verifiedAt: updated.verifiedAt?.toISOString() || null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      user: updated.user,
      items: updated.items,
      pharmacy: updated.pharmacy,
    });
  } catch (error) {
    logger.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
