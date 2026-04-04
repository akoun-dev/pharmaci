'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  Search,
  Plus,
  Eye,
  Pill,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  Clock,
  FileText,
  Activity,
  Package,
  Building2,
  Loader2,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ViewHeader } from '@/components/view-header';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

interface MedicationData {
  id: string;
  name: string;
  commercialName: string;
  activePrinciple: string;
  pathology: string;
  category: string;
  form: string;
  needsPrescription: boolean;
  description: string;
  dosage: string;
  sideEffects: string;
  createdAt: string;
  pharmacyCount: number;
  orderCount: number;
  alternativeCount: number;
  genericCount: number;
}

interface PharmacyStock {
  pharmacyId: string;
  pharmacyName: string;
  pharmacyCity: string;
  quantity: number;
  price: number;
  inStock: boolean;
}

interface ApiResponse {
  items: MedicationData[];
  total: number;
  categories: string[];
}

type PrescriptionFilter = 'all' | 'yes' | 'no';

// ── Config ─────────────────────────────────────────────────────────────────

const FORM_LABELS: Record<string, string> = {
  comprime: 'Comprimé',
  gelule: 'Gélule',
  aerosol: 'Aérosol',
  sirop: 'Sirop',
  suppositoire: 'Suppositoire',
  crème: 'Crème',
  pommade: 'Pommade',
  injectable: 'Injectable',
  gouttes: 'Gouttes',
  patch: 'Patch',
  sachet: 'Sachet',
  solution: 'Solution buvable',
};

function getFormLabel(form: string): string {
  if (!form) return '';
  const lower = form.toLowerCase();
  return FORM_LABELS[lower] || form;
}

const CATEGORY_COLORS: Record<string, string> = {
  antalgique: 'bg-rose-100 text-rose-700 border-rose-200',
  antibiotique: 'bg-amber-100 text-amber-700 border-amber-200',
  antiinflammatoire: 'bg-orange-100 text-orange-700 border-orange-200',
  antihypertenseur: 'bg-sky-100 text-sky-700 border-sky-200',
  antidiabetique: 'bg-teal-100 text-teal-700 border-teal-200',
  antiseptique: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  vitamin: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  antihistaminique: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  antispasmodique: 'bg-purple-100 text-purple-700 border-purple-200',
  expectorant: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

function getCategoryColor(category: string): string {
  if (!category) return 'bg-gray-100 text-gray-700 border-gray-200';
  const lower = category.toLowerCase().replace(/[\s-]/g, '');
  for (const [key, value] of Object.entries(CATEGORY_COLORS)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }
  return 'bg-violet-100 text-violet-700 border-violet-200';
}

const PRESCRIPTION_TABS: { key: PrescriptionFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'yes', label: 'Ordonnance' },
  { key: 'no', label: 'Libre' },
];

const PAGE_SIZE = 20;

