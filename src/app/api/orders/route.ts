import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { paginationSchema } from '@/lib/validations';
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

    // Validate quantity
    const orderQuantity = Math.max(1, Math.min(100, parseInt(quantity) || 1)); // Between 1 and 100

    // Verify stock exists and is available
    const stock = await db.pharmacyMedication.findUnique({
      where: {
        pharmacyId_medicationId: { pharmacyId, medicationId },
      },
    });

    if (!stock || !stock.inStock) {
      return NextResponse.json({ error: 'Médicament non disponible dans cette pharmacie' }, { status: 400 });
    }

    if (stock.quantity < orderQuantity) {
      return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 });
    }

    const totalPrice = stock.price * orderQuantity;

    // Generate unique verification code
    let verificationCode = generateVerificationCode();
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 10) {
      const existing = await db.order.findUnique({ where: { verificationCode } });
      if (!existing) {
        codeExists = false;
      } else {
        verificationCode = generateVerificationCode();
        attempts++;
      }
    }

    const order = await db.order.create({
      data: {
        userId,
        pharmacyId,
        medicationId,
        quantity: orderQuantity,
        totalPrice,
        note: note?.trim() || null,
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

    logger.info('Order created', { orderId: order.id, userId, pharmacyId });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    logger.error('Error creating order:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de la commande' }, { status: 500 });
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

    const { searchParams } = new URL(request.url);

    // Validate pagination parameters
    const pagination = paginationSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    const { page = 1, limit = 20 } = pagination.success ? pagination.data : { page: 1, limit: 20 };

    // Optional status filter
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
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
      }),
      db.order.count({ where }),
    ]);

    return NextResponse.json({
      items: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des commandes' }, { status: 500 });
  }
}
