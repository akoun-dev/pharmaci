import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import ExcelJS from 'exceljs';

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

    const pharmacy = await db.pharmacy.findUnique({
      where: { id: user.linkedPharmacyId },
      select: { name: true },
    });

    const stocks = await db.pharmacyMedication.findMany({
      where: { pharmacyId: user.linkedPharmacyId },
      include: {
        medication: {
          select: {
            name: true,
            commercialName: true,
            category: true,
            form: true,
            activePrinciple: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PharmApp CI';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Stock', {
      properties: { defaultRowHeight: 22 },
    });

    // Column widths
    sheet.columns = [
      { width: 4 },   // A - #
      { width: 28 },  // B - Médicament
      { width: 22 },  // C - Nom générique
      { width: 16 },  // D - Catégorie
      { width: 14 },  // E - Forme
      { width: 14 },  // F - Prix (FCFA)
      { width: 12 },  // G - Quantité
      { width: 12 },  // H - En stock
      { width: 16 },  // I - Date expiration
      { width: 16 },  // J - Ordonnance
    ];

    // Header row styling
    const headerFill = {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FF047857' },
    };
    const headerFont = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    const headerAlignment = {
      horizontal: 'center' as const,
      vertical: 'middle' as const,
      wrapText: true,
    };

    const headerRow = sheet.addRow([
      '#',
      'Médicament',
      'Nom générique',
      'Catégorie',
      'Forme',
      'Prix (FCFA)',
      'Quantité',
      'En stock',
      'Date expiration',
      'Ordonnance',
    ]);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = headerAlignment;
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF047857' } },
      };
    });

    // Subtitle row with pharmacy name
    const today = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    const subtitleRow = sheet.spliceRows(1, 0, [
      `Stock de ${pharmacy?.name || 'Pharmacie'} — Exporté le ${today}`,
    ]);
    const subtitleCell = subtitleRow[0].getCell(2);
    subtitleCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF374151' } };
    subtitleCell.alignment = { horizontal: 'left' };
    sheet.mergeCells('B1:J1');

    // Data rows
    const inStockFill = {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFECFDF5' },
    };
    const outStockFill = {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFFEF2F2' },
    };
    const lowStockFill = {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFFFF7ED' },
    };

    stocks.forEach((stock, index) => {
      const row = sheet.addRow([
        index + 1,
        stock.medication.commercialName || stock.medication.name,
        stock.medication.name,
        stock.medication.category || '',
        stock.medication.form || '',
        stock.price,
        stock.quantity,
        stock.inStock ? 'Oui' : 'Non',
        stock.expirationDate
          ? new Date(stock.expirationDate).toLocaleDateString('fr-FR')
          : '',
        stock.needsPrescription ? 'Oui' : 'Non',
      ]);

      // Apply row fill based on stock status
      const rowFill = !stock.inStock || stock.quantity === 0
        ? outStockFill
        : stock.quantity < 10
          ? lowStockFill
          : inStockFill;

      row.eachCell((cell, colNumber) => {
        if (colNumber === 1) {
          cell.alignment = { horizontal: 'center' };
        } else if (colNumber === 6) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right' };
        } else if (colNumber === 7) {
          cell.alignment = { horizontal: 'center' };
        } else if (colNumber === 8 || colNumber === 10) {
          cell.alignment = { horizontal: 'center' };
        }
        cell.fill = rowFill;
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
        cell.font = {
          name: 'Calibri',
          size: 10,
          color: { argb: 'FF374151' },
          ...(colNumber === 2 ? { bold: true } : {}),
        };
      });
    });

    // Summary row
    const totalRow = sheet.addRow([]);
    sheet.addRow([
      '',
      'TOTAL',
      '',
      '',
      '',
      '',
      stocks.reduce((sum, s) => sum + s.quantity, 0),
      '',
      '',
      '',
    ]);

    // Add legend at bottom
    const legendRow = sheet.addRow([]);
    sheet.addRow(['', 'Légende :']);
    sheet.addRow(['', '🟢 Vert = En stock (> 10 unités)']);
    sheet.addRow(['', '🟡 Orange = Stock faible (< 10 unités)']);
    sheet.addRow(['', '🔴 Rouge = Rupture de stock']);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const dateStr = new Date().toISOString().split('T')[0];
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="stock_pharmacie_${dateStr}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting stocks to Excel:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
