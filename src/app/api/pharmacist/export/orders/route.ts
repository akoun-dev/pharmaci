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

function getPeriodDates(period: string) {
  const now = new Date();
  let start: Date;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'month':
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  return { start, end: now };
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  ready: 'Prête',
  picked_up: 'Récupérée',
  cancelled: 'Annulée',
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces',
  orange_money: 'Orange Money',
  wave: 'Wave',
  mtn_money: 'MTN Money',
  card: 'Carte',
};

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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const { start, end } = getPeriodDates(period);

    const orders = await db.order.findMany({
      where: {
        pharmacyId: user.linkedPharmacyId,
        createdAt: { gte: start, lte: end },
      },
      include: {
        user: {
          select: { name: true, phone: true },
        },
        medication: {
          select: { name: true, commercialName: true, form: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const today = new Date().toISOString().split('T')[0];
    const headers = [
      'ID Commande',
      'Patient',
      'Médicament',
      'Quantité',
      'Total',
      'Statut',
      'Date',
      'Mode paiement',
    ];

    const rows = orders.map((o) => [
      o.id.slice(0, 8),
      o.user.name,
      o.medication.commercialName || o.medication.name,
      String(o.quantity),
      o.totalPrice.toLocaleString('fr-FR') + ' FCFA',
      STATUS_LABELS[o.status] || o.status,
      new Date(o.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      PAYMENT_LABELS[o.paymentMethod || ''] || o.paymentMethod || '',
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
        'Content-Disposition': `attachment; filename="commandes_export_${today}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting orders:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
