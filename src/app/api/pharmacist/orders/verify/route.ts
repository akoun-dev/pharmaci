import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code de vérification requis' }, { status: 400 });
    }

    // Normalize: uppercase, trim whitespace
    const normalizedCode = code.toUpperCase().trim();

    // Find order by verification code, scoped to this pharmacy
    const order = await db.order.findFirst({
      where: {
        verificationCode: normalizedCode,
        pharmacyId: user.linkedPharmacyId,
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        medication: {
          select: { id: true, name: true, commercialName: true, form: true, needsPrescription: true },
        },
        pharmacy: {
          select: { name: true, address: true, city: true, phone: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Code invalide. Aucune commande trouvée avec ce code.' }, { status: 404 });
    }

    if (order.verifiedAt) {
      // Already verified — return current state
      return NextResponse.json({
        id: order.id,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        note: order.note,
        paymentMethod: order.paymentMethod,
        pickupTime: order.pickupTime,
        verificationCode: order.verificationCode,
        verifiedAt: order.verifiedAt.toISOString(),
        alreadyVerified: true,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        user: order.user,
        medication: order.medication,
        pharmacy: order.pharmacy,
      });
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Cette commande a été annulée.' }, { status: 400 });
    }

    // Mark as verified
    const updated = await db.order.update({
      where: { id: order.id },
      data: { verifiedAt: new Date() },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        medication: {
          select: { id: true, name: true, commercialName: true, form: true, needsPrescription: true },
        },
        pharmacy: {
          select: { name: true, address: true, city: true, phone: true },
        },
      },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      deliveryStatus: updated.deliveryStatus,
      quantity: updated.quantity,
      totalPrice: updated.totalPrice,
      note: updated.note,
      paymentMethod: updated.paymentMethod,
      pickupTime: updated.pickupTime,
      verificationCode: updated.verificationCode,
      verifiedAt: updated.verifiedAt.toISOString(),
      alreadyVerified: false,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      user: updated.user,
      medication: updated.medication,
      pharmacy: updated.pharmacy,
    });
  } catch (error) {
    logger.error('Error verifying order:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
