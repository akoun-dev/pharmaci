import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requirePharmacist() {
  const user = await getCurrentUser();
  if (!user || user.role !== "PHARMACIST") return null;
  const pharmacy = await db.pharmacy.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });
  if (!pharmacy) return null;
  return { user, pharmacyId: pharmacy.id };
}

// POST - Import stock from XLSX file
export async function POST(req: NextRequest) {
  const auth = await requirePharmacist();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  let file: File | null = null;
  try {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
  } catch {
    return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  }

  if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
    return NextResponse.json(
      { error: "Format de fichier invalide. Veuillez utiliser un fichier .xlsx" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const wb = XLSX.read(bytes, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

  if (!rows || rows.length === 0) {
    return NextResponse.json(
      { error: "Le fichier est vide. Aucune donnée à importer." },
      { status: 400 }
    );
  }

  // Validate column headers (flexible matching)
  const nameKey = findKey(rows[0], ["Nom du médicament", "Medicament", "Médicament", "Nom", "Name"]);
  const priceKey = findKey(rows[0], ["Prix (FCFA)", "Prix", "Price", "Prix FCFA"]);
  const stockKey = findKey(rows[0], ["Stock", "Quantité", "Quantite", "Quantity"]);
  const thresholdKey = findKey(rows[0], ["Seuil stock bas", "Seuil", "Threshold", "Low Stock"]);
  const expiryKey = findKey(rows[0], ["Date d'expiration", "Date expiration", "Expiry", "Expiry Date"]);

  if (!nameKey || !priceKey || !stockKey) {
    return NextResponse.json(
      {
        error:
          "Colonnes obligatoires manquantes. Le fichier doit contenir au moins : " +
          '"Nom du médicament", "Prix (FCFA)" et "Stock".',
      },
      { status: 400 }
    );
  }

  const errors: string[] = [];
  const successData: { name: string; price: number; stock: number }[] = [];

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = (row[nameKey] || "").trim();
    const priceRaw = (row[priceKey] || "").toString().replace(/\s/g, "").replace(",", ".");
    const stockRaw = (row[stockKey] || "").toString().replace(/\s/g, "");
    const thresholdRaw = thresholdKey
      ? (row[thresholdKey] || "").toString().replace(/\s/g, "")
      : "";
    const expiryRaw = expiryKey ? (row[expiryKey] || "").trim() : "";

    const line = i + 2; // +2 for header row and 0-index

    if (!name) {
      errors.push(`Ligne ${line} : Nom du médicament vide`);
      continue;
    }

    const price = parseInt(priceRaw, 10);
    if (isNaN(price) || price <= 0) {
      errors.push(`Ligne ${line} : Prix invalide "${row[priceKey]}"`);
      continue;
    }

    const stock = parseInt(stockRaw, 10);
    if (isNaN(stock) || stock < 0) {
      errors.push(`Ligne ${line} : Stock invalide "${row[stockKey]}"`);
      continue;
    }

    const threshold = thresholdRaw ? parseInt(thresholdRaw, 10) || 10 : 10;

    let expiryDate: Date | null = null;
    if (expiryRaw) {
      const parsed = new Date(expiryRaw);
      if (!isNaN(parsed.getTime())) {
        expiryDate = parsed;
      }
    }

    // Find medication by exact name (case-insensitive via lowercase)
    const medication = await db.medication.findFirst({
      where: {
        name: { equals: name },
      },
      select: { id: true },
    });

    // Fallback: try case-insensitive by converting both sides
    let medicationId = medication?.id;
    if (!medicationId) {
      // Try by exact match ignoring case (SQLite is case-sensitive by default)
      const allMeds = await db.medication.findMany({
        where: { name: { contains: name } },
        select: { id: true, name: true },
      });
      const exact = allMeds.find(
        (m) => m.name.toLowerCase() === name.toLowerCase()
      );
      if (exact) {
        medicationId = exact.id;
      }
    }

    if (!medicationId) {
      errors.push(`Ligne ${line} : Médicament "${name}" introuvable dans la base`);
      continue;
    }

    successData.push({ name, price, stock });

    // Build upsert operations for transaction
    const existing = await db.pharmacyMedication.findUnique({
      where: {
        pharmacyId_medicationId: {
          pharmacyId: auth.pharmacyId,
          medicationId,
        },
      },
      select: { id: true, stock: true },
    });

    if (existing) {
      const diff = stock - existing.stock;
      await db.pharmacyMedication.update({
        where: { id: existing.id },
        data: {
          price,
          stock,
          lowStockThreshold: threshold,
          ...(expiryDate ? { expiryDate } : {}),
        },
      });

      if (diff !== 0) {
        await db.stockHistory.create({
          data: {
            pharmacyId: auth.pharmacyId,
            medicationId,
            changeType: diff > 0 ? "ADD" : "REMOVE",
            quantity: Math.abs(diff),
            note: `Import Excel - ${diff > 0 ? "Ajout" : "Retrait"} de ${Math.abs(diff)} unités`,
          },
        });
      }
    } else {
      await db.pharmacyMedication.create({
        data: {
          pharmacyId: auth.pharmacyId,
          medicationId,
          price,
          stock,
          lowStockThreshold: threshold,
          ...(expiryDate ? { expiryDate } : {}),
        },
      });

      await db.stockHistory.create({
        data: {
          pharmacyId: auth.pharmacyId,
          medicationId,
          changeType: "ADD",
          quantity: stock,
          note: "Import Excel - Ajout initial",
        },
      });
    }
  }

  return NextResponse.json({
    success: true,
    imported: successData.length,
    errors: errors.length > 0 ? errors : undefined,
    details: {
      totalRows: rows.length,
      imported: successData.length,
      failed: errors.length,
    },
  });
}

// Find a column key from row by matching possible labels
function findKey(
  row: Record<string, string>,
  candidates: string[]
): string | null {
  const rowKeys = Object.keys(row);
  for (const candidate of candidates) {
    const found = rowKeys.find(
      (k) => k.toLowerCase().trim() === candidate.toLowerCase().trim()
    );
    if (found) return found;
  }
  // Fuzzy: try includes
  for (const candidate of candidates) {
    const found = rowKeys.find((k) =>
      k.toLowerCase().includes(candidate.toLowerCase())
    );
    if (found) return found;
  }
  return null;
}
