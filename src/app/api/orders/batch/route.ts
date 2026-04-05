import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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
    const { items, note } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Aucun article dans la commande' }, { status: 400 });
    }

    // Group items by pharmacy
    const pharmacyGroups = new Map<string, typeof items>();

    for (const item of items) {
      const { pharmacyId } = item;
      if (!pharmacyGroups.has(pharmacyId)) {
        pharmacyGroups.set(pharmacyId, []);
      }
      pharmacyGroups.get(pharmacyId)!.push(item);
    }

    const createdOrders = [];
    const errors = [];

    // Process each pharmacy group
    for (const [pharmacyId, pharmacyItems] of pharmacyGroups.entries()) {
      try {
        // Verify all stocks are available first
        const stockChecks = await Promise.all(
          pharmacyItems.map(async (item) => {
            const { medicationId, quantity, stockId } = item;
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
        const unavailable = stockChecks.filter(c => !c.available);
        if (unavailable.length > 0) {
          unavailable.forEach(u => {
            errors.push({
              medicationId: u.medicationId,
              pharmacyId,
              error: u.error,
            });
          });
          continue;
        }

        // All stocks are available, create the order
        // Calculate totals
        const totalQuantity = pharmacyItems.reduce((sum, item) => {
          const check = stockChecks.find(c => c.medicationId === item.medicationId);
          return sum + (check?.quantity || 0);
        }, 0);
        const totalPrice = pharmacyItems.reduce((sum, item) => {
          const check = stockChecks.find(c => c.medicationId === item.medicationId);
          return sum + (check?.quantity || 0) * (check?.price || 0);
        }, 0);

        // Generate a single verification code for this entire order
        // Ensure uniqueness
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

        // Create the order
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
              create: pharmacyItems.map((item, index) => {
                const check = stockChecks.find(c => c.medicationId === item.medicationId);
                return {
                  medicationId: item.medicationId,
                  quantity: check?.quantity || 1,
                  price: check?.price || 0,
                  stockId: item.stockId || null,
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
          pharmacyItems.map(async (item) => {
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

        createdOrders.push(order);
        logger.info('Order created with multiple items', { orderId: order.id, userId, pharmacyId, itemCount: pharmacyItems.length });
      } catch (error) {
        logger.error('Error processing pharmacy group:', pharmacyId, error);
        errors.push({ pharmacyId, error: 'Erreur lors du traitement de cette pharmacie' });
      }
    }

    if (createdOrders.length === 0) {
      return NextResponse.json({ error: 'Aucune commande créée', errors }, { status: 400 });
    }

    const pharmacyCount = createdOrders.length;

    return NextResponse.json({
      orders: createdOrders,
      count: createdOrders.length,
      pharmacyCount,
      errors: errors.length > 0 ? errors : undefined,
      message: pharmacyCount > 1
        ? `${pharmacyCount} commandes créées — une par pharmacie`
        : `${createdOrders[0].items?.length || 1} médicament${(createdOrders[0].items?.length || 1) > 1 ? 's' : ''} commandé${(createdOrders[0].items?.length || 1) > 1 ? 's' : ''}`,
    }, { status: 201 });
  } catch (error) {
    logger.error('Error creating batch orders:', error);
    return NextResponse.json({ error: 'Erreur lors de la création des commandes' }, { status: 500 });
  }
}
