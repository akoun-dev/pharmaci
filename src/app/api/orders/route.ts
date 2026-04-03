import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    // Read userId from auth headers (set by middleware)
    const userId = request.headers.get('X-User-Id');

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { pharmacyId, medicationId, quantity, note, paymentMethod, pickupTime } = body;

    if (!pharmacyId || !medicationId) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    // Verify stock exists and is available
    const stock = await db.pharmacyMedication.findUnique({
      where: {
        pharmacyId_medicationId: { pharmacyId, medicationId },
      },
    });

    if (!stock || !stock.inStock) {
      return NextResponse.json({ error: 'Médicament non disponible dans cette pharmacie' }, { status: 400 });
    }

    if (stock.quantity < (quantity || 1)) {
      return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 });
    }

    const orderQuantity = quantity || 1;
    const totalPrice = stock.price * orderQuantity;

    // Generate unique verification code
    let verificationCode = generateVerificationCode();
    let codeExists = true;
    while (codeExists) {
      const existing = await db.order.findUnique({ where: { verificationCode } });
      if (!existing) {
        codeExists = false;
      } else {
        verificationCode = generateVerificationCode();
      }
    }

    const order = await db.order.create({
      data: {
        userId,
        pharmacyId,
        medicationId,
        quantity: orderQuantity,
        totalPrice,
        note: note || null,
        paymentMethod: paymentMethod || null,
        pickupTime: pickupTime || null,
        status: 'pending',
        verificationCode,
      },
      include: {
        user: { select: { name: true, phone: true } },
        pharmacy: {
          select: {
            name: true, address: true, city: true, phone: true,
            latitude: true, longitude: true, parkingInfo: true, paymentMethods: true,
          },
        },
        medication: { select: { name: true, commercialName: true, form: true } },
      },
    });

    // Decrement stock
    await db.pharmacyMedication.update({
      where: {
        pharmacyId_medicationId: { pharmacyId, medicationId },
      },
      data: {
        quantity: { decrement: orderQuantity },
        inStock: stock.quantity - orderQuantity <= 0 ? false : true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication — use session cookie
    const { getSessionFromCookie } = await import('@/lib/auth');
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const userId = session.userId;

    const orders = await db.order.findMany({
      where: { userId },
      include: {
        pharmacy: {
          select: {
            name: true, address: true, city: true, phone: true,
            latitude: true, longitude: true, parkingInfo: true, paymentMethods: true,
          },
        },
        medication: { select: { name: true, commercialName: true, form: true, needsPrescription: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
