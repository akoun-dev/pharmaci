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

    const admin = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            address: true,
            avatar: true,
          },
        },
        pharmacy: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
            email: true,
            latitude: true,
            longitude: true,
          },
        },
        medication: {
          select: {
            id: true,
            name: true,
            commercialName: true,
            form: true,
            category: true,
            activePrinciple: true,
            dosage: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    return NextResponse.json({
      id: order.id,
      userId: order.userId,
      pharmacyId: order.pharmacyId,
      medicationId: order.medicationId,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      note: order.note,
      paymentMethod: order.paymentMethod,
      pickupTime: order.pickupTime,
      verificationCode: order.verificationCode,
      verifiedAt: order.verifiedAt?.toISOString() || null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      user: order.user,
      pharmacy: order.pharmacy,
      medication: order.medication,
    });
  } catch (error) {
    console.error('Erreur détail commande admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
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
    const body = await request.json();
    const { status, note } = body;

    const existingOrder = await db.order.findUnique({ where: { id } });
    if (!existingOrder) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    const validStatuses = ['pending', 'confirmed', 'ready', 'picked_up', 'cancelled'];
    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Statut invalide. Valeurs acceptées : ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = status;

      // If cancelling, restore stock
      if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
        await db.pharmacyMedication.updateMany({
          where: {
            pharmacyId: existingOrder.pharmacyId,
            medicationId: existingOrder.medicationId,
          },
          data: { quantity: { increment: existingOrder.quantity } },
        });
      }

      // If re-confirming a cancelled order, deduct stock
      if (status !== 'cancelled' && existingOrder.status === 'cancelled') {
        await db.pharmacyMedication.updateMany({
          where: {
            pharmacyId: existingOrder.pharmacyId,
            medicationId: existingOrder.medicationId,
          },
          data: { quantity: { decrement: existingOrder.quantity } },
        });
      }
    }

    if (note !== undefined) {
      updateData.note = note;
    }

    const updatedOrder = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        pharmacy: { select: { id: true, name: true, city: true } },
        medication: { select: { id: true, name: true, commercialName: true } },
      },
    });

    return NextResponse.json({
      id: updatedOrder.id,
      status: updatedOrder.status,
      quantity: updatedOrder.quantity,
      totalPrice: updatedOrder.totalPrice,
      note: updatedOrder.note,
      paymentMethod: updatedOrder.paymentMethod,
      pickupTime: updatedOrder.pickupTime,
      createdAt: updatedOrder.createdAt.toISOString(),
      updatedAt: updatedOrder.updatedAt.toISOString(),
      user: updatedOrder.user,
      pharmacy: updatedOrder.pharmacy,
      medication: updatedOrder.medication,
    });
  } catch (error) {
    console.error('Erreur mise à jour commande admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
