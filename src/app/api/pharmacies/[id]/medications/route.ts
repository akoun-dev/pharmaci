import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stocks = await db.pharmacyMedication.findMany({
      where: { pharmacyId: id },
      include: { medication: true },
      orderBy: { medication: { name: 'asc' } },
    });

    return NextResponse.json(stocks);
  } catch (error) {
    logger.error('Error fetching pharmacy medications:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
