import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Auth check
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 },
      );
    }

    const { id } = await params;

    // Find all PharmacyMedication records for the given medication
    const stocks = await db.pharmacyMedication.findMany({
      where: { medicationId: id },
      include: {
        pharmacy: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const mapped = stocks.map((s) => ({
      pharmacyId: s.pharmacy.id,
      pharmacyName: s.pharmacy.name,
      pharmacyCity: s.pharmacy.city,
      quantity: s.quantity,
      price: s.price,
      inStock: s.inStock,
    }));

    return NextResponse.json({ stocks: mapped });
  } catch (error) {
    console.error('Erreur récupération stocks médicament:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
