import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import ExcelJS from 'exceljs';

interface ImportRow {
  row: number;
  commercialName: string;
  genericName: string;
  category: string;
  form: string;
  price: number | null;
  quantity: number | null;
  inStock: boolean;
  expirationDate: string | null;
  needsPrescription: boolean;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

function normalizeBool(val: unknown): boolean | null {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).trim().toLowerCase();
  if (['oui', 'o', 'yes', 'y', '1', 'true', 'vrai'].includes(str)) return true;
  if (['non', 'n', 'no', '0', 'false', 'faux'].includes(str)) return false;
  return null;
}

function normalizeNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/\s/g, '').replace(',', '.'));
  return isNaN(num) ? null : num;
}

function normalizeDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  if (!str) return null;
  const serial = parseFloat(str);
  if (!isNaN(serial) && serial > 40000 && serial < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + serial * 86400000);
    return date.toISOString().split('T')[0];
  }
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const d = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    return isNaN(d.getTime()) ? null : str;
  }
  const frMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (frMatch) {
    const d = new Date(parseInt(frMatch[3]), parseInt(frMatch[2]) - 1, parseInt(frMatch[1]));
    return isNaN(d.getTime()) ? null : `${frMatch[3]}-${frMatch[2].padStart(2, '0')}-${frMatch[1].padStart(2, '0')}`;
  }
  return null;
}

export async function POST(request: NextRequest) {
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

    const pharmacyId = user.linkedPharmacyId;
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }

    if (!file.name.match(/\.xlsx?$/i)) {
      return NextResponse.json({ error: 'Format invalide. Utilisez .xlsx' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 3) {
      return NextResponse.json({ error: 'Fichier vide ou sans données' }, { status: 400 });
    }

    const rows: ImportRow[] = [];
    const parseErrors: ImportError[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber < 3) return;

      const commercialName = String(row.getCell(2).value || '').trim();
      const genericName = String(row.getCell(3).value || '').trim();
      if (!commercialName && !genericName) return;

      const category = String(row.getCell(4).value || '').trim();
      const form = String(row.getCell(5).value || '').trim();
      const price = normalizeNum(row.getCell(6).value);
      const quantity = normalizeNum(row.getCell(7).value);
      const inStockVal = normalizeBool(row.getCell(8).value);
      const expirationDate = normalizeDate(row.getCell(9).value);
      const needsPrescriptionVal = normalizeBool(row.getCell(10).value);

      const hasName = !!commercialName || !!genericName;
      if (!hasName) {
        parseErrors.push({ row: rowNumber, field: 'Nom', message: 'Nom requis' });
        return;
      }
      if (price === null || price <= 0) {
        parseErrors.push({ row: rowNumber, field: 'Prix', message: 'Prix positif requis' });
        return;
      }
      if (quantity === null || quantity < 0 || !Number.isInteger(quantity)) {
        parseErrors.push({ row: rowNumber, field: 'Quantité', message: 'Quantité entière ≥ 0 requise' });
        return;
      }

      rows.push({
        row: rowNumber,
        commercialName,
        genericName,
        category,
        form,
        price,
        quantity,
        inStock: inStockVal !== null ? inStockVal : true,
        expirationDate,
        needsPrescription: needsPrescriptionVal !== null ? needsPrescriptionVal : false,
      });
    });

    if (rows.length === 0) {
      return NextResponse.json({
        error: 'Aucune donnée valide',
        details: parseErrors,
      }, { status: 400 });
    }

    const result = { created: 0, updated: 0, errors: [...parseErrors] as ImportError[] };

    for (const item of rows) {
      try {
        let medicationId: string | null = null;

        const existingMeds = await db.medication.findMany({
          where: {
            OR: [
              ...(item.commercialName ? [{ commercialName: { contains: item.commercialName } }] : []),
              ...(item.genericName ? [{ name: { contains: item.genericName } }] : []),
            ],
          },
          take: 5,
        });

        let medication = existingMeds.find(m =>
          (item.commercialName && m.commercialName?.toLowerCase() === item.commercialName.toLowerCase()) ||
          (item.genericName && m.name?.toLowerCase() === item.genericName.toLowerCase())
        );

        if (!medication && existingMeds.length > 0) {
          medication = existingMeds[0];
        }

        if (medication) {
          medicationId = medication.id;
        } else {
          const newName = item.genericName || item.commercialName;
          const newCommercial = item.commercialName || item.genericName;
          const newMed = await db.medication.create({
            data: {
              name: newName,
              commercialName: newCommercial,
              category: item.category || null,
              form: item.form || null,
              needsPrescription: item.needsPrescription,
              description: `Importé via Excel le ${new Date().toLocaleDateString('fr-FR')}`,
            },
          });
          medicationId = newMed.id;
        }

        const existingStock = await db.pharmacyMedication.findUnique({
          where: { pharmacyId_medicationId: { pharmacyId, medicationId } },
        });

        if (existingStock) {
          await db.pharmacyMedication.update({
            where: { id: existingStock.id },
            data: {
              price: item.price ?? 0,
              quantity: item.quantity ?? 0,
              inStock: item.inStock,
              needsPrescription: item.needsPrescription,
              ...(item.expirationDate ? { expirationDate: new Date(item.expirationDate) } : {}),
            },
          });
          await db.stockHistory.create({
            data: {
              pharmacyId,
              medicationId,
              type: 'adjustment',
              quantity: item.quantity ?? 0,
              note: `Import Excel — Qté: ${item.quantity ?? 0}, Prix: ${item.price ?? 0} FCFA`,
            },
          });
          result.updated++;
        } else {
          await db.pharmacyMedication.create({
            data: {
              pharmacyId,
              medicationId,
              price: item.price ?? 0,
              quantity: item.quantity ?? 0,
              inStock: item.inStock,
              needsPrescription: item.needsPrescription,
              ...(item.expirationDate ? { expirationDate: new Date(item.expirationDate) } : {}),
            },
          });
          await db.stockHistory.create({
            data: {
              pharmacyId,
              medicationId,
              type: 'entry',
              quantity: item.quantity ?? 0,
              note: `Import Excel — Nouvel ajout, Qté: ${item.quantity ?? 0}, Prix: ${item.price ?? 0} FCFA`,
            },
          });
          result.created++;
        }
      } catch (err) {
        result.errors.push({
          row: item.row,
          field: 'Traitement',
          message: err instanceof Error ? err.message : 'Erreur',
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      ...result,
    });
  } catch (error) {
    logger.error('Error importing stocks:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
