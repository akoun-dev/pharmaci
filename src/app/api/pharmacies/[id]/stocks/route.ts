import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Seuil de stock bas
const LOW_STOCK_THRESHOLD = 20;

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
        ...(body.lowStockAlertSent !== undefined && { lowStockAlertSent: body.lowStockAlertSent }),
      },
      create: {
        pharmacyId: id,
        medicationId,
        inStock: inStock ?? true,
        quantity: quantity ? parseInt(quantity) : 0,
        price: price ? parseFloat(price) : 0,
        lowStockAlertSent: false,
      },
    });

    return NextResponse.json(stock);
  } catch (error) {
    logger.error('Error updating stock:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(
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
    const { lowStockAlertSent } = body;

    if (lowStockAlertSent === undefined) {
      return NextResponse.json(
        { error: 'lowStockAlertSent est requis' },
        { status: 400 }
      );
    }

    // Get the stock ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const stockId = pathParts[pathParts.length - 1];

    const updatedStock = await db.pharmacyMedication.update({
      where: { id: stockId },
      data: { lowStockAlertSent }
    });

    return NextResponse.json(updatedStock);
  } catch (error) {
    logger.error('Error updating stock alert status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify pharmacist role from auth headers (set by middleware)
    const userRole = request.headers.get('X-User-Role');

    if (userRole !== 'pharmacist') {
      return NextResponse.json(
        { error: 'Seuls les pharmaciens peuvent consulter les stocks.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const lowStock = searchParams.get('lowStock') === 'true';
    const alertSentParam = searchParams.get('alertSent');
    const alertSent = alertSentParam === 'false' ? false : alertSentParam === 'true' ? true : undefined;

    let stocks;
    if (lowStock && alertSent !== undefined) {
      // Filtrer les stocks bas non notifiés
      stocks = await db.pharmacyMedication.findMany({
        where: {
          pharmacyId: id,
          inStock: true,
          quantity: {
            lt: LOW_STOCK_THRESHOLD
          },
          lowStockAlertSent: alertSent
        },
        include: {
          medication: true
        }
      });
    } else {
      // Retourner tous les stocks
      stocks = await db.pharmacyMedication.findMany({
        where: { pharmacyId: id },
        include: {
          medication: true
        }
      });
    }

    return NextResponse.json(stocks);
  } catch (error) {
    logger.error('Error fetching stocks:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
