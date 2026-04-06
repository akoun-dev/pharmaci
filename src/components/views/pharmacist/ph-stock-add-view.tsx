'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pill,
  Search,
  AlertCircle,
  Package,
  FileText,
  CheckCircle2,
  X,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewHeader } from '@/components/view-header';
import { PharmacistPageHeader } from '@/components/views/pharmacist/ph-page-header';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';

interface MedicationOption {
  id: string;
  name: string;
  commercialName: string;
  category?: string | null;
  form?: string | null;
  description?: string | null;
  activePrinciple?: string | null;
  availablePharmacyCount?: number;
}

export function PharmacistStockAddView() {
  const { currentUser, goBack, setCurrentView } = useAppStore();
  const pharmacyId = currentUser?.linkedPharmacyId;

  const [searchQuery, setSearchQuery] = useState('');
  const [medications, setMedications] = useState<MedicationOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [inStock, setInStock] = useState(true);
  const [needsPrescription, setNeedsPrescription] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const searchMedications = useCallback(async (query: string) => {
    if (query.length < 2) {
      setMedications([]);
      return;
    }

    try {
      setSearchLoading(true);
      const res = await fetch(`/api/medications?q=${encodeURIComponent(query)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setMedications(Array.isArray(data) ? data : []);
        setShowDropdown(Array.isArray(data) && data.length > 0);
      }
    } catch {
      // Non-critical
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchMedications(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchMedications]);

  const handleSelectMedication = (med: MedicationOption) => {
    setSelectedMedication(med);
    setSearchQuery('');
    setMedications([]);
    setShowDropdown(false);
  };

  const handleClearMedication = () => {
    setSelectedMedication(null);
  };

  const handleSubmit = async () => {
    if (!pharmacyId) {
      toast.error('Aucune pharmacie associée à votre compte');
      return;
    }

    if (!selectedMedication) {
      toast.error('Veuillez sélectionner un médicament');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error('Le prix doit être un nombre positif');
      return;
    }

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      toast.error('La quantité doit être un entier positif');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/pharmacist/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationId: selectedMedication.id,
          price: parsedPrice,
          quantity: parsedQuantity,
          inStock,
          needsPrescription,
          expirationDate: expirationDate || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'ajout");
      }

      toast.success(`${selectedMedication.commercialName || selectedMedication.name} ajouté au stock`);
      setCurrentView('ph-stock-list');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur serveur');
    } finally {
      setSubmitting(false);
    }
  };

  const clearAll = () => {
    setSelectedMedication(null);
    setSearchQuery('');
    setMedications([]);
    setShowDropdown(false);
    setPrice('');
    setQuantity('');
    setExpirationDate('');
    setInStock(true);
    setNeedsPrescription(false);
  };

  const isFormValid = selectedMedication && price && quantity;

  return (
    <div className="pb-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <PharmacistPageHeader
          title="Ajouter au stock"
          description="Ajoutez une référence à votre stock, rattachez-la au bon médicament et définissez ses informations de vente."
          icon={<Package className="h-5 w-5" />}
          action={
            <Button
              variant="ghost"
              size="sm"
              className="h-10 rounded-2xl bg-white px-4 text-amber-700 hover:bg-amber-50"
              onClick={() => setCurrentView('ph-stock-list')}
            >
              Retour
            </Button>
          }
        />

        {!pharmacyId ? (
          <Card className="border-red-200">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700">Aucune pharmacie associée</p>
              <p className="text-xs text-muted-foreground mt-1">
                Votre compte n&apos;est lié à aucune pharmacie
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* ── Step 1: Select medication ── */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedMedication ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
                  {selectedMedication ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                </div>
                <h3 className="text-sm font-semibold">Médicament</h3>
              </div>

              <Card className={`border-orange-100 overflow-visible ${selectedMedication ? 'border-orange-300 bg-orange-50/30' : ''}`}>
                <CardContent className="p-4">
                  {selectedMedication ? (
                    /* Selected medication card */
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                          <Pill className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">
                            {selectedMedication.commercialName || selectedMedication.name}
                          </p>
                          {selectedMedication.commercialName && selectedMedication.commercialName !== selectedMedication.name && (
                            <p className="text-xs text-muted-foreground truncate">{selectedMedication.name}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {selectedMedication.category && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {selectedMedication.category}
                              </Badge>
                            )}
                            {selectedMedication.form && (
                              <span className="text-[11px] text-muted-foreground">{selectedMedication.form}</span>
                            )}
                            {selectedMedication.activePrinciple && (
                              <span className="text-[11px] text-muted-foreground">· {selectedMedication.activePrinciple}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-red-600 h-7 px-2 shrink-0"
                          onClick={handleClearMedication}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Changer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Medication search */
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Recherchez le médicament à ajouter dans votre stock
                      </p>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Ex: Paracétamol, Doliprane, Amoxicilline..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => {
                            if (medications.length > 0) setShowDropdown(true);
                          }}
                          className="pl-9 pr-9 h-11 border-orange-200 focus:border-orange-400 bg-orange-50/30"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => { setSearchQuery(''); setMedications([]); setShowDropdown(false); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Search results dropdown */}
                      <AnimatePresence>
                        {showDropdown && medications.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-50 left-4 right-4 sm:left-6 sm:right-6 mt-1"
                          >
                            <div className="border border-orange-200 rounded-xl bg-white shadow-lg max-h-64 overflow-y-auto divide-y divide-orange-50">
                              {medications.map((med) => {
                                const medDisplayName = med.commercialName || med.name;
                                const genericName = med.commercialName ? med.name : null;

                                return (
                                  <button
                                    key={med.id}
                                    onClick={() => handleSelectMedication(med)}
                                    className="w-full text-left px-3 py-3 hover:bg-orange-50 transition-colors flex items-center gap-2.5"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                      <Pill className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium truncate">{medDisplayName}</p>
                                      {genericName && genericName !== medDisplayName && (
                                        <p className="text-[11px] text-muted-foreground truncate">{genericName}</p>
                                      )}
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        {med.category && (
                                          <span className="text-[10px] text-orange-600">{med.category}</span>
                                        )}
                                        {med.form && (
                                          <span className="text-[10px] text-muted-foreground">· {med.form}</span>
                                        )}
                                      </div>
                                    </div>
                                    <Plus className="h-4 w-4 text-orange-400 shrink-0" />
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Search loading */}
                      {searchLoading && searchQuery.length >= 2 && (
                        <div className="space-y-2 py-2">
                          <Skeleton className="h-12 rounded-lg" />
                          <Skeleton className="h-12 rounded-lg" />
                        </div>
                      )}

                      {/* No results */}
                      {!searchLoading && searchQuery.length >= 2 && medications.length === 0 && !showDropdown && (
                        <div className="text-center py-3">
                          <p className="text-xs text-muted-foreground">
                            Aucun médicament trouvé pour &quot;{searchQuery}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Step 2: Stock details ── */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isFormValid ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
                  2
                </div>
                <h3 className="text-sm font-semibold">Détails du stock</h3>
              </div>

              <Card className={`border-orange-100 transition-opacity ${!selectedMedication ? 'opacity-50 pointer-events-none' : ''}`}>
                <CardContent className="p-4 space-y-4">
                  {/* Price */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      Prix unitaire
                      <span className="text-orange-600 font-semibold">(obligatoire)</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Ex: 2500"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="h-11 border-orange-200 focus:border-orange-400 text-sm pr-14"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                        FCFA
                      </span>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      Quantité
                      <span className="text-orange-600 font-semibold">(obligatoire)</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Ex: 50"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="h-11 border-orange-200 focus:border-orange-400 text-sm pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                        unités
                      </span>
                    </div>
                  </div>

                  {/* Expiration date */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Date d&apos;expiration
                    </Label>
                    <Input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="h-11 border-orange-200 focus:border-orange-400 text-sm"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                          <Package className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">En stock</Label>
                          <p className="text-[11px] text-muted-foreground">Visible comme disponible</p>
                        </div>
                      </div>
                      <Switch checked={inStock} onCheckedChange={setInStock} />
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Sur ordonnance</Label>
                          <p className="text-[11px] text-muted-foreground">Ordonnance requise</p>
                        </div>
                      </div>
                      <Switch checked={needsPrescription} onCheckedChange={setNeedsPrescription} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Info banner when no medication selected ── */}
            {!selectedMedication && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3"
              >
                <ChevronDown className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 rotate-180" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>Étape 1 :</strong> Recherchez et sélectionnez un médicament ci-dessus pour remplir les détails du stock.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Fixed Submit Button ── */}
      {pharmacyId && (
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 left-0 right-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-orange-200 shadow-lg">
                <CardContent className="p-3 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={clearAll}
                    disabled={submitting}
                    className="h-11 border-gray-200 text-muted-foreground hover:bg-gray-50 hover:text-foreground px-4"
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Effacer
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!isFormValid || submitting}
                    className="flex-1 h-11 bg-orange-600 hover:bg-orange-700 text-white text-sm disabled:opacity-40"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Ajout en cours...</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-2" />Ajouter au stock</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