const MEDICATION_FORMS = [
  'Comprimé',
  'Gélule',
  'Aérosol',
  'Sirop',
  'Suppositoire',
  'Crème',
  'Pommade',
  'Injectable',
  'Gouttes',
  'Patch',
  'Sachet',
  'Solution buvable',
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `il y a ${diffMin}min`;
    if (diffH < 24) return `il y a ${diffH}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

function formatDateFull(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ── Create medication defaults ────────────────────────────────────────────

interface CreateForm {
  name: string;
  commercialName: string;
  activePrinciple: string;
  category: string;
  form: string;
  needsPrescription: boolean;
  description: string;
  dosage: string;
  sideEffects: string;
  pathology: string;
}

const EMPTY_FORM: CreateForm = {
  name: '',
  commercialName: '',
  activePrinciple: '',
  category: '',
  form: '',
  needsPrescription: false,
  description: '',
  dosage: '',
  sideEffects: '',
  pathology: '',
};

// ── Component ──────────────────────────────────────────────────────────────

export function AdminMedicationsView() {
  // ── State ──
  const [medications, setMedications] = useState<MedicationData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePrescription, setActivePrescription] = useState<PrescriptionFilter>('all');

  // Pagination
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Detail dialog
  const [selectedMed, setSelectedMed] = useState<MedicationData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pharmacyStocks, setPharmacyStocks] = useState<PharmacyStock[]>([]);
  const [stocksLoading, setStocksLoading] = useState(false);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  // ── Fetch medications ──
  const fetchMedications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((currentPage - 1) * PAGE_SIZE),
      });

      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }
      if (activeCategory !== 'all') {
        params.set('category', activeCategory);
      }
      if (activePrescription !== 'all') {
        params.set('needsPrescription', activePrescription === 'yes' ? 'true' : 'false');
      }

      const res = await fetch(`/api/admin/medications?${params}`);
      if (!res.ok) throw new Error('Erreur serveur');
      const data: ApiResponse = await res.json();

      setMedications(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total || 0);
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch {
      setError('Impossible de charger les médicaments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchQuery, activeCategory, activePrescription]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  // Reset to page 1 when filters change (except page)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, activePrescription]);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    fetchMedications();
  };

  // ── Pagination helpers ──
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // ── Detail dialog ──
  const handleMedClick = async (med: MedicationData) => {
    setSelectedMed(med);
    setPharmacyStocks([]);
    setDetailOpen(true);

    // Fetch pharmacy stocks for this medication
    try {
      setStocksLoading(true);
      const res = await fetch(`/api/admin/medications/${med.id}/stocks`);
      if (res.ok) {
        const data = await res.json();
        setPharmacyStocks(Array.isArray(data.stocks) ? data.stocks : []);
      }
    } catch {
      // silently fail - stocks are optional info
    } finally {
      setStocksLoading(false);
    }
  };

  // ── Create medication ──
  const handleCreateOpen = () => {
    setCreateForm(EMPTY_FORM);
    setCreateOpen(true);
  };

  const handleCreateSubmit = async () => {
    // Validation
    if (!createForm.name.trim()) {
      toast.error('Le nom générique est requis');
      return;
    }
    if (!createForm.commercialName.trim()) {
      toast.error('Le nom commercial est requis');
      return;
    }

    try {
      setCreating(true);
      const res = await fetch('/api/admin/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name.trim(),
          commercialName: createForm.commercialName.trim(),
          activePrinciple: createForm.activePrinciple.trim(),
          category: createForm.category.trim() || undefined,
          form: createForm.form || undefined,
          needsPrescription: createForm.needsPrescription,
          description: createForm.description.trim() || undefined,
          dosage: createForm.dosage.trim() || undefined,
          sideEffects: createForm.sideEffects.trim() || undefined,
          pathology: createForm.pathology.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur de création');
      }

      toast.success('Médicament créé avec succès');
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      fetchMedications();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur serveur';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-24 flex-shrink-0 rounded-full" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
        <ViewHeader
          title="Gestion des médicaments"
          icon={<FlaskConical className="h-5 w-5 text-violet-600" />}
        />
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Erreur de chargement</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 pb-28">
      {/* ── Header ── */}
      <ViewHeader
        title="Gestion des médicaments"
        icon={<FlaskConical className="h-5 w-5 text-violet-600" />}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700">
              {total}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-violet-600"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              className="h-8 px-3 bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleCreateOpen}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="text-xs">Créer</span>
            </Button>
          </div>
        }
      />

      {/* ── Search bar ── */}
      <div className="space-y-2 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, nom commercial, principe actif..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm border-violet-200 focus:border-violet-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Category filter pills ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
            activeCategory === 'all'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
          }`}
        >
          Toutes
          <span
            className={`text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 ${
              activeCategory === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-violet-100 text-violet-600'
            }`}
          >
            {total}
          </span>
        </button>
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(isActive ? 'all' : cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                isActive
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── Prescription filter tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-none">
        {PRESCRIPTION_TABS.map((tab) => {
          const isActive = activePrescription === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActivePrescription(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                isActive
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.key === 'yes' && (
                <ShieldAlertIcon className="h-3.5 w-3.5" />
              )}
              {tab.key === 'no' && (
                <ShieldCheckIcon className="h-3.5 w-3.5" />
              )}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Medications list ── */}
      {medications.length === 0 ? (
        <Card className="border-violet-100">
          <CardContent className="p-8 text-center">
            <Inbox className="h-10 w-10 text-violet-300 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Aucun médicament</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || activeCategory !== 'all' || activePrescription !== 'all'
                ? 'Aucun résultat pour les filtres sélectionnés'
                : 'Les médicaments ajoutés apparaîtront ici'}
            </p>
            {searchQuery || activeCategory !== 'all' || activePrescription !== 'all' ? (
              <Button
                variant="outline"
                className="mt-3 border-violet-200 text-violet-700 hover:bg-violet-50 text-xs"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                  setActivePrescription('all');
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Effacer les filtres
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-${activePrescription}-${currentPage}-${searchQuery}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {medications.map((med, index) => (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className="border-violet-100 overflow-hidden cursor-pointer hover:border-violet-300 transition-colors active:scale-[0.99] duration-150"
                  onClick={() => handleMedClick(med)}
                >
                  <CardContent className="p-4 space-y-2.5">
                    {/* Top row: Commercial name + Prescription badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">
                          {med.commercialName || med.name}
                        </p>
                        {med.name !== med.commercialName && (
                          <p className="text-xs text-muted-foreground truncate">
                            {med.name}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 flex-shrink-0 border-0 ${
                          med.needsPrescription
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {med.needsPrescription ? (
                          <ShieldAlertIcon className="h-3 w-3 mr-0.5" />
                        ) : (
                          <ShieldCheckIcon className="h-3 w-3 mr-0.5" />
                        )}
                        {med.needsPrescription ? 'Ordonnance' : 'Libre'}
                      </Badge>
                    </div>

                    {/* Category + Form badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {med.category && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0 ${getCategoryColor(med.category)}`}
                        >
                          {med.category}
                        </Badge>
                      )}
                      {med.form && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0 border-gray-200 text-gray-600"
                        >
                          <Pill className="h-2.5 w-2.5 mr-0.5" />
                          {getFormLabel(med.form)}
                        </Badge>
                      )}
                    </div>

                    {/* Active principle */}
                    {med.activePrinciple && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Activity className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{med.activePrinciple}</span>
                      </div>
                    )}

                    {/* Pathology */}
                    {med.pathology && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{med.pathology}</span>
                      </div>
                    )}

                    {/* Footer: Stats + Date */}
                    <div className="border-t border-violet-100/80 flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {med.pharmacyCount} pharmacie{med.pharmacyCount > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {med.orderCount} commande{med.orderCount > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelativeTime(med.createdAt)}
                        </span>
                        <Eye className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-40"
            disabled={!hasPrev}
            onClick={() => goToPage(1)}
            aria-label="Première page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-40"
            disabled={!hasPrev}
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 mx-2">
            {(() => {
              const pages: (number | string)[] = [];
              const start = Math.max(1, currentPage - 2);
              const end = Math.min(totalPages, currentPage + 2);

              if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push('...');
              }
              for (let i = start; i <= end; i++) {
                pages.push(i);
              }
              if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...');
                pages.push(totalPages);
              }
              return pages.map((page, idx) =>
                typeof page === 'string' ? (
                  <span
                    key={`dots-${idx}`}
                    className="text-xs text-muted-foreground px-1"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`h-9 w-9 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'hover:bg-violet-50 text-violet-700'
                    }`}
                  >
                    {page}
                  </button>
                )
              );
            })()}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-40"
            disabled={!hasNext}
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-40"
            disabled={!hasNext}
            onClick={() => goToPage(totalPages)}
            aria-label="Dernière page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── Page info ── */}
      {total > 0 && (
        <p className="text-center text-[11px] text-muted-foreground mt-2">
          {(currentPage - 1) * PAGE_SIZE + 1}–
          {Math.min(currentPage * PAGE_SIZE, total)} sur {total} médicaments
        </p>
      )}

      {/* ── Medication Detail Dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        {selectedMed && (
          <DialogContent className="sm:max-w-lg mx-auto p-0 gap-0 overflow-hidden rounded-2xl border-violet-200 max-h-[90dvh] flex flex-col">
            {/* Dialog header */}
            <DialogHeader className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 text-white shrink-0">
              <DialogTitle className="text-base flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                {selectedMed.commercialName || selectedMed.name}
              </DialogTitle>
              <DialogDescription className="text-violet-200 text-xs mt-1">
                Fiche détaillée du médicament
              </DialogDescription>
            </DialogHeader>

            {/* Dialog body - scrollable */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Status badges row */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedMed.category && (
                  <Badge
                    variant="outline"
                    className={`text-[11px] px-2 py-0.5 ${getCategoryColor(selectedMed.category)}`}
                  >
                    {selectedMed.category}
                  </Badge>
                )}
                {selectedMed.form && (
                  <Badge
                    variant="outline"
                    className="text-[11px] px-2 py-0.5 border-gray-200 text-gray-600"
                  >
                    <Pill className="h-3 w-3 mr-0.5" />
                    {getFormLabel(selectedMed.form)}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`text-[11px] px-2 py-0.5 border-0 ${
                    selectedMed.needsPrescription
                      ? 'bg-red-100 text-red-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {selectedMed.needsPrescription ? (
                    <ShieldAlertIcon className="h-3 w-3 mr-0.5" />
                  ) : (
                    <ShieldCheckIcon className="h-3 w-3 mr-0.5" />
                  )}
                  {selectedMed.needsPrescription ? 'Sur ordonnance' : 'Sans ordonnance'}
                </Badge>
              </div>

              <Separator />

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {selectedMed.name !== selectedMed.commercialName && (
                  <div>
                    <p className="text-[11px] text-muted-foreground">Nom générique</p>
                    <p className="text-sm font-medium truncate">{selectedMed.name}</p>
                  </div>
                )}
                {selectedMed.activePrinciple && (
                  <div>
                    <p className="text-[11px] text-muted-foreground">Principe actif</p>
                    <p className="text-sm font-medium truncate flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                      {selectedMed.activePrinciple}
                    </p>
                  </div>
                )}
                {selectedMed.pathology && (
                  <div>
                    <p className="text-[11px] text-muted-foreground">Pathologie(s)</p>
                    <p className="text-sm font-medium truncate flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                      {selectedMed.pathology}
                    </p>
                  </div>
                )}
                {selectedMed.dosage && (
                  <div>
                    <p className="text-[11px] text-muted-foreground">Dosage</p>
                    <p className="text-sm font-medium truncate">{selectedMed.dosage}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedMed.description && (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Description</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm">{selectedMed.description}</p>
                  </div>
                </div>
              )}

              {/* Side effects */}
              {selectedMed.sideEffects && (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Effets secondaires
                  </p>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <p className="text-sm text-amber-900">{selectedMed.sideEffects}</p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Stats */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Statistiques
                </h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Commandes</p>
                      <p className="text-sm font-bold text-violet-700 flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" />
                        {selectedMed.orderCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Pharmacies (stock)</p>
                      <p className="text-sm font-bold text-violet-700 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {selectedMed.pharmacyCount}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[11px] text-muted-foreground">Ajouté le</p>
                      <p className="text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatRelativeTime(selectedMed.createdAt)}
                        {' — '}
                        {formatDateFull(selectedMed.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pharmacy stocks */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Stock par pharmacie
                </h4>
                {stocksLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                  </div>
                ) : pharmacyStocks.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Aucune pharmacie ne propose ce médicament
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pharmacyStocks.map((stock) => (
                      <div
                        key={stock.pharmacyId}
                        className="bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {stock.pharmacyName}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-2.5 w-2.5" />
                            {stock.pharmacyCity}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 border-0 ${
                              stock.inStock
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {stock.inStock ? 'En stock' : 'Rupture'}
                          </Badge>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Qté: {stock.quantity}
                            {stock.price > 0 && (
                              <span className="ml-1">
                                · {stock.price.toLocaleString('fr-FR')} FCFA
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dialog footer */}
            <DialogFooter className="px-5 py-3 border-t border-violet-100 shrink-0">
              <Button
                variant="outline"
                className="w-full border-violet-200 text-violet-700 hover:bg-violet-50"
                onClick={() => setDetailOpen(false)}
              >
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ── Create Medication Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg mx-auto p-0 gap-0 overflow-hidden rounded-2xl border-violet-200 max-h-[90dvh] flex flex-col">
          {/* Dialog header */}
          <DialogHeader className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 text-white shrink-0">
            <DialogTitle className="text-base flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nouveau médicament
            </DialogTitle>
            <DialogDescription className="text-violet-200 text-xs mt-1">
              Ajouter un nouveau médicament au catalogue
            </DialogDescription>
          </DialogHeader>

          {/* Dialog body - scrollable */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Commercial name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Nom commercial <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Ex: Doliprane 500mg"
                value={createForm.commercialName}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, commercialName: e.target.value }))
                }
                className="h-10 text-sm border-violet-200 focus:border-violet-400"
              />
            </div>

            {/* Generic name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Nom générique <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Ex: Paracétamol"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, name: e.target.value }))
                }
                className="h-10 text-sm border-violet-200 focus:border-violet-400"
              />
            </div>

            {/* Active principle + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Principe actif</Label>
                <Input
                  placeholder="Ex: Paracétamol"
                  value={createForm.activePrinciple}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, activePrinciple: e.target.value }))
                  }
                  className="h-10 text-sm border-violet-200 focus:border-violet-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Catégorie</Label>
                <Input
                  placeholder="Ex: Antalgique"
                  value={createForm.category}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, category: e.target.value }))
                  }
                  className="h-10 text-sm border-violet-200 focus:border-violet-400"
                />
              </div>
            </div>

            {/* Form + Pathology */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Forme</Label>
                <Select
                  value={createForm.form}
                  onValueChange={(val) =>
                    setCreateForm((f) => ({ ...f, form: val }))
                  }
                >
                  <SelectTrigger className="h-10 text-sm border-violet-200 w-full">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICATION_FORMS.map((form) => (
                      <SelectItem key={form} value={form}>
                        {form}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Pathologie(s)</Label>
                <Input
                  placeholder="Ex: Douleur, Fièvre"
                  value={createForm.pathology}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, pathology: e.target.value }))
                  }
                  className="h-10 text-sm border-violet-200 focus:border-violet-400"
                />
              </div>
            </div>

            {/* Prescription toggle */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                {createForm.needsPrescription ? (
                  <ShieldAlertIcon className="h-5 w-5 text-red-500" />
                ) : (
                  <ShieldCheckIcon className="h-5 w-5 text-emerald-500" />
                )}
                <div>
                  <p className="text-sm font-medium">Ordonnance requise</p>
                  <p className="text-[11px] text-muted-foreground">
                    {createForm.needsPrescription
                      ? 'Ce médicament nécessite une ordonnance'
                      : 'Disponible sans ordonnance'}
                  </p>
                </div>
              </div>
              <Switch
                checked={createForm.needsPrescription}
                onCheckedChange={(val) =>
                  setCreateForm((f) => ({ ...f, needsPrescription: val }))
                }
              />
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea
                placeholder="Description du médicament..."
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, description: e.target.value }))
                }
                className="text-sm border-violet-200 focus:border-violet-400 min-h-[80px]"
                rows={3}
              />
            </div>

            {/* Dosage */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Dosage</Label>
              <Input
                placeholder="Ex: 500mg, 3 fois/jour"
                value={createForm.dosage}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, dosage: e.target.value }))
                }
                className="h-10 text-sm border-violet-200 focus:border-violet-400"
              />
            </div>

            {/* Side effects */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                Effets secondaires
              </Label>
              <Textarea
                placeholder="Liste des effets secondaires..."
                value={createForm.sideEffects}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, sideEffects: e.target.value }))
                }
                className="text-sm border-violet-200 focus:border-violet-400 min-h-[60px]"
                rows={2}
              />
            </div>
          </div>

          {/* Dialog footer */}
          <DialogFooter className="px-5 py-4 border-t border-violet-100 shrink-0 gap-2">
            <Button
              variant="outline"
              className="border-violet-200 text-violet-700 hover:bg-violet-50"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Annuler
            </Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleCreateSubmit}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1.5" />
              )}
              Créer le médicament
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Inline icon components (to avoid name conflicts) ──────────────────────

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ShieldAlertIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m12 9 0 .01" />
      <path d="m12 12 0 .01" />
    </svg>
  );
}
