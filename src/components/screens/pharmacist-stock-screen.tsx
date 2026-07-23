"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  Loader2,
  Filter,
  Package,
  Pencil,
} from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useAppStore } from "@/lib/store";
import { api, formatFCFA, medicationApi, type Medication } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface StockItem {
  id: string;
  medicationId: string;
  medication: Medication;
  price: number;
  stock: number;
  lowStockThreshold: number;
  expiryDate: string | null;
  isLowStock: boolean;
}

export function PharmacistStockScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const goBack = useAppStore((s) => s.goBack);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add form
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addStock, setAddStock] = useState("");
  const [addThreshold, setAddThreshold] = useState("10");
  const [addExpiry, setAddExpiry] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadStocks();
  }, []);

  async function loadStocks() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (lowStockOnly) q.set("lowStock", "true");
      const res = await api.get<{ stocks: StockItem[] }>(`/api/pharmacist/stock?${q.toString()}`);
      setStocks(res.stocks);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStocks();
  }, [lowStockOnly]);

  useEffect(() => {
    const t = setTimeout(() => void loadStocks(), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function openAddModal() {
    setShowAddModal(true);
    setSelectedMedId("");
    setAddPrice("");
    setAddStock("");
    setAddThreshold("10");
    setAddExpiry("");
    try {
      const res = await medicationApi.list({ limit: 100 });
      setMedications(res.medications);
    } catch {
      // ignore
    }
  }

  async function handleAdd() {
    if (!selectedMedId || !addPrice || addStock === "") return;
    setSaving(true);
    try {
      await api.post("/api/pharmacist/stock", {
        medicationId: selectedMedId,
        price: parseInt(addPrice, 10),
        stock: parseInt(addStock, 10),
        lowStockThreshold: parseInt(addThreshold, 10) || 10,
        expiryDate: addExpiry || null,
      });
      setShowAddModal(false);
      void loadStocks();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editingStock) return;
    setSaving(true);
    try {
      const data: Record<string, unknown> = {};
      if (addPrice) data.price = parseInt(addPrice, 10);
      if (addStock !== "") data.stock = parseInt(addStock, 10);
      if (addThreshold) data.lowStockThreshold = parseInt(addThreshold, 10);
      data.expiryDate = addExpiry || null;
      await api.put(`/api/pharmacist/stock/${editingStock.id}`, data);
      setEditingStock(null);
      void loadStocks();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await api.del(`/api/pharmacist/stock/${deleteId}`);
      setDeleteId(null);
      void loadStocks();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  }

  function openEditModal(item: StockItem) {
    setEditingStock(item);
    setSelectedMedId(item.medicationId);
    setAddPrice(String(item.price));
    setAddStock(String(item.stock));
    setAddThreshold(String(item.lowStockThreshold));
    setAddExpiry(item.expiryDate ? item.expiryDate.split("T")[0] : "");
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Gestion du Stock" showBack />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Search + filters */}
        <div className="flex gap-2 pt-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un médicament..."
              className="h-10 pl-9 text-sm"
            />
          </div>
          <Button
            variant={lowStockOnly ? "default" : "outline"}
            size="icon"
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className="shrink-0"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button size="icon" onClick={() => void openAddModal()} className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {lowStockOnly && (
          <p className="text-xs text-amber-600 mb-3 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Affichage des médicaments en stock bas uniquement
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : stocks.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Aucun médicament en stock</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void openAddModal()}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {stocks.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border bg-card p-3",
                  item.isLowStock && "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{item.medication.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.medication.dosage} · {item.medication.form} · {item.medication.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(item)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="font-semibold text-primary">{formatFCFA(item.price)}</span>
                  <span className={cn(
                    "font-medium",
                    item.isLowStock ? "text-amber-600" : "text-green-600"
                  )}>
                    Stock: {item.stock}
                    {item.isLowStock && (
                      <span className="ml-1">
                        <AlertTriangle className="inline h-3 w-3" />
                      </span>
                    )}
                  </span>
                  {item.expiryDate && (
                    <span className="text-muted-foreground">
                      Exp: {new Date(item.expiryDate).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal || !!editingStock} onOpenChange={(v) => { if (!v) { setShowAddModal(false); setEditingStock(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingStock ? "Modifier le stock" : "Ajouter un médicament"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {!editingStock && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Médicament</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {medications.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.dosage} {m.form})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Prix (FCFA)</label>
              <Input
                type="number"
                value={addPrice}
                onChange={(e) => setAddPrice(e.target.value)}
                placeholder="Ex: 2500"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Stock</label>
              <Input
                type="number"
                value={addStock}
                onChange={(e) => setAddStock(e.target.value)}
                placeholder="Ex: 50"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Seuil stock bas</label>
              <Input
                type="number"
                value={addThreshold}
                onChange={(e) => setAddThreshold(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date d&apos;expiration</label>
              <Input
                type="date"
                value={addExpiry}
                onChange={(e) => setAddExpiry(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddModal(false); setEditingStock(null); }}>
              Annuler
            </Button>
            <Button
              onClick={editingStock ? () => void handleUpdate() : () => void handleAdd()}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editingStock ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer ce médicament ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible. Le stock sera supprimé de votre pharmacie.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => void handleDelete()}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
