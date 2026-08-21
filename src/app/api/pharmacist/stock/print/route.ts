import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requirePharmacist() {
  const user = await getCurrentUser();
  if (!user || user.role !== "PHARMACIST") return null;
  const pharmacy = await db.pharmacy.findUnique({
    where: { ownerId: user.id },
    select: { id: true, name: true, address: true, city: true, phone: true },
  });
  if (!pharmacy) return null;
  return { user, pharmacy };
}

// GET - Print stock as a formatted HTML page (browser print / PDF)
export async function GET() {
  const auth = await requirePharmacist();
  if (!auth) {
    return new NextResponse("Non autorisé", { status: 403 });
  }

  const stocks = await db.pharmacyMedication.findMany({
    where: { pharmacyId: auth.pharmacy.id },
    include: { medication: true },
    orderBy: { medication: { name: "asc" } },
  });

  const now = new Date();
  const totalItems = stocks.length;
  const inStock = stocks.filter((s) => s.stock > 0).length;
  const lowStock = stocks.filter((s) => s.stock <= s.lowStockThreshold).length;
  const totalValue = stocks.reduce((sum, s) => sum + s.price * s.stock, 0);

  const rows = stocks
    .map(
      (s, i) => `
    <tr class="${s.stock <= s.lowStockThreshold ? "low-stock" : ""} ${i % 2 === 0 ? "even" : ""}">
      <td class="med-name">${escHtml(s.medication.name)}</td>
      <td>${escHtml(s.medication.dosage)}</td>
      <td>${escHtml(s.medication.form)}</td>
      <td class="num">${s.stock}</td>
      <td class="num">${formatFCFA(s.price)}</td>
      <td class="num">${formatFCFA(s.price * s.stock)}</td>
      <td class="${s.stock <= s.lowStockThreshold ? "warn" : ""}">${
        s.expiryDate
          ? new Date(s.expiryDate).toLocaleDateString("fr-FR")
          : "—"
      }</td>
    </tr>`
    )
    .join("\n");

  const lowStockCount = stocks.filter(
    (s) => s.stock <= s.lowStockThreshold
  ).length;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>État du stock — ${escHtml(auth.pharmacy.name)}</title>
  <style>
    @page { margin: 15mm 12mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 10px;
      color: #1a1a1a;
      line-height: 1.4;
      padding: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #16a34a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .brand {
      font-size: 18px;
      font-weight: 800;
      color: #16a34a;
    }
    .pharmacy-info h1 {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .pharmacy-info p {
      font-size: 9px;
      color: #555;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-size: 9px;
      color: #666;
    }
    .stats-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
    .stat {
      flex: 1;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 6px 8px;
      text-align: center;
    }
    .stat .val { font-size: 16px; font-weight: 700; color: #16a34a; }
    .stat .lbl { font-size: 7px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat.warn { background: #fff7ed; border-color: #fed7aa; }
    .stat.warn .val { color: #ea580c; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }
    th {
      background: #16a34a;
      color: white;
      font-weight: 600;
      text-align: left;
      padding: 5px 6px;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    th.num { text-align: right; }
    td {
      padding: 4px 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.med-name { font-weight: 600; }
    tr.low-stock td { background: #fff7ed; }
    td.warn { color: #ea580c; font-weight: 600; }
    tr.even td { background: #f9fafb; }
    tr.low-stock.even td { background: #fff7ed; }
    .footer {
      margin-top: 16px;
      text-align: center;
      font-size: 7px;
      color: #999;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
    }
    .legend {
      margin-top: 8px;
      font-size: 8px;
      color: #666;
    }
    .legend span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-right: 12px;
    }
    .legend .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
    .dot.green { background: #16a34a; }
    .dot.orange { background: #ea580c; }
    @media print {
      .no-print { display: none; }
      body { padding: 0; }
    }
    .no-print {
      text-align: center;
      margin-bottom: 12px;
    }
    .no-print button {
      background: #16a34a;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 20px;
      font-size: 12px;
      cursor: pointer;
    }
    .no-print button:hover { background: #15803d; }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>
  </div>

  <div class="header">
    <div class="brand">Pharma CI</div>
    <div class="pharmacy-info">
      <h1>${escHtml(auth.pharmacy.name)}</h1>
      <p>${escHtml(auth.pharmacy.address)}, ${escHtml(auth.pharmacy.city)}</p>
      <p>Tél: ${escHtml(auth.pharmacy.phone)}</p>
    </div>
  </div>

  <div class="meta">
    <span><strong>Date d'édition :</strong> ${now.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}</span>
    <span><strong>Total médicaments :</strong> ${totalItems}</span>
  </div>

  <div class="stats-bar">
    <div class="stat">
      <div class="val">${inStock}</div>
      <div class="lbl">En stock</div>
    </div>
    <div class="stat ${lowStockCount > 0 ? "warn" : ""}">
      <div class="val">${lowStockCount}</div>
      <div class="lbl">Stock bas</div>
    </div>
    <div class="stat">
      <div class="val">${formatFCFA(totalValue)}</div>
      <div class="lbl">Valeur totale</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Médicament</th>
        <th>Dosage</th>
        <th>Forme</th>
        <th class="num">Stock</th>
        <th class="num">Prix</th>
        <th class="num">Valeur</th>
        <th>Expiration</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="legend">
    <span><span class="dot orange"></span> Stock bas (≤ seuil)</span>
    <span>Total: ${totalItems} médicament(s) · ${formatFCFA(totalValue)} valeur totale</span>
  </div>

  <div class="footer">
    Pharma CI — Document généré le ${now.toLocaleDateString("fr-FR")} — État du stock
  </div>

  <script>
    // Auto-print ?
    if (window.location.search.includes('auto')) {
      window.onload = function() { setTimeout(function() { window.print(); }, 500); };
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}
