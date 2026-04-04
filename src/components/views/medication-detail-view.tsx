'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill,
  FileText,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Shield,
  Clock,
  Info,
  SlidersHorizontal,
  ArrowUpDown,
  ShoppingCart,
  Check,
  Phone,
  X,
  Minus,
  Plus,
  TrendingDown,
  Package,
  Navigation,
  CreditCard,
  Star,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ViewHeader } from '@/components/view-header';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';
import { haversineDistance, formatDistance, openGoogleMaps, PAYMENT_LABELS, PAYMENT_ICONS } from '@/lib/navigation';

interface MedicationDetail {
  id: string;
  name: string;
  commercialName: string;
  activePrinciple?: string;
  pathology?: string;
  category?: string;
  form?: string;
  needsPrescription: boolean;
  description?: string;
  dosage?: string;
  sideEffects?: string;
  genericAlternatives: Alternative[];
  availablePharmacies: AvailablePharmacy[];
}

interface Alternative {
  id: string;
  name: string;
  commercialName: string;
  category?: string;
  form?: string;
}

interface AvailablePharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  district?: string;
  phone: string;
  isGuard: boolean;
  isOpen24h: boolean;
  rating: number;
  latitude: number;
  longitude: number;
  price: number;
  quantity: number;
  stockId: string;
  needsPrescription: boolean;
}

type SortMode = 'price-asc' | 'price-desc' | 'rating' | 'stock' | 'distance';
type FilterCity = string | null;
type FilterGuard = boolean | null;
type PaymentMethod = 'especes' | 'orange_money' | 'wave' | 'mtn_money' | 'carte';

const SORT_OPTIONS: { value: SortMode; label: string; shortLabel: string }[] = [
  { value: 'distance', label: 'Plus proches', shortLabel: 'Proche' },
  { value: 'price-asc', label: 'Prix croissant', shortLabel: 'Prix ↑' },
  { value: 'price-desc', label: 'Prix décroissant', shortLabel: 'Prix ↓' },
  { value: 'rating', label: 'Meilleures notes', shortLabel: 'Notes' },
  { value: 'stock', label: 'Plus de stock', shortLabel: 'Stock' },
];

const PAYMENT_OPTIONS: { value: PaymentMethod | ''; label: string; icon: string }[] = [
  { value: '', label: 'Sur place', icon: '🏪' },
  { value: 'especes', label: 'Espèces', icon: '💵' },
  { value: 'orange_money', label: 'Orange Money', icon: '🟠' },
  { value: 'wave', label: 'Wave', icon: '🌊' },
  { value: 'mtn_money', label: 'MTN Money', icon: '🟡' },
  { value: 'carte', label: 'Carte', icon: '💳' },
];

// Default location: center of Abidjan for demo
const DEFAULT_LAT = 5.3600;
const DEFAULT_LNG = -3.9420;

