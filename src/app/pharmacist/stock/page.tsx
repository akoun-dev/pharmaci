"use client";

import { useEffect, useState, useRef } from "react";
import {
  Package,
  Search,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Download,
  Printer,
  ArrowUpDown,
  AlertTriangle,
  X,
  Loader2,
  Minus,
  Clock,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api, pharmacistStockApi, formatFCFA, formatDate } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StockItem {
  id: string;
  medicationId: string;
  medication: { name: string; dosage: string; form: string; category: string };
  price: number;
  stock: number;
  lowStockThreshold: number;
  expiryDate: string | null;
}

export default function PharmacistStockPage() {
  const pushToast = useAppStore((s) => s.pushToast);
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "expiring" | "expired">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [deleting, setDeleting] = useState<StockItem | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ stock: StockItem[] }>("/api/pharmacist/stock?limit=500");
      setItems(res.stock);
    } catch {
      pushToast("Erreur de chargement.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function adjustStock(id: string, delta: number) {
    try {
      await api.put(`/api/pharmacist/stock/${id}`, { stockDelta: delta });
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, stock: Math.max(0, it.stock + delta) } : it))
      );
      pushToast(delta > 0 ? "+1 en stock" : "-1 en stock", "success");
    } catch {
      pushToast("Erreur de modification.", "error");
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.del(`/api/pharmacist/stock/${id}`);
      setItems((prev) => prev.filter((it) => it.id !== id));
      setDeleting(null);
      pushToast("Article supprime.", "success");
    } catch {
      pushToast("Erreur de suppression.", "error");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const result = await pharmacistStockApi.importExcel(file);
      pushToast(`${result.imported} article(s) importe(s).`, "success");
      void load();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur d'import", "error");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const filtered = items.filter((it) => {
    const matchSearch = !search || it.medication.name.toLowerCase().includes(search.toLowerCase()) || it.medication.category?.toLowerCase().includes(search.toLowerCase());
    const now = Date.now();
    const isExpired = it.expiryDate && new Date(it.expiryDate).getTime() < now;
    const isExpiring = it.expiryDate && !isExpired && new Date(it.expiryDate).getTime() < now + 30 * 86400000;
    const isLow = it.stock <= it.lowStockThreshold;
    const matchFilter =
      filter === "all" ||
      (filter === "low" && isLow) ||
      (filter === "expiring" && isExpiring) ||
      (filter === "expired" && isExpired);
    return matchSearch && matchFilter;
  });

  const lowCount = items.filter((it) => it.stock <= it.lowStockThreshold).length;
  const expiringCount = items.filter((it) => {
    if (!it.expiryDate) return false;
    const d = new Date(it.expiryDate).getTime();
    return d > Date.now() && d < Date.now() + 30 * 86400000;
  }).length;
  const expiredCount = items.filter((it) => it.expiryDate && new Date(it.expiryDate).getTime() < Date.now()).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Stock</h1>
          <p className="text-sm text-muted-foreground">{items.length} articles</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
            Importer
          </Button>
          <Button variant="outline" size="sm" onClick={() => pharmacistStockApi.exportExcel()}>
            <Download className="mr-1 h-4 w-4" /> Exporter
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1 h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={cn("rounded-full px-3 py-1 text-xs font-semibold transition-colors", filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
          Tous ({items.length})
        </button>
        {lowCount > 0 && (
          <button onClick={() => setFilter("low")} className={cn("rounded-full px-3 py-1 text-xs font-semibold transition-colors", filter === "low" ? "bg-red-500 text-white" : "bg-red-100 text-red-700 hover:bg-red-200")}>
            <AlertTriangle className="mr-1 inline h-3 w-3" /> Stock bas ({lowCount})
          </button>
        )}
        {expiringCount > 0 && (
          <button onClick={() => setFilter("expiring")} className={cn("rounded-full px-3 py-1 text-xs font-semibold transition-colors", filter === "expiring" ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-700 hover:bg-amber-200")}>
            Expirant ({expiringCount})
          </button>
        )}
        {expiredCount > 0 && (
          <button onClick={() => setFilter("expired")} className={cn("rounded-full px-3 py-1 text-xs font-semibold transition-colors", filter === "expired" ? "bg-red-600 text-white" : "bg-red-100 text-red-700 hover:bg-red-200")}>
            Expire ({expiredCount})
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un medicament..." className="pl-9" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Aucun article trouve.</CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3">Medicament</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3 text-center">Seuil</th>
                  <th className="px-4 py-3 text-right">Prix</th>
                  <th className="px-4 py-3">Expiration</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => {
                  const isLow = it.stock <= it.lowStockThreshold;
                  const isExpired = it.expiryDate && new Date(it.expiryDate).getTime() < Date.now();
                  const isExpiring = it.expiryDate && !isExpired && new Date(it.expiryDate).getTime() < Date.now() + 30 * 86400000;
                  return (
                    <tr key={it.id} className={cn("border-b border-border/50 transition-colors hover:bg-muted/30", isLow && "bg-red-500/5")}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{it.medication.name}</p>
                        <p className="text-xs text-muted-foreground">{it.medication.dosage} - {it.medication.form}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => adjustStock(it.id, -1)} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className={cn("min-w-[2rem] text-center text-sm font-bold", isLow ? "text-red-600" : "")}>{it.stock}</span>
                          <button onClick={() => adjustStock(it.id, 1)} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">{it.lowStockThreshold}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatFCFA(it.price)}</td>
                      <td className="px-4 py-3">
                        {it.expiryDate ? (
                          <span className={cn("text-xs font-medium", isExpired ? "text-red-600" : isExpiring ? "text-amber-600" : "text-muted-foreground")}>
                            {formatDate(it.expiryDate)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => setEditing(it)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleting(it)} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold">Supprimer cet article ?</h3>
              <p className="mt-2 text-sm text-muted-foreground">{deleting.medication.name} ({deleting.medication.dosage})</p>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDeleting(null)}>Annuler</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(deleting.id)}>Supprimer</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit modal — simplified */}
      {(showAdd || editing) && (
        <AddEditModal
          item={editing}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSaved={() => { setShowAdd(false); setEditing(null); void load(); }}
        />
      )}
    </div>
  );
}

function AddEditModal({ item, onClose, onSaved }: { item: StockItem | null; onClose: () => void; onSaved: () => void }) {
  const pushToast = useAppStore((s) => s.pushToast);
  const [medicationSearch, setMedicationSearch] = useState(item?.medication?.name || "");
  const [medicationId, setMedicationId] = useState(item?.medicationId || "");
  const [price, setPrice] = useState(String(item?.price || ""));
  const [stock, setStock] = useState(String(item?.stock ?? 1));
  const [threshold, setThreshold] = useState(String(item?.lowStockThreshold ?? 5));
  const [expiryDate, setExpiryDate] = useState(item?.expiryDate?.split("T")[0] || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!medicationId || !price) {
      pushToast("Remplissez tous les champs.", "error");
      return;
    }
    setSaving(true);
    try {
      const body = { medicationId, price: Number(price), stock: Number(stock), lowStockThreshold: Number(threshold), expiryDate: expiryDate || null };
      if (item) {
        await api.put(`/api/pharmacist/stock/${item.id}`, body);
      } else {
        await api.post("/api/pharmacist/stock", body);
      }
      pushToast(item ? "Article modifie." : "Article ajoute.", "success");
      onSaved();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>{item ? "Modifier" : "Ajouter"} un article</CardTitle>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">MEDICAMENT</label>
            <Input value={medicationSearch} onChange={(e) => { setMedicationSearch(e.target.value); setMedicationId(""); }} placeholder="Rechercher..." disabled={!!item} />
          </div>
          {item && (
            <input type="hidden" value={item.medicationId} />
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">PRIX (FCFA)</label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">STOCK</label>
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">SEUIL ALERT</label>
              <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">EXPIRATION</label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {item ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
