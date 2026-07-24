import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requirePharmacist() {
  const user = await getCurrentUser();
  if (!user || user.role !== "PHARMACIST") return null;
  const pharmacy = await db.pharmacy.findUnique({
    where: { ownerId: user.id },
    select: { id: true, name: true },
  });
  if (!pharmacy) return null;
  return { user, pharmacy };
}

// GET - Export stock as XLSX file
export async function GET() {
  const auth = await requirePharmacist();
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const stocks = await db.pharmacyMedication.findMany({
    where: { pharmacyId: auth.pharmacy.id },
    include: { medication: true },
    orderBy: { medication: { name: "asc" } },
  });

  // Fetch stock history grouped by medication
  const stockHistoryRecords = await db.stockHistory.findMany({
    where: { pharmacyId: auth.pharmacy.id },
    orderBy: { createdAt: "desc" },
    select: {
      medicationId: true,
      changeType: true,
      quantity: true,
      note: true,
      createdAt: true,
    },
  });

  const historyByMedication = new Map<string, typeof stockHistoryRecords>();
  for (const record of stockHistoryRecords) {
    const existing = historyByMedication.get(record.medicationId) || [];
    existing.push(record);
    historyByMedication.set(record.medicationId, existing);
  }

  const changeLabels: Record<string, string> = {
    ADD: "Ajout",
    REMOVE: "Retrait",
    UPDATE: "Modification",
  };

  // Build rows
  const rows = stocks.map((s) => {
    const history = historyByMedication.get(s.medicationId) || [];
    const historyStr = history
      .map((h) => {
        const date = new Date(h.createdAt).toLocaleDateString("fr-CI", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const action = changeLabels[h.changeType] || h.changeType;
        const note = h.note ? ` — ${h.note}` : "";
        return `${date}  ${action} ${h.quantity} unités${note}`;
      })
      .join("\n");

    return {
      "Nom du médicament": s.medication.name,
      "Principe actif": s.medication.activeIngredient,
      "Forme": s.medication.form,
      "Dosage": s.medication.dosage,
      "Catégorie": s.medication.category,
      "Prix (FCFA)": s.price,
      "Stock": s.stock,
      "Seuil stock bas": s.lowStockThreshold,
      "Date d'expiration": s.expiryDate
        ? new Date(s.expiryDate).toLocaleDateString("fr-CI")
        : "",
      "Historique des mouvements": historyStr || "Aucun mouvement",
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 30 }, // Nom du médicament
    { wch: 25 }, // Principe actif
    { wch: 15 }, // Forme
    { wch: 12 }, // Dosage
    { wch: 15 }, // Catégorie
    { wch: 12 }, // Prix
    { wch: 8 },  // Stock
    { wch: 16 }, // Seuil
    { wch: 16 }, // Date exp
    { wch: 50 }, // Historique
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stock");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const pharmacyName = auth.pharmacy.name.replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = new Date().toISOString().split("T")[0];

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="stock_${pharmacyName}_${dateStr}.xlsx"`,
    },
  });
}
