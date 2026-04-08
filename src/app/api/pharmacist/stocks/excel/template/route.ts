import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await (await import('@/lib/db')).db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Accès réservé aux pharmaciens' }, { status: 403 });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Pharma CI';

    const sheet = workbook.addWorksheet('Import', {
      properties: { defaultRowHeight: 24 },
    });

    sheet.columns = [
      { width: 4 },
      { width: 32 },
      { width: 28 },
      { width: 16 },
      { width: 14 },
      { width: 14 },
      { width: 12 },
      { width: 12 },
      { width: 16 },
      { width: 14 },
    ];

    sheet.mergeCells('B1:J1');
    const titleCell = sheet.getCell('B1');
    titleCell.value = 'Modèle d\'import Pharma CI — Remplissez les colonnes B à J';
    titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF047857' } };
    titleCell.alignment = { horizontal: 'left' };

    const headers = [
      '#', 'Nom commercial *', 'Nom générique', 'Catégorie', 'Forme',
      'Prix (FCFA) *', 'Quantité *', 'En stock', 'Date expiration', 'Ordonnance',
    ];

    const headerFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF047857' } };

    const headerRow = sheet.addRow(headers);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF047857' } } };
    });

    const exampleFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFF7ED' } };

    const examples = [
      [1, 'Doliprane 500mg', 'Paracétamol', 'Antalgique', 'Comprimé', 250, 100, 'Oui', '2026-12-31', 'Non'],
      [2, 'Augmentin 1g', 'Amoxicilline + Ac. Clavulanique', 'Antibiotique', 'Comprimé', 3500, 50, 'Oui', '2026-09-15', 'Oui'],
      [3, 'Ibuprofène 400mg', 'Ibuprofène', 'Anti-inflammatoire', 'Comprimé', 300, 0, 'Non', '', 'Non'],
      [4, '', 'Oméprazole', 'Anti-ulcéreux', 'Gélule', 800, 30, 'Oui', '2027-03-01', 'Oui'],
      [5, '', '', '', '', '', '', '', '', ''],
    ];

    examples.forEach((rowData) => {
      const row = sheet.addRow(rowData);
      row.eachCell((cell, colNumber) => {
        if (colNumber === 1) cell.alignment = { horizontal: 'center' };
        if (colNumber === 6) cell.numFmt = '#,##0';
        if (colNumber === 7) cell.alignment = { horizontal: 'center' };
        if (colNumber === 8 || colNumber === 10) cell.alignment = { horizontal: 'center' };
        cell.fill = exampleFill;
        cell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF92400E' } };
      });
    });

    const instrStartRow = sheet.rowCount + 2;
    const instructions = [
      'Instructions :',
      '• Colonnes obligatoires : Nom commercial OU Nom générique + Prix + Quantité',
      '• Nom commercial = nom de marque (ex: Doliprane, Augmentin)',
      '• Nom générique = DCI / principe actif (ex: Paracétamol, Amoxicilline)',
      '• Si le médicament n\'existe pas, il sera créé automatiquement',
      '• "En stock" : Oui/Non (défaut: Oui)',
      '• "Ordonnance" : Oui/Non (défaut: Non)',
      '• "Date expiration" : AAAA-MM-JJ (ex: 2026-12-31)',
      '• Si le médicament existe déjà dans votre stock, il sera mis à jour',
    ];

    instructions.forEach((text, i) => {
      const row = sheet.addRow(['', text]);
      const cell = row.getCell(2);
      cell.font = { name: 'Calibri', size: 10, bold: i === 0, color: { argb: 'FF374151' } };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="modele_import_pharmaci.xlsx"',
      },
    });
  } catch (error) {
    logger.error('Error generating template:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
