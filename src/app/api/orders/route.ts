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
    // Require authentication — use session cookie
    const { getSessionFromCookie } = await import('@/lib/auth');
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const userId = session.userId;

    const body = await request.json();

    // Check if this is a multi-item order (new format) or single item (legacy format)
    const isMultiItemOrder = body.items && Array.isArray(body.items) && body.pharmacyId;

    if (isMultiItemOrder) {
      // Multi-item order: create ONE order with multiple items (all from same pharmacy)
      const { pharmacyId, items, note } = body;

      if (!pharmacyId || !items || items.length === 0) {
        return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
      }

      // Verify all stocks are available first
      const stockChecks = await Promise.all(
        items.map(async (item) => {
          const { medicationId, quantity } = item;
          const orderQuantity = Math.max(1, Math.min(100, parseInt(quantity) || 1));

          const stock = await db.pharmacyMedication.findUnique({
            where: {
              pharmacyId_medicationId: { pharmacyId, medicationId },
            },
          });

          if (!stock || !stock.inStock) {
            return {
              medicationId,
              available: false,
              error: 'Médicament non disponible',
            };
          }

          if (stock.quantity < orderQuantity) {
            return {
              medicationId,
              available: false,
              error: 'Stock insuffisant',
            };
          }

          return {
            medicationId,
            available: true,
            quantity: orderQuantity,
            price: stock.price,
          };
        })
      );

      // Check if any stock check failed
      const errors = stockChecks.filter(c => !c.available).map(c => ({
        medicationId: c.medicationId,
        error: c.error,
      }));

      if (errors.length > 0) {
        return NextResponse.json({ error: 'Certains médicaments ne sont pas disponibles', errors }, { status: 400 });
      }

      // Calculate totals
      const totalQuantity = items.reduce((sum, item) => {
        const check = stockChecks.find(c => c.medicationId === item.medicationId);
        return sum + (check?.quantity || 0);
      }, 0);
      const totalPrice = items.reduce((sum, item) => {
        const check = stockChecks.find(c => c.medicationId === item.medicationId);
        return sum + (check?.quantity || 0) * (check?.price || 0);
      }, 0);

      // Generate a unique verification code
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

      // Create ONE order with multiple items
      const order = await db.order.create({
        data: {
          userId,
          pharmacyId,
          totalQuantity,
          totalPrice,
          note: note?.trim() || null,
          status: 'pending',
          verificationCode,
          items: {
            create: items.map(item => {
              const check = stockChecks.find(c => c.medicationId === item.medicationId);
              return {
                medicationId: item.medicationId,
                quantity: check?.quantity || 1,
                price: check?.price || 0,
              };
            }),
          },
        },
        include: {
          user: { select: { name: true, phone: true } },
          pharmacy: {
            select: {
              name: true, address: true, city: true, phone: true,
              latitude: true, longitude: true, parkingInfo: true,
            },
          },
          items: {
            include: {
              medication: { select: { name: true, commercialName: true, form: true } },
            },
          },
        },
      });

      // Decrement all stocks
      await Promise.all(
        items.map(async (item) => {
          const check = stockChecks.find(c => c.medicationId === item.medicationId);
          await db.pharmacyMedication.update({
            where: {
              pharmacyId_medicationId: { pharmacyId, medicationId: item.medicationId },
            },
            data: {
              quantity: { decrement: check?.quantity || 0 },
              inStock: ((check?.quantity || 0) - 1) <= 0 ? false : true,
            },
          });
        })
      );

      logger.info('Order created with multiple items', { orderId: order.id, userId, pharmacyId, itemCount: items.length });

      return NextResponse.json(order, { status: 201 });
    }

    // Legacy single-item order format
    const { pharmacyId, medicationId, quantity, note } = body;

    if (!pharmacyId || !medicationId) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    // Validate quantity
    const orderQuantity = Math.max(1, Math.min(100, parseInt(quantity) || 1));

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
        totalQuantity: orderQuantity,
        totalPrice,
        note: note?.trim() || null,
        status: 'pending',
        verificationCode,
        items: {
          create: {
            medicationId,
            quantity: orderQuantity,
            price: stock.price,
          },
        },
      },
      include: {
        user: { select: { name: true, phone: true } },
        pharmacy: {
          select: {
            name: true, address: true, city: true, phone: true,
            latitude: true, longitude: true, parkingInfo: true,
          },
        },
        items: {
          include: {
            medication: { select: { name: true, commercialName: true, form: true } },
          },
        },
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
              latitude: true, longitude: true, parkingInfo: true,
            },
          },
          items: {
            include: {
              medication: { select: { name: true, commercialName: true, form: true, needsPrescription: true } },
            },
          },
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