export function MedicationDetailView() {
  const {
    selectedMedicationId,
    setCurrentView,
    selectPharmacy,
    currentUserId,
    selectOrder,
  } = useAppStore();

  const [medication, setMedication] = useState<MedicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDosage, setShowDosage] = useState(false);
  const [showSideEffects, setShowSideEffects] = useState(false);

  // Filters & sort
  const [sortBy, setSortBy] = useState<SortMode>('distance');
  const [filterCity, setFilterCity] = useState<FilterCity>(null);
  const [filterGuard, setFilterGuard] = useState<FilterGuard>(null);
  const [showFilters, setShowFilters] = useState(false);

  // User location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Order dialog
  const [orderingPharmacy, setOrderingPharmacy] = useState<AvailablePharmacy | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderNote, setOrderNote] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderPayment, setOrderPayment] = useState<PaymentMethod | ''>('');
  const [orderPickupTime, setOrderPickupTime] = useState('');

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG }),
        { timeout: 5000 }
      );
    } else {
      setUserLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
    }
  }, []);

  const fetchMedication = useCallback(async () => {
    if (!selectedMedicationId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/medications/${selectedMedicationId}`);
      const data = await res.json();
      setMedication(data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [selectedMedicationId]);

  useEffect(() => { fetchMedication(); }, [fetchMedication]);

  // Extract unique cities
  const cities = useMemo(() => {
    if (!medication) return [];
    return [...new Set(medication.availablePharmacies.map(p => p.city))];
  }, [medication]);

  // Filtered & sorted pharmacies
  const filteredPharmacies = useMemo(() => {
    if (!medication) return [];
    let list = [...medication.availablePharmacies];

    if (filterCity) list = list.filter(p => p.city === filterCity);
    if (filterGuard === true) list = list.filter(p => p.isGuard);

    const loc = userLocation || { lat: DEFAULT_LAT, lng: DEFAULT_LNG };

    switch (sortBy) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'rating': list.sort((a, b) => b.rating - a.rating); break;
      case 'stock': list.sort((a, b) => b.quantity - a.quantity); break;
      case 'distance':
        list.sort((a, b) =>
          haversineDistance(loc.lat, loc.lng, a.latitude, a.longitude) -
          haversineDistance(loc.lat, loc.lng, b.latitude, b.longitude)
        );
        break;
    }
    return list;
  }, [medication, filterCity, filterGuard, sortBy, userLocation]);

  // Price stats — always sorted by price ascending for accurate cheapest/most expensive
  const priceSorted = useMemo(() => {
    if (!medication) return [];
    let list = [...medication.availablePharmacies];
    if (filterCity) list = list.filter(p => p.city === filterCity);
    if (filterGuard === true) list = list.filter(p => p.isGuard);
    list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    return list;
  }, [medication, filterCity, filterGuard]);

  const cheapestPrice = priceSorted.length > 0 ? priceSorted[0]?.price : null;
  const mostExpensivePrice = priceSorted.length > 0 ? priceSorted[priceSorted.length - 1]?.price : null;
  const cheapestPharmacy = priceSorted.length > 0 ? priceSorted[0] : null;
  const averagePrice = priceSorted.length > 0
    ? Math.round(priceSorted.reduce((sum, p) => sum + p.price, 0) / priceSorted.length)
    : null;

  // Distance helper for pharmacies
  const getDistance = (p: AvailablePharmacy) => {
    const loc = userLocation || { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
    return haversineDistance(loc.lat, loc.lng, p.latitude, p.longitude);
  };

  const handlePharmacyClick = (id: string) => {
    selectPharmacy(id);
    setCurrentView('pharmacy-detail');
  };

  const openOrderDialog = (pharmacy: AvailablePharmacy) => {
    setOrderingPharmacy(pharmacy);
    setOrderQuantity(1);
    setOrderNote('');
    setOrderPayment('');
    setOrderPickupTime('');
  };

  const closeOrderDialog = () => {
    setOrderingPharmacy(null);
  };

  const handleSubmitOrder = async () => {
    if (!orderingPharmacy || !currentUserId) return;
    setOrderSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          pharmacyId: orderingPharmacy.id,
          medicationId: medication?.id,
          quantity: orderQuantity,
          note: orderNote,
          paymentMethod: orderPayment || undefined,
          pickupTime: orderPickupTime || undefined,
        }),
      });
      if (res.ok) {
        const order = await res.json();
        toast.success(`Commande passée ! ${orderQuantity}x ${medication?.commercialName}`);
        closeOrderDialog();
        selectOrder(order.id);
        setCurrentView('order-confirmation');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la commande');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const clearFilters = () => {
    setFilterCity(null);
    setFilterGuard(null);
    setSortBy('distance');
  };

  const hasActiveFilters = filterCity || filterGuard || sortBy !== 'distance';

  const currentSortLabel = SORT_OPTIONS.find(s => s.value === sortBy)?.shortLabel || 'Proche';

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!medication) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 text-center">
        <p className="text-muted-foreground">Médicament non trouvé</p>
      </div>
    );
  }

  return (
    <div className="pb-36">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <ViewHeader title={medication.name} back />

        {/* Header Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden border-emerald-100">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                  <Pill className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-white break-words">{medication.name}</h1>
                  <p className="text-emerald-200 text-sm truncate">{medication.commercialName}</p>
                </div>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Info badges */}
              <div className="flex flex-wrap gap-1.5">
                {medication.category && (
                  <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">
                    {medication.category}
                  </Badge>
                )}
                {medication.form && (
                  <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                    {medication.form}
                  </Badge>
                )}
                {medication.needsPrescription && (
                  <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50">
                    <FileText className="h-3 w-3 mr-1" />
                    Ordonnance
                  </Badge>
                )}
                {medication.activePrinciple && (
                  <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                    {medication.activePrinciple}
                  </Badge>
                )}
              </div>

              {/* Key info */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {medication.pathology && (
                  <div className="bg-emerald-50 rounded-lg p-2.5">
                    <p className="text-[11px] text-emerald-600 font-medium uppercase">Indication</p>
                    <p className="text-xs text-emerald-800 mt-0.5 break-words">{medication.pathology}</p>
                  </div>
                )}
                {cheapestPrice !== null && mostExpensivePrice !== null && (
                  <div className="bg-amber-50 rounded-lg p-2.5">
                    <p className="text-[11px] text-amber-600 font-medium uppercase">Prix</p>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {cheapestPrice.toLocaleString()} - {mostExpensivePrice.toLocaleString()} F
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {medication.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {medication.description}
                </p>
              )}

              {/* Dosage */}
              {medication.dosage && (
                <div>
                  <button
                    onClick={() => setShowDosage(!showDosage)}
                    className="flex items-center justify-between w-full text-sm font-medium text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-emerald-600" />
                      Posologie
                    </div>
                    {showDosage ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <AnimatePresence>
                    {showDosage && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-sm text-muted-foreground mt-2 pl-6 overflow-hidden">
                        {medication.dosage}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Side effects */}
              {medication.sideEffects && (
                <div>
                  <button
                    onClick={() => setShowSideEffects(!showSideEffects)}
                    className="flex items-center justify-between w-full text-sm font-medium text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      Effets secondaires
                    </div>
                    {showSideEffects ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <AnimatePresence>
                    {showSideEffects && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-sm text-muted-foreground mt-2 pl-6 overflow-hidden">
                        {medication.sideEffects}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Generic Alternatives */}
        {medication.genericAlternatives.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4">
            <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Pill className="h-5 w-5 text-emerald-600" />
              Alternatives génériques
            </h2>
            <div className="space-y-2">
              {medication.genericAlternatives.map((alt) => (
                <Card
                  key={alt.id}
                  className="border-emerald-100 cursor-pointer hover:border-emerald-300 transition-colors"
                  onClick={() => {
                    useAppStore.getState().selectMedication(alt.id);
                    setCurrentView('medication-detail');
                    window.scrollTo(0, 0);
                  }}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{alt.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{alt.commercialName}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 flex-shrink-0 ml-2">
                      Voir
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Available Pharmacies - Price Comparison */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold text-sm">
                Pharmacies
                <span className="text-muted-foreground font-normal ml-1">({filteredPharmacies.length})</span>
              </h2>
            </div>
          </div>

          {/* Price Summary Bar */}
          {filteredPharmacies.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-amber-50 rounded-xl p-3 mb-3 border border-emerald-100">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase font-medium">Meilleur prix</p>
                  <p className="text-sm font-bold text-emerald-700 flex items-center justify-center gap-0.5">
                    <TrendingDown className="h-3 w-3" />
                    {cheapestPrice?.toLocaleString()} F
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase font-medium">Prix moyen</p>
                  <p className="text-sm font-bold text-foreground">{averagePrice?.toLocaleString()} F</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase font-medium">Prix max</p>
                  <p className="text-sm font-bold text-red-500">{mostExpensivePrice?.toLocaleString()} F</p>
                </div>
              </div>
            </div>
          )}

          {/* Filter/Sort Bar - Compact single row */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium"
            >
              <ArrowUpDown className="h-3 w-3" />
              <span className="truncate max-w-[70px]">{currentSortLabel}</span>
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`border-emerald-200 text-emerald-700 text-xs h-8 px-2.5 ${showFilters ? 'bg-emerald-50' : ''}`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
              Filtres
              {hasActiveFilters && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-600" />
              )}
            </Button>
            {filterCity && (
              <Badge className="bg-emerald-100 text-emerald-700 gap-0.5 text-[11px] py-0.5 px-1.5">
                {filterCity}
                <X className="h-2.5 w-2.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); setFilterCity(null); }} />
              </Badge>
            )}
            {filterGuard && (
              <Badge className="bg-amber-100 text-amber-700 gap-0.5 text-[11px] py-0.5 px-1.5">
                Garde
                <X className="h-2.5 w-2.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); setFilterGuard(null); }} />
              </Badge>
            )}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] text-emerald-600 hover:underline ml-auto flex-shrink-0"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Expanded Filters & Sort Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-xl border border-emerald-100 p-4 mb-3 space-y-4">
                  {/* Sort Section */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">Trier par</label>
                    <div className="flex flex-wrap gap-1.5">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSortBy(opt.value)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                            sortBy === opt.value
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-emerald-100" />

                  {/* Filter Section */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">Filtrer</label>
                    <div className="space-y-3">
                      {/* City filter */}
                      <div>
                        <label className="text-[11px] text-muted-foreground mb-1.5 block">Ville</label>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            variant={filterCity === null ? 'default' : 'outline'}
                            className={filterCity === null
                              ? 'bg-emerald-600 text-white cursor-pointer'
                              : 'cursor-pointer border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }
                            onClick={() => setFilterCity(null)}
                          >
                            Toutes
                          </Badge>
                          {cities.map(city => (
                            <Badge
                              key={city}
                              variant={filterCity === city ? 'default' : 'outline'}
                              className={filterCity === city
                                ? 'bg-emerald-600 text-white cursor-pointer'
                                : 'cursor-pointer border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              }
                              onClick={() => setFilterCity(filterCity === city ? null : city)}
                            >
                              {city}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {/* Guard filter */}
                      <div>
                        <button
                          onClick={() => setFilterGuard(filterGuard === true ? null : true)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                            filterGuard
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'border-emerald-200 text-muted-foreground hover:bg-emerald-50'
                          }`}
                        >
                          <Shield className="h-3.5 w-3.5" />
                          Pharmacies de garde uniquement
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pharmacy List */}
          {filteredPharmacies.length === 0 ? (
            <Card className="border-emerald-100">
              <CardContent className="p-6 text-center">
                <p className="text-4xl mb-2">😅</p>
                <p className="text-sm text-muted-foreground">
                  Aucune pharmacie ne correspond à vos filtres
                </p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-sm text-emerald-600 mt-2 hover:underline">
                    Réinitialiser les filtres
                  </button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredPharmacies.map((pharmacy, index) => {
                const isCheapest = index === 0 && (sortBy === 'price-asc' || sortBy === 'distance' && cheapestPrice === pharmacy.price);
                const savings = isCheapest && mostExpensivePrice
                  ? mostExpensivePrice - pharmacy.price
                  : 0;
                const distance = getDistance(pharmacy);

                return (
                  <Card
                    key={pharmacy.id}
                    className={`border overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 ${
                      isCheapest ? 'border-emerald-400 bg-emerald-50/50' : 'border-emerald-100 hover:border-emerald-300'
                    }`}
                  >
                    <CardContent className="p-3">
                      {/* Row 1: Name + badges + distance */}
                      <div
                        className="flex items-center gap-1.5 flex-wrap mb-1"
                        onClick={() => handlePharmacyClick(pharmacy.id)}
                      >
                        <p className="font-semibold text-sm text-foreground truncate min-w-0">{pharmacy.name}</p>
                        {isCheapest && (
                          <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 h-4 flex-shrink-0">
                            <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                            Meilleur prix
                          </Badge>
                        )}
                        {pharmacy.isGuard && (
                          <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 h-4 flex-shrink-0">
                            <Shield className="h-2.5 w-2.5 mr-0.5" />
                            Garde
                          </Badge>
                        )}
                        {pharmacy.isOpen24h && (
                          <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 h-4 flex-shrink-0">
                            <Clock className="h-2.5 w-2.5 mr-0.5" />
                            24h/24
                          </Badge>
                        )}
                      </div>

                      {/* Row 2: Address + distance */}
                      <p className="text-xs text-muted-foreground truncate mb-1.5"
                        onClick={() => handlePharmacyClick(pharmacy.id)}
                      >
                        <MapPin className="h-3 w-3 inline mr-0.5" />
                        {pharmacy.address}, {pharmacy.city}
                        <span className="ml-2 text-emerald-600 font-medium">{formatDistance(distance)}</span>
                      </p>

                      {/* Row 3: Rating + Stock */}
                      <div className="flex items-center gap-3 mb-2.5"
                        onClick={() => handlePharmacyClick(pharmacy.id)}
                      >
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-medium">{pharmacy.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Package className="h-3 w-3" />
                          Stock: {pharmacy.quantity}
                        </span>
                        {isCheapest && savings > 0 && (
                          <span className="text-[10px] text-emerald-600 font-medium">
                            Économisez {savings.toLocaleString()} F
                          </span>
                        )}
                      </div>

                      {/* Separator */}
                      <div className="border-t border-emerald-100/80 mb-2.5" />

                      {/* Row 4: Price + Commander */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base text-emerald-700">
                            {pharmacy.price.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            openOrderDialog(pharmacy);
                          }}
                        >
                          <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                          Commander
                        </Button>
                      </div>

                      {/* Row 5: Call + Navigate secondary actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`tel:${pharmacy.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-1.5 flex-1 h-8 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 transition-colors text-xs font-medium"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Appeler
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openGoogleMaps(pharmacy.latitude, pharmacy.longitude, pharmacy.name);
                          }}
                          className="flex items-center justify-center gap-1.5 flex-1 h-8 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors text-xs font-medium"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          Y aller
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Floating Order Button - Best Price */}
      {cheapestPharmacy && filteredPharmacies.length > 0 && !orderingPharmacy && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px)+0.5rem)] left-0 right-0 z-40 lg:bottom-6 lg:left-64 lg:right-0 px-4"
        >
          <div className="max-w-2xl mx-auto">
            <Button
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-between px-4"
              onClick={() => openOrderDialog(cheapestPharmacy)}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <TrendingDown className="h-5 w-5 flex-shrink-0" />
                <span className="font-semibold text-sm truncate">Meilleur prix</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                <span className="text-xs opacity-90 truncate max-w-[100px] sm:max-w-[160px]">{cheapestPharmacy.name}</span>
                <span className="font-bold text-lg flex-shrink-0">{cheapestPrice?.toLocaleString()} FCFA</span>
              </div>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Order Sheet */}
      <Sheet open={!!orderingPharmacy} onOpenChange={(open) => { if (!open) closeOrderDialog(); }}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[92dvh] p-0 gap-0 overflow-hidden flex flex-col">
          <SheetHeader className="p-4 pb-2 shrink-0">
            <SheetTitle className="text-base font-bold">Passer une commande</SheetTitle>
            <SheetDescription className="text-xs">
              {medication.commercialName} — {orderingPharmacy?.name}
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable body */}
          <div className="overflow-y-auto overscroll-contain px-4 pb-4 flex-1 min-h-0">
            {/* Product + Pharmacy info */}
            <div className="bg-emerald-50 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{medication.commercialName}</p>
                  <p className="text-xs text-muted-foreground">{medication.form}{medication.category ? ` · ${medication.category}` : ''}</p>
                </div>
                <Pill className="h-7 w-7 text-emerald-600 flex-shrink-0" />
              </div>
              <div className="border-t border-emerald-200/60 mt-2 pt-2">
                <p className="font-medium text-xs truncate">{orderingPharmacy?.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{orderingPharmacy?.address}, {orderingPharmacy?.city}</p>
              </div>
            </div>

            {orderingPharmacy?.needsPrescription && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-start gap-2">
                <FileText className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">Ordonnance requise</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">Ce médicament nécessite une ordonnance. Présentez-vous à la pharmacie avec votre ordonnance.</p>
                </div>
              </div>
            )}

            {/* Quantity + Unit Price row */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                  className="w-9 h-9 rounded-lg border-2 border-emerald-200 flex items-center justify-center active:bg-emerald-100 transition-colors"
                >
                  <Minus className="h-4 w-4 text-emerald-700" />
                </button>
                <span className="text-xl font-bold w-8 text-center tabular-nums">{orderQuantity}</span>
                <button
                  onClick={() => setOrderQuantity(Math.min(orderingPharmacy!.quantity, orderQuantity + 1))}
                  className="w-9 h-9 rounded-lg border-2 border-emerald-200 flex items-center justify-center active:bg-emerald-100 transition-colors"
                >
                  <Plus className="h-4 w-4 text-emerald-700" />
                </button>
              </div>
              <div className="text-xs text-muted-foreground">
                <span>{orderingPharmacy?.price.toLocaleString()} FCFA / unité</span>
                <span className="ml-2">Stock: {orderingPharmacy?.quantity}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="mb-3">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                Paiement
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setOrderPayment(opt.value as PaymentMethod | '')}
                    className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-medium transition-colors ${
                      orderPayment === opt.value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 active:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <span className="text-sm">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pickup time */}
            <div className="mb-3">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Heure de retrait <span className="font-normal">(optionnel)</span>
              </label>
              <input
                type="time"
                value={orderPickupTime}
                onChange={(e) => setOrderPickupTime(e.target.value)}
                className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Note */}
            <div className="mb-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Note <span className="font-normal">(optionnel)</span>
              </label>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Ex: Je viendrai récupérer entre 16h et 18h..."
                rows={2}
                className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Sticky Footer - Always visible */}
          <div className="shrink-0 border-t border-emerald-100 bg-white p-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] mt-auto">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-sm text-muted-foreground">Total</span>
              <div className="text-right">
                <span className="text-lg font-bold text-emerald-700">
                  {orderingPharmacy ? (orderingPharmacy.price * orderQuantity).toLocaleString() : 0} FCFA
                </span>
                {orderPayment && (
                  <p className="text-[11px] text-muted-foreground">{PAYMENT_LABELS[orderPayment] || orderPayment}</p>
                )}
              </div>
            </div>
            <Button
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm"
              onClick={handleSubmitOrder}
              disabled={orderSubmitting}
            >
              {orderSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" />
                  Confirmer la commande
                </span>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
