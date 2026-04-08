import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';

function escapeCSV(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
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

    const stocks = await db.pharmacyMedication.findMany({
      where: { pharmacyId: user.linkedPharmacyId },
      include: {
        medication: {
          select: {
            name: true,
            commercialName: true,
            category: true,
            form: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const today = new Date().toISOString().split('T')[0];
    const headers = [
      'Médicament',
      'Prix',
      'Quantité',
      'En stock',
      'Date d\'expiration',
      'Dernière mise à jour',
    ];

    const rows = stocks.map((s) => [
      s.medication.commercialName || s.medication.name,
      s.price.toLocaleString('fr-FR') + ' FCFA',
      String(s.quantity),
      s.inStock ? 'Oui' : 'Non',
      s.expirationDate
        ? new Date(s.expirationDate).toLocaleDateString('fr-FR')
        : '',
      s.updatedAt
        ? new Date(s.updatedAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : '',
    ]);

    const csvLines = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ];

    const csvContent = '\uFEFF' + csvLines.join('\n'); // BOM for Excel UTF-8

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="stocks_export_${today}.csv"`,
      },
    });
  } catch (error) {
    logger.error('Error exporting stocks:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
