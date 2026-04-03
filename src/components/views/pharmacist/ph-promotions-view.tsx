'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Tag,
  Plus,
  Trash2,
  Calendar,
  Percent,
  Gift,
  Award,
  ChevronDown,
  ChevronUp,
  Package,
  Clock,
  Loader2,
  AlertTriangle,
  Pill,
  Pencil,
  Lock,
} from 'lucide-react';

import { ViewHeader } from '@/components/view-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

// ── Types ──────────────────────────────────────────────────────
interface MedicationOption {
  id: string;
  name: string;
  commercialName: string;
}

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  medication: MedicationOption | null;
  medicationId?: string | null;
}

// ── Animation ──────────────────────────────────────────────────
const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ── Helpers ────────────────────────────────────────────────────
function getPromotionStatus(startDate: string, endDate: string): 'active' | 'expired' | 'upcoming' {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now < start) return 'upcoming';
  if (now > end) return 'expired';
  return 'active';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusConfig(status: 'active' | 'expired' | 'upcoming') {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'expired':
      return {
        label: 'Expirée',
        className: 'bg-gray-100 text-gray-500 border-gray-200',
        dot: 'bg-gray-400',
      };
    case 'upcoming':
      return {
        label: 'À venir',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
      };
  }
}

// ── Component ──────────────────────────────────────────────────
export function PharmacistPromotionsView() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);

  // Form state
  const [medications, setMedications] = useState<MedicationOption[]>([]);
  const [medSearchQuery, setMedSearchQuery] = useState('');
  const [medSearchLoading, setMedSearchLoading] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationOption | null>(null);
  const [promoName, setPromoName] = useState('');
  const [promoDescription, setPromoDescription] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const [editMedications, setEditMedications] = useState<MedicationOption[]>([]);
  const [editMedSearchQuery, setEditMedSearchQuery] = useState('');
  const [editMedSearchLoading, setEditMedSearchLoading] = useState(false);
  const [editSelectedMedication, setEditSelectedMedication] = useState<MedicationOption | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDiscountValue, setEditDiscountValue] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const editSearchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Fetch promotions ────────────────────────────────────────
  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/pharmacist/promotions?active=true');
      if (!res.ok) throw new Error('Erreur lors du chargement des promotions');
      const data = await res.json();
      setPromotions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  // ── Medication search ───────────────────────────────────────
  useEffect(() => {
    if (medSearchQuery.length < 2) {
      setMedications([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setMedSearchLoading(true);
        const res = await fetch(`/api/medications?q=${encodeURIComponent(medSearchQuery)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setMedications(
            (Array.isArray(data) ? data : []).map((m: { id: string; name: string; commercialName: string }) => ({
              id: m.id,
              name: m.name,
              commercialName: m.commercialName,
            }))
          );
        }
      } catch {
        // ignore
      } finally {
        setMedSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [medSearchQuery]);

  const handleSelectMedication = (med: MedicationOption) => {
    setSelectedMedication(med);
    setMedSearchQuery('');
    setMedications([]);
  };

  const resetForm = () => {
    setMedSearchQuery('');
    setMedications([]);
    setSelectedMedication(null);
    setPromoName('');
    setPromoDescription('');
    setDiscountValue('');
    setStartDate('');
    setEndDate('');
  };

  const handleCreate = async () => {
    if (!promoName.trim()) {
      toast.error('Veuillez saisir le nom de la promotion');
      return;
    }
    if (!discountValue || Number(discountValue) < 1 || Number(discountValue) > 100) {
      toast.error('Le pourcentage doit être entre 1 et 100');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Veuillez saisir les dates de début et de fin');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/pharmacist/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationId: selectedMedication?.id || null,
          name: promoName.trim(),
          description: promoDescription.trim() || null,
          discountType: 'percentage',
          discountValue: Number(discountValue),
          startDate,
          endDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }

      toast.success('Promotion créée avec succès !');
      resetForm();
      setFormOpen(false);
      fetchPromotions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur serveur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/pharmacist/promotions?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      toast.success('Promotion supprimée');
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur serveur');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Edit promotion ─────────────────────────────────────────
  const openEditDialog = (promo: Promotion) => {
    setEditPromo(promo);
    setEditName(promo.name);
    setEditDescription(promo.description || '');
    setEditDiscountValue(String(promo.discountValue));
    setEditStartDate(promo.startDate.split('T')[0]);
    setEditEndDate(promo.endDate.split('T')[0]);
    setEditSelectedMedication(promo.medication || null);
    setEditMedSearchQuery('');
    setEditMedications([]);
    setEditOpen(true);
  };

  // Edit medication search
  useEffect(() => {
    if (!editOpen || editMedSearchQuery.length < 2) {
      setEditMedications([]);
      return;
    }

    if (editSearchTimeoutRef.current) clearTimeout(editSearchTimeoutRef.current);

    editSearchTimeoutRef.current = setTimeout(async () => {
      try {
        setEditMedSearchLoading(true);
        const res = await fetch(`/api/medications?q=${encodeURIComponent(editMedSearchQuery)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setEditMedications(
            (Array.isArray(data) ? data : []).map((m: { id: string; name: string; commercialName: string }) => ({
              id: m.id,
              name: m.name,
              commercialName: m.commercialName,
            }))
          );
        }
      } catch {
        // ignore
      } finally {
        setEditMedSearchLoading(false);
      }
    }, 300);

    return () => {
      if (editSearchTimeoutRef.current) clearTimeout(editSearchTimeoutRef.current);
    };
  }, [editOpen, editMedSearchQuery]);

  const handleEditSelectMedication = (med: MedicationOption) => {
    setEditSelectedMedication(med);
    setEditMedSearchQuery('');
    setEditMedications([]);
  };

  const handleEdit = async () => {
    if (!editPromo) return;
    if (!editName.trim()) {
      toast.error('Veuillez saisir le nom de la promotion');
      return;
    }
    if (!editDiscountValue || Number(editDiscountValue) < 1 || Number(editDiscountValue) > 100) {
      toast.error('Le pourcentage doit être entre 1 et 100');
      return;
    }
    if (!editStartDate || !editEndDate) {
      toast.error('Veuillez saisir les dates de début et de fin');
      return;
    }
    if (new Date(editEndDate) <= new Date(editStartDate)) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    try {
      setEditSubmitting(true);
      const res = await fetch('/api/pharmacist/promotions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editPromo.id,
          medicationId: editSelectedMedication?.id || null,
          name: editName.trim(),
          description: editDescription.trim() || null,
          discountType: 'percentage',
          discountValue: Number(editDiscountValue),
          startDate: editStartDate,
          endDate: editEndDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la modification');
      }

      toast.success('Promotion modifiée avec succès !');
      setEditOpen(false);
      fetchPromotions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur serveur');
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 pb-24 space-y-5">
      <ViewHeader
        title="Promotions & Fidélisation"
        back
        icon={<Tag className="h-5 w-5 text-emerald-600" />}
      />

      {/* ── Section: Créer une promotion ─────────────────── */}
      <motion.div {...fadeInUp} transition={{ duration: 0.3 }}>
        <Card className="border-emerald-100 overflow-hidden">
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-emerald-50/50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100">
                <Plus className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="font-semibold text-sm text-foreground">
                Créer une promotion
              </span>
            </div>
            {formOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence>
            {formOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <CardContent className="pt-0 pb-4 space-y-4">
                  {/* Medication search */}
                  <div className="space-y-1.5" ref={dropdownRef}>
                    <Label className="text-xs font-medium">
                      Médicament (optionnel)
                    </Label>
                    {selectedMedication ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                        <Pill className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-sm font-medium flex-1 truncate">
                          {selectedMedication.commercialName || selectedMedication.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                          onClick={() => setSelectedMedication(null)}
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Input
                          placeholder="Rechercher un médicament..."
                          value={medSearchQuery}
                          onChange={(e) => setMedSearchQuery(e.target.value)}
                          className="h-11 text-sm"
                        />
                        <AnimatePresence>
                          {medications.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden border border-emerald-100 rounded-lg max-h-40 overflow-y-auto"
                            >
                              {medications.map((med) => (
                                <button
                                  key={med.id}
                                  onClick={() => handleSelectMedication(med)}
                                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm transition-colors border-b border-emerald-50 last:border-0"
                                >
                                  {med.commercialName || med.name}
                                  {med.commercialName && med.commercialName !== med.name && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      ({med.name})
                                    </span>
                                  )}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {medSearchLoading && medSearchQuery.length >= 2 && (
                          <div className="flex items-center gap-1.5 py-1 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Recherche...
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Promo name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Nom de la promotion
                    </Label>
                    <Input
                      placeholder="Ex: Promo de printemps"
                      value={promoName}
                      onChange={(e) => setPromoName(e.target.value)}
                      className="h-11 text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Description
                    </Label>
                    <Textarea
                      placeholder="Décrivez votre promotion..."
                      value={promoDescription}
                      onChange={(e) => setPromoDescription(e.target.value)}
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>

                  {/* Discount */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Valeur de la remise
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        placeholder="Ex: 20"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="h-11 text-sm pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Date de début
                      </Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-11 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Date de fin
                      </Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-11 text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreate}
                    disabled={submitting}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Création...
                      </span>
                    ) : (
                      'Créer la promotion'
                    )}
                  </Button>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* ── Section: Promotions actives ──────────────────── */}
      <motion.div {...fadeInUp} transition={{ duration: 0.3, delay: 0.1 }}>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-emerald-600" />
          <h2 className="font-semibold text-sm text-foreground">
            Promotions actives
          </h2>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[11px] px-2 py-0">
            {promotions.length}
          </Badge>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        )}

        {error && !loading && (
          <Card className="border-red-200">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-700">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-red-200 text-red-600 hover:bg-red-50"
                onClick={fetchPromotions}
              >
                Réessayer
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && promotions.length === 0 && (
          <Card className="border-dashed border-emerald-200">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Package className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Aucune promotion active pour le moment.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Créez votre première promotion ci-dessus !
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && promotions.length > 0 && (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {promotions.map((promo) => {
                const status = getPromotionStatus(promo.startDate, promo.endDate);
                const statusCfg = getStatusConfig(status);
                const medLabel = promo.medication
                  ? promo.medication.commercialName || promo.medication.name
                  : null;
                return (
                  <motion.div
                    key={promo.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -60, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.25 }}
                  >
                    <Card className="border-emerald-100 relative overflow-hidden">
                      {/* Discount ribbon */}
                      <div className="absolute top-0 right-0">
                        <Badge className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-none rounded-bl-lg border-0">
                          <Percent className="h-3 w-3 mr-0.5" />
                          -{promo.discountValue}%
                        </Badge>
                      </div>

                      <CardContent className="p-4">
                        <div className="pr-16">
                          <h3 className="font-semibold text-sm text-foreground truncate">
                            {promo.name}
                          </h3>
                          {medLabel && (
                            <p className="text-xs text-emerald-600 mt-0.5 truncate flex items-center gap-1">
                              <Pill className="h-3 w-3 flex-shrink-0" />
                              {medLabel}
                            </p>
                          )}
                          {promo.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {promo.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {formatDate(promo.startDate)} – {formatDate(promo.endDate)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${statusCfg.dot}`} />
                            <Badge
                              variant="outline"
                              className={`text-[11px] px-2 py-0 border ${statusCfg.className}`}
                            >
                              {statusCfg.label}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(promo)}
                              className="h-8 px-2 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(promo.id)}
                              disabled={deletingId === promo.id}
                              className="h-8 px-2 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                            >
                              {deletingId === promo.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ── Section: Programme de fidélité ────────────────── */}
      <motion.div {...fadeInUp} transition={{ duration: 0.3, delay: 0.2 }} className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="h-4 w-4 text-emerald-600" />
          <h2 className="font-semibold text-sm text-foreground">
            Programme de fidélité
          </h2>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[11px] px-2 py-0 border-amber-200">
            Bientôt disponible
          </Badge>
        </div>

        <Collapsible open={loyaltyOpen} onOpenChange={setLoyaltyOpen}>
          <Card className="border-emerald-200 overflow-hidden">
            <CollapsibleTrigger className="w-full">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">PharmApp Fidélité</h3>
                      <Lock className="h-3.5 w-3.5 text-emerald-200" />
                    </div>
                    <p className="text-emerald-100 text-xs">Gagnez des points à chaque achat</p>
                  </div>
                  {loyaltyOpen ? (
                    <ChevronUp className="h-5 w-5 text-white/70" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-white/70" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <Lock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Programme de fidélité
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      Les données seront disponibles après l'intégration complète. Ce programme permettra à vos clients de cumuler des points échangeables contre des réductions et des récompenses.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Offrez à vos clients un programme de fidélité personnalisé. Chaque achat leur permettra de cumuler
                  des points échangeables contre des réductions, des produits offerts ou des services gratuits.
                  Augmentez la rétention et fidélisez votre clientèle.
                </p>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>

      {/* ── Edit Promotion Dialog ────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) setEditOpen(false); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-emerald-600" />
              Modifier la promotion
            </DialogTitle>
            <DialogDescription>
              Modifiez les informations de votre promotion.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Edit: Medication search */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Médicament (optionnel)</Label>
              {editSelectedMedication ? (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <Pill className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-medium flex-1 truncate">
                    {editSelectedMedication.commercialName || editSelectedMedication.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                    onClick={() => setEditSelectedMedication(null)}
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Rechercher un médicament..."
                    value={editMedSearchQuery}
                    onChange={(e) => setEditMedSearchQuery(e.target.value)}
                    className="h-11 text-sm"
                  />
                  <AnimatePresence>
                    {editMedications.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border border-emerald-100 rounded-lg max-h-40 overflow-y-auto"
                      >
                        {editMedications.map((med) => (
                          <button
                            key={med.id}
                            onClick={() => handleEditSelectMedication(med)}
                            className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm transition-colors border-b border-emerald-50 last:border-0"
                          >
                            {med.commercialName || med.name}
                            {med.commercialName && med.commercialName !== med.name && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({med.name})
                              </span>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {editMedSearchLoading && editMedSearchQuery.length >= 2 && (
                    <div className="flex items-center gap-1.5 py-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Recherche...
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Edit: Promo name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nom de la promotion</Label>
              <Input
                placeholder="Ex: Promo de printemps"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-11 text-sm"
              />
            </div>

            {/* Edit: Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea
                placeholder="Décrivez votre promotion..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            {/* Edit: Discount */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Valeur de la remise</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="Ex: 20"
                  value={editDiscountValue}
                  onChange={(e) => setEditDiscountValue(e.target.value)}
                  className="h-11 text-sm pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  %
                </span>
              </div>
            </div>

            {/* Edit: Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date de début</Label>
                <Input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="h-11 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date de fin</Label>
                <Input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="h-11 text-sm"
                />
              </div>
            </div>

            <Button
              onClick={handleEdit}
              disabled={editSubmitting}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
            >
              {editSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Modification...
                </span>
              ) : (
                'Enregistrer les modifications'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
