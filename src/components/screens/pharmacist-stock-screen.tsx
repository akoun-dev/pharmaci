"use client";

import { useEffect, useState, useMemo } from "react";
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
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer,
  ArrowUpDown,
  CalendarClock,
  Clock,
  FlaskConical,
  History,
  MoreVertical,
  Boxes,
} from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { DashboardSkeleton } from "@/components/app/dashboard-skeleton";
import { useAppStore } from "@/lib/store";
import { api, formatFCFA, medicationApi, pharmacistStockApi, type Medication } from "@/lib/api";
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
import { useRef } from "react";
import * as XLSX from "xlsx";

interface StockItem {
  id: string;
  medicationId: string;
  medication: Medication;
  price: number;
  stock: number;
  lowStockThreshold: number;
  expiryDate: string | null;
  isLowStock: boolean;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
}

interface HistoryEntry {
  id: string;
  changeType: string;
  quantity: number;
  note: string | null;
  createdAt: string;
}

export function PharmacistStockScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const goBack = useAppStore((s) => s.goBack);
  const pushToast = useAppStore((s) => s.pushToast);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // New filters
  const [expiryFilter, setExpiryFilter] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [sort, setSort] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Stock history modal
  const [historyItems, setHistoryItems] = useState<HistoryEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyMedName, setHistoryMedName] = useState("");

  // Add form
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addStock, setAddStock] = useState("");
  const [addThreshold, setAddThreshold] = useState("10");
  const [addExpiry, setAddExpiry] = useState("");
  const [saving, setSaving] = useState(false);

  // Export / Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    errors?: string[];
    details?: { totalRows: number; imported: number; failed: number };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Overflow menu (export / import / print)
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Add-modal medication search
  const [medSearch, setMedSearch] = useState("");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    void loadStocks();
    void loadCategories();
  }, []);

  useEffect(() => {
    void loadStocks();
  }, [lowStockOnly, expiryFilter, category, sort, sortOrder]);

  useEffect(() => {
    const t = setTimeout(() => void loadStocks(), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function loadCategories() {
    try {
      const res = await medicationApi.categories();
      setCategories(res.categories);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur de chargement des catégories", "error");
    }
  }

  async function loadStocks() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (lowStockOnly) q.set("lowStock", "true");
      if (expiryFilter) q.set("expiry", expiryFilter);
      if (category) q.set("category", category);
      q.set("sort", sort);
      q.set("order", sortOrder);
      const res = await api.get<{ stocks: StockItem[] }>(`/api/pharmacist/stock?${q.toString()}`);
      setStocks(res.stocks);
    } catch (err) {
      useAppStore.getState().pushToast(err instanceof Error ? err.message : "Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  }

  async function openAddModal() {
    setShowAddModal(true);
    setSelectedMedId("");
    setMedSearch("");
    setAddPrice("");
    setAddStock("");
    setAddThreshold("10");
    setAddExpiry("");
    try {
      const res = await medicationApi.list({ limit: 100 });
      setMedications(res.medications);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur de chargement des médicaments", "error");
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
      useAppStore.getState().pushToast(err instanceof Error ? err.message : "Erreur lors de l'ajout", "error");
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
      useAppStore.getState().pushToast(err instanceof Error ? err.message : "Erreur lors de la modification", "error");
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
      useAppStore.getState().pushToast(err instanceof Error ? err.message : "Erreur lors de la suppression", "error");
    }
  }

  // Quick adjust +1/-1 — with undo via toast
  async function quickAdjust(stockId: string, currentStock: number, delta: number, medName: string) {
    const newStock = Math.max(0, currentStock + delta);
    try {
      await api.put(`/api/pharmacist/stock/${stockId}`, { stock: newStock });
      pushToast(
        delta > 0 ? `+${delta} · ${medName}` : `${delta} · ${medName}`,
        "success",
        {
          actionLabel: "Annuler",
          onAction: async () => {
            try {
              await api.put(`/api/pharmacist/stock/${stockId}`, { stock: currentStock });
              pushToast(`${medName} restauré à ${currentStock}`, "info");
              void loadStocks();
            } catch {
              pushToast("Impossible d'annuler", "error");
            }
          },
        }
      );
      void loadStocks();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur", "error");
    }
  }

  // Stock history modal
  async function showHistory(item: StockItem) {
    setHistoryMedName(item.medication.name);
    try {
      const res = await api.get<{ history: HistoryEntry[] }>(
        `/api/pharmacist/stock/history?medicationId=${item.medicationId}`
      );
      setHistoryItems(res.history || []);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur de chargement de l'historique", "error");
      setHistoryItems([]);
    }
    setShowHistoryModal(true);
  }

  function openEditModal(item: StockItem) {
    setEditingStock(item);
    setSelectedMedId(item.medicationId);
    setAddPrice(String(item.price));
    setAddStock(String(item.stock));
    setAddThreshold(String(item.lowStockThreshold));
    setAddExpiry(item.expiryDate ? item.expiryDate.split("T")[0] : "");
  }

  // ---------- Export / Import Handlers ----------

  function handlePrint() {
    window.open("/api/pharmacist/stock/print?auto=1", "_blank");
  }

  async function handleExport() {
    try {
      await pharmacistStockApi.exportExcel();
      pushToast("Export réussi !", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur d'export", "error");
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    setImporting(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
    void (async () => {
      try {
        const result = await pharmacistStockApi.importExcel(file);
        setImportResult({
          success: true,
          imported: result.imported,
          errors: result.errors,
          details: result.details,
        });
        pushToast(`${result.imported} médicament(s) importé(s) avec succès !`, "success");
        void loadStocks();
      } catch (err) {
        setImportResult({
          success: false,
          imported: 0,
          errors: [err instanceof Error ? err.message : "Erreur d'import"],
        });
        pushToast(err instanceof Error ? err.message : "Erreur d'import", "error");
      } finally {
        setImporting(false);
      }
    })();
  }

  function handleDownloadTemplate() {
    const rows = [
      { "Nom du médicament": "Paracétamol", "Prix (FCFA)": 2500, "Stock": 50, "Seuil stock bas": 10, "Date d'expiration": "" },
      { "Nom du médicament": "Amoxicilline", "Prix (FCFA)": 3500, "Stock": 30, "Seuil stock bas": 10, "Date d'expiration": "2025-12-31" },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 30 }, { wch: 12 }, { wch: 8 }, { wch: 16 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modèle");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "template_import_stock.xlsx";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const sortOptions = [
    { value: "name", label: "Nom" },
    { value: "stock", label: "Stock" },
    { value: "price", label: "Prix" },
    { value: "expiry", label: "Date d'expiration" },
  ];

  // Summary stats computed from the currently loaded page
  const summary = useMemo(() => {
    return {
      total: stocks.length,
      lowStock: stocks.filter((s) => s.isLowStock).length,
      expired: stocks.filter((s) => s.isExpired).length,
      expiringSoon: stocks.filter((s) => s.isExpiringSoon && !s.isExpired).length,
    };
  }, [stocks]);

  // Filtered medications for the add modal search
  const filteredMedications = useMemo(() => {
    const q = medSearch.trim().toLowerCase();
    if (!q) return medications;
    return medications.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.activeIngredient?.toLowerCase().includes(q)
    );
  }, [medications, medSearch]);

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Gestion du Stock" showBack />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Search + filters */}
        <div className="space-y-2 pt-3 mb-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un médicament..."
                className="h-10 pl-9 text-sm"
              />
            </div>
            <Button variant={lowStockOnly ? "default" : "outline"} size="icon" onClick={() => setLowStockOnly(!lowStockOnly)} className="shrink-0" title="Filtrer stock bas">
              <Filter className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={() => void openAddModal()} className="shrink-0" title="Ajouter">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter chips row */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="h-8 shrink-0 rounded-lg border border-border bg-card px-2 text-[11px] font-medium text-muted-foreground focus:border-primary"
            >
              <option value="">Toutes les dates</option>
              <option value="expiring">Expire dans 30 jours</option>
              <option value="expired">Expiré</option>
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-8 shrink-0 rounded-lg border border-border bg-card px-2 text-[11px] font-medium text-muted-foreground focus:border-primary"
            >
              <option value="">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex h-8 items-center gap-1 rounded-lg border border-border bg-card px-2 text-[11px] font-medium text-muted-foreground hover:border-primary/40"
              >
                <ArrowUpDown className="h-3 w-3" />
                {sortOptions.find((o) => o.value === sort)?.label || "Tri"}
                {sortOrder === "desc" && " ↓"}
              </button>
              {showSortMenu && (
                <div ref={sortMenuRef} className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        if (sort === opt.value) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        else { setSort(opt.value); setSortOrder("asc"); }
                        setShowSortMenu(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                        sort === opt.value ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                      )}
                    >
                      {opt.label}
                      {sort === opt.value && (sortOrder === "asc" ? " ↑" : " ↓")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Overflow actions menu (export / import / print) */}
          <div className="flex justify-end">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
            <div className="relative" ref={actionsMenuRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActionsMenu((v) => !v)}
                className="h-9 gap-1 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5"
                aria-expanded={showActionsMenu}
                aria-label="Actions sur le stock"
              >
                <MoreVertical className="h-4 w-4" />
                <span>Actions</span>
              </Button>
              {showActionsMenu && (
                <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                  <button
                    onClick={() => { void handleExport(); setShowActionsMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors hover:bg-muted/50"
                  >
                    <Download className="h-3.5 w-3.5 text-primary" />
                    Exporter en Excel
                  </button>
                  <button
                    onClick={() => { handlePrint(); setShowActionsMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors hover:bg-muted/50"
                  >
                    <Printer className="h-3.5 w-3.5 text-primary" />
                    Imprimer / PDF
                  </button>
                  <button
                    onClick={() => { setShowImportModal(true); setImportResult(null); setShowActionsMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors hover:bg-muted/50"
                  >
                    <Upload className="h-3.5 w-3.5 text-primary" />
                    Importer un fichier
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary bar */}
        {!loading && stocks.length > 0 && (
          <div className="mb-3 grid grid-cols-4 gap-2">
            <div className="rounded-lg bg-muted/50 px-2 py-1.5 text-center">
              <p className="text-sm font-bold text-foreground">{summary.total}</p>
              <p className="text-[9px] text-muted-foreground">Total</p>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 px-2 py-1.5 text-center">
              <p className="text-sm font-bold text-amber-600">{summary.lowStock}</p>
              <p className="text-[9px] text-muted-foreground">Stock bas</p>
            </div>
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 px-2 py-1.5 text-center">
              <p className="text-sm font-bold text-orange-600">{summary.expiringSoon}</p>
              <p className="text-[9px] text-muted-foreground">Bientôt</p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 px-2 py-1.5 text-center">
              <p className="text-sm font-bold text-red-600">{summary.expired}</p>
              <p className="text-[9px] text-muted-foreground">Expirés</p>
            </div>
          </div>
        )}

        {lowStockOnly && (
          <p className="text-xs text-amber-600 mb-3 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Affichage des médicaments en stock bas uniquement
          </p>
        )}

        {loading ? (
          <DashboardSkeleton />
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
                  "rounded-xl border bg-card p-3 transition-all",
                  item.isLowStock && "border-amber-300 bg-amber-50 dark:bg-amber-950/20",
                  item.isExpired && "border-red-300 bg-red-50 dark:bg-red-950/20",
                  item.isExpiringSoon && !item.isExpired && "border-orange-300 bg-orange-50 dark:bg-orange-950/20"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{item.medication.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.medication.dosage} · {item.medication.form} · {item.medication.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => showHistory(item)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted"
                      title="Historique"
                    >
                      <History className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
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
                <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                  <span className="font-semibold text-primary">{formatFCFA(item.price)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => void quickAdjust(item.id, item.stock, -1, item.medication.name)}
                      disabled={item.stock <= 0}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-border hover:bg-muted disabled:opacity-30"
                      title="Retirer 1"
                      aria-label="Retirer une unité"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className={cn("font-semibold min-w-[3ch] text-center", item.isLowStock ? "text-amber-600" : "text-green-600")}>
                      {item.stock}
                    </span>
                    <button
                      onClick={() => void quickAdjust(item.id, item.stock, 1, item.medication.name)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-border hover:bg-muted"
                      title="Ajouter 1"
                      aria-label="Ajouter une unité"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  {item.expiryDate && (
                    <span className={cn(
                      "flex items-center gap-0.5",
                      item.isExpired ? "text-red-600 font-semibold" : item.isExpiringSoon ? "text-orange-600 font-semibold" : "text-muted-foreground"
                    )}>
                      <CalendarClock className="h-3 w-3" />
                      {new Date(item.expiryDate).toLocaleDateString("fr-FR")}
                      {item.isExpired && " (expiré)"}
                      {item.isExpiringSoon && !item.isExpired && " (bientôt)"}
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
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    placeholder="Rechercher un médicament..."
                    className="h-9 pl-8 text-sm"
                  />
                </div>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  size={6}
                >
                  <option value="">Sélectionner...</option>
                  {filteredMedications.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.dosage} {m.form})</option>
                  ))}
                </select>
                {filteredMedications.length === 0 && medSearch && (
                  <p className="mt-1 text-[11px] text-muted-foreground">Aucun médicament trouvé</p>
                )}
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Prix (FCFA)</label>
              <Input type="number" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} placeholder="Ex: 2500" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Stock</label>
              <Input type="number" value={addStock} onChange={(e) => setAddStock(e.target.value)} placeholder="Ex: 50" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Seuil stock bas</label>
              <Input type="number" value={addThreshold} onChange={(e) => setAddThreshold(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date d&apos;expiration</label>
              <Input type="date" value={addExpiry} onChange={(e) => setAddExpiry(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddModal(false); setEditingStock(null); }}>Annuler</Button>
            <Button onClick={editingStock ? () => void handleUpdate() : () => void handleAdd()} disabled={saving}>
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
          <p className="text-sm text-muted-foreground">Cette action est irréversible. Le stock sera supprimé de votre pharmacie.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => void handleDelete()}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={(v) => { if (!v) setShowHistoryModal(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Historique — {historyMedName}</DialogTitle>
          </DialogHeader>
          {historyItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun mouvement enregistré</p>
          ) : (
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {historyItems.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
                  <div>
                    <span className={cn("font-semibold", h.changeType === "ADD" ? "text-green-600" : "text-red-600")}>
                      {h.changeType === "ADD" ? "+" : "-"}{h.quantity}
                    </span>
                    {h.note && <span className="text-muted-foreground ml-1">— {h.note}</span>}
                  </div>
                  <span className="text-muted-foreground">{new Date(h.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryModal(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={(v) => { if (!v) { setShowImportModal(false); setImportResult(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Importer le stock</DialogTitle>
          </DialogHeader>
          {!importResult && !importing && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">📋 Format attendu :</p>
                <ul className="list-inside list-disc space-y-0.5 text-xs">
                  <li><strong>Nom du médicament</strong> (obligatoire) — doit correspondre à un médicament existant</li>
                  <li><strong>Prix (FCFA)</strong> (obligatoire) — nombre entier positif</li>
                  <li><strong>Stock</strong> (obligatoire) — nombre entier positif ou zéro</li>
                  <li><strong>Seuil stock bas</strong> (optionnel) — défaut: 10</li>
                  <li><strong>Date d&apos;expiration</strong> (optionnelle) — format JJ/MM/AAAA ou AAAA-MM-JJ</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" /> Télécharger un modèle Excel
                </Button>
                <Button variant="default" onClick={() => fileInputRef.current?.click()} className="gap-1.5 text-xs">
                  <Upload className="h-4 w-4" /> Sélectionner un fichier Excel
                </Button>
              </div>
            </div>
          )}
          {importing && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Import en cours...</p>
            </div>
          )}
          {importResult && !importing && (
            <div className="space-y-3">
              {importResult.success ? (
                <>
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-green-700">Import terminé avec succès !</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-green-50 p-2">
                      <p className="text-lg font-bold text-green-700">{importResult.details?.totalRows || 0}</p>
                      <p className="text-green-600">Lignes lues</p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-2">
                      <p className="text-lg font-bold text-primary">{importResult.details?.imported || 0}</p>
                      <p className="text-primary/80">Importées</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <XCircle className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-red-700">Échec de l&apos;import</p>
                </div>
              )}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-2">
                  <p className="mb-1 text-xs font-semibold text-amber-800">Détails des erreurs :</p>
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-[11px] text-amber-700 leading-relaxed">• {err}</p>
                  ))}
                </div>
              )}
              <Button variant="outline" onClick={() => { setShowImportModal(false); setImportResult(null); }} className="w-full text-xs">Fermer</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
