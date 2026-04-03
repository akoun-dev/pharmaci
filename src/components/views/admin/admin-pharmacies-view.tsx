'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Search,
  Star,
  Shield,
  MapPin,
  Phone,
  Clock,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  X,
  Loader2,
  Package,
  ShoppingCart,
  Heart,
  MessageSquare,
  Calendar,
  Mail,
  SlidersHorizontal,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ViewHeader } from '@/components/view-header';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';

// ── Types ──
interface PharmacyItem {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string | null;
  isGuard: boolean;
  isPartner: boolean;
  isOpen24h: boolean;
  rating: number;
  reviewCount: number;
  openTime: string | null;
  closeTime: string | null;
  description: string | null;
  services: string[] | null;
  paymentMethods: string[] | null;
  parkingInfo: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  medicationCount: number;
  orderCount: number;
  reviewCountTotal: number;
  favoriteCount: number;
  stockSummary?: {
    totalQuantity: number;
    totalMedications: number;
    inStockCount: number;
  };
}

interface PharmaciesResponse {
  items: PharmacyItem[];
  total: number;
  limit: number;
  offset: number;
}

// ── Constants ──
const PAGE_SIZE = 20;

const CITIES = [
  { value: '', label: 'Toutes les villes' },
  { value: 'Abidjan', label: 'Abidjan' },
  { value: 'Bouaké', label: 'Bouaké' },
  { value: 'San Pédro', label: 'San Pédro' },
  { value: 'Daloa', label: 'Daloa' },
  { value: 'Yamoussoukro', label: 'Yamoussoukro' },
  { value: 'Korhogo', label: 'Korhogo' },
  { value: 'Man', label: 'Man' },
];

const GUARD_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'true', label: 'En garde' },
  { value: 'false', label: 'Pas en garde' },
];

// ── Helpers ──
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

function parseServices(services: string[] | null): string[] {
  if (!services || !Array.isArray(services)) return [];
  return services;
}

function parsePaymentMethods(methods: string[] | null): string[] {
  if (!methods || !Array.isArray(methods)) return [];
  return methods;
}

const PAYMENT_LABELS: Record<string, string> = {
  especes: 'Espèces',
  orange_money: 'Orange Money',
  wave: 'Wave',
  mtn_money: 'MTN Money',
  carte: 'Carte bancaire',
  mobile_money: 'Mobile Money',
};

const SERVICE_LABELS: Record<string, string> = {
  livraison: 'Livraison',
  drive: 'Drive',
  conseil: 'Conseil',
  ordonnance: 'Ordonnance',
  parapharmacie: 'Parapharmacie',
  urgence: 'Urgence',
};

export function AdminPharmaciesView() {
  const { selectPharmacy, setCurrentView } = useAppStore();

  // ── State ──
  const [pharmacies, setPharmacies] = useState<PharmacyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [guardFilter, setGuardFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detail dialog
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null);

  // ── Fetch pharmacies list ──
  const fetchPharmacies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
      });

      if (debouncedQuery) params.set('q', debouncedQuery);
      if (cityFilter) params.set('city', cityFilter);
      if (guardFilter) params.set('isGuard', guardFilter);

      const res = await fetch(`/api/admin/pharmacies?${params}`);
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des pharmacies');
      }

      const data: PharmaciesResponse = await res.json();
      setPharmacies(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, cityFilter, guardFilter, page]);

  useEffect(() => {
    fetchPharmacies();
  }, [fetchPharmacies]);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [cityFilter, guardFilter]);

  // ── Detail dialog ──
  const openDetail = async (pharmacy: PharmacyItem) => {
    selectPharmacy(pharmacy.id);
    setSelectedPharmacy(pharmacy);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);

    try {
      const res = await fetch(`/api/admin/pharmacies/${pharmacy.id}`);
      if (res.ok) {
        const data = await res.json();
        setDetailData(data);
      } else {
        toast.error('Impossible de charger le détail');
      }
    } catch {
      toast.error('Erreur serveur');
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Active filter count ──
  const activeFilterCount = [
    debouncedQuery,
    cityFilter,
    guardFilter,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setCityFilter('');
    setGuardFilter('');
  };

  return (
    <div className="pb-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* ── Header ── */}
        <ViewHeader
          title="Pharmacies"
          icon={<Building2 className="h-5 w-5 text-violet-600" />}
          back={false}
          action={
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-violet-600 hover:bg-violet-50"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 ${showFilters ? 'text-violet-600 bg-violet-50' : 'text-violet-600 hover:bg-violet-50'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-5 w-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          }
        />

        {/* ── Search bar ── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-3"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, adresse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 border-violet-200 focus:border-violet-400 bg-violet-50/30"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Filter panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-3"
            >
              <div className="p-3 sm:p-4 bg-violet-50/50 rounded-xl border border-violet-100 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
                    Filtres
                  </p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-[11px] text-violet-600 hover:text-violet-800 font-medium"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* City filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Ville</label>
                    <Select value={cityFilter} onValueChange={(v) => setCityFilter(v === '__all__' ? '' : v)}>
                      <SelectTrigger className="w-full h-10 border-violet-200 bg-white text-sm">
                        <SelectValue placeholder="Toutes les villes" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city.value || '__all__'} value={city.value || '__all__'}>
                            {city.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Guard filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Statut garde</label>
                    <Select value={guardFilter} onValueChange={(v) => setGuardFilter(v === '__all__' ? '' : v)}>
                      <SelectTrigger className="w-full h-10 border-violet-200 bg-white text-sm">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        {GUARD_FILTERS.map((g) => (
                          <SelectItem key={g.value || '__all__'} value={g.value || '__all__'}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results count & active filters ── */}
        <div className="flex items-center gap-2 mb-3">
          {loading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <p className="text-xs text-muted-foreground">
              {total} pharmacie{total !== 1 ? 's' : ''} trouvée{total !== 1 ? 's' : ''}
            </p>
          )}
          {activeFilterCount > 0 && !showFilters && (
            <div className="flex items-center gap-1.5 ml-auto">
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-violet-100 text-violet-700 border-violet-200">
                {activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        {/* ── Error state ── */}
        {error && !loading && (
          <Card className="border-red-200">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700 mb-1">Erreur</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => fetchPharmacies()}
              >
                <Loader2 className="h-3.5 w-3.5 mr-1.5" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && pharmacies.length === 0 && (
          <Card className="border-violet-100">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-7 w-7 text-violet-400" />
              </div>
              <h3 className="font-semibold text-sm mb-1">
                {activeFilterCount > 0 ? 'Aucun résultat' : 'Aucune pharmacie'}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                {activeFilterCount > 0
                  ? 'Aucune pharmacie ne correspond à vos critères de recherche'
                  : 'Aucune pharmacie enregistrée sur la plateforme'}
              </p>
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  className="border-violet-200 text-violet-700 hover:bg-violet-50"
                  onClick={clearFilters}
                >
                  Effacer les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Pharmacy list ── */}
        {!loading && !error && pharmacies.length > 0 && (
          <AnimatePresence>
            <div className="space-y-2.5">
              {pharmacies.map((pharmacy, index) => (
                <motion.div
                  key={pharmacy.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    className="border-violet-100 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                    onClick={() => openDetail(pharmacy)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      {/* Row 1: Name + Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Building2 className="h-4 w-4 text-violet-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate leading-tight">
                              {pharmacy.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {pharmacy.city && (
                                <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                                  <MapPin className="h-3 w-3" />
                                  {pharmacy.district ? `${pharmacy.district}, ${pharmacy.city}` : pharmacy.city}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <div className="flex items-center gap-1 flex-wrap justify-end">
                            {pharmacy.isGuard && (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">
                                <Shield className="h-2.5 w-2.5 mr-0.5" />
                                Garde
                              </Badge>
                            )}
                            {pharmacy.isOpen24h && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                                <Clock className="h-2.5 w-2.5 mr-0.5" />
                                24h/24
                              </Badge>
                            )}
                            {pharmacy.isPartner && (
                              <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px] px-1.5 py-0">
                                Partenaire
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Row 2: Address */}
                      {pharmacy.address && (
                        <p className="text-xs text-muted-foreground truncate ml-[2.875rem] mb-2">
                          {pharmacy.address}
                        </p>
                      )}

                      {/* Row 3: Rating + Stats */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-violet-50 ml-[2.875rem]">
                        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                          {/* Stars */}
                          <div className="flex items-center gap-0.5">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-semibold text-foreground">
                              {pharmacy.rating?.toFixed(1) || '0.0'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ({pharmacy.reviewCount || 0})
                            </span>
                          </div>

                          <span className="text-violet-200">|</span>

                          {/* Phone */}
                          {pharmacy.phone && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                              <Phone className="h-3 w-3" />
                              {pharmacy.phone}
                            </span>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {pharmacy.medicationCount > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Package className="h-3 w-3" />
                              {pharmacy.medicationCount}
                            </span>
                          )}
                          {pharmacy.orderCount > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <ShoppingCart className="h-3 w-3" />
                              {pharmacy.orderCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row 4: Created date */}
                      <div className="flex items-center gap-1 ml-[2.875rem] mt-1.5">
                        <Calendar className="h-2.5 w-2.5 text-muted-foreground/60" />
                        <span className="text-[10px] text-muted-foreground/60">
                          Créée le {formatDate(pharmacy.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && pharmacies.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Préc.
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-violet-600 text-white'
                        : 'text-violet-700 hover:bg-violet-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && page < totalPages - 2 && (
                <span className="text-xs text-muted-foreground px-1">...</span>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8 border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suiv.
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* ── Pharmacy Detail Dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg mx-auto p-0 gap-0 overflow-hidden rounded-2xl border-violet-200 max-h-[90dvh]">
          <DialogHeader className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 text-white shrink-0">
            <DialogTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedPharmacy?.name || 'Détail de la pharmacie'}
            </DialogTitle>
            <DialogDescription className="text-violet-200 text-xs mt-1">
              Informations détaillées de la pharmacie
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90dvh-100px)]">
            <div className="p-5">
              {detailLoading && (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              )}

              {!detailLoading && selectedPharmacy && (
                <div className="space-y-4">
                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedPharmacy.isGuard && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[11px] px-2 py-0.5">
                        <Shield className="h-3 w-3 mr-1" />
                        Pharmacie de garde
                      </Badge>
                    )}
                    {selectedPharmacy.isOpen24h && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[11px] px-2 py-0.5">
                        <Clock className="h-3 w-3 mr-1" />
                        Ouvert 24h/24
                      </Badge>
                    )}
                    {selectedPharmacy.isPartner && (
                      <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[11px] px-2 py-0.5">
                        Partenaire
                      </Badge>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const fill = Math.min(1, Math.max(0, (selectedPharmacy.rating || 0) - star + 1));
                        return (
                          <div key={star} className="relative" style={{ width: 16, height: 16 }}>
                            <Star
                              size={16}
                              className="text-muted-foreground/30 fill-muted-foreground/30"
                            />
                            {fill > 0 && (
                              <div
                                className="absolute inset-0 overflow-hidden"
                                style={{ width: `${fill * 100}%` }}
                              >
                                <Star size={16} className="text-amber-500 fill-amber-500" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {selectedPharmacy.rating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({selectedPharmacy.reviewCount || 0} avis)
                    </span>
                  </div>

                  {/* Contact info */}
                  <Card className="border-violet-100">
                    <CardContent className="p-3 sm:p-4 space-y-2.5">
                      <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-2">
                        Informations de contact
                      </p>

                      <div className="flex items-start gap-2.5">
                        <MapPin className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-foreground break-words">{selectedPharmacy.address || '—'}</p>
                          <p className="text-xs text-muted-foreground">
                            {[selectedPharmacy.district, selectedPharmacy.city].filter(Boolean).join(', ') || '—'}
                          </p>
                        </div>
                      </div>

                      {selectedPharmacy.phone && (
                        <div className="flex items-center gap-2.5">
                          <Phone className="h-4 w-4 text-violet-500 shrink-0" />
                          <p className="text-sm text-foreground">{selectedPharmacy.phone}</p>
                        </div>
                      )}

                      {selectedPharmacy.email && (
                        <div className="flex items-center gap-2.5">
                          <Mail className="h-4 w-4 text-violet-500 shrink-0" />
                          <p className="text-sm text-foreground break-words">{selectedPharmacy.email}</p>
                        </div>
                      )}

                      {(selectedPharmacy.openTime || selectedPharmacy.closeTime) && (
                        <div className="flex items-center gap-2.5">
                          <Clock className="h-4 w-4 text-violet-500 shrink-0" />
                          <p className="text-sm text-foreground">
                            {selectedPharmacy.isOpen24h
                              ? 'Ouvert 24h/24'
                              : `${selectedPharmacy.openTime || '?'} - ${selectedPharmacy.closeTime || '?'}`}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Description */}
                  {selectedPharmacy.description && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
                        Description
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedPharmacy.description}
                      </p>
                    </div>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Card className="border-violet-100 bg-violet-50/30">
                      <CardContent className="p-3 text-center">
                        <Package className="h-4 w-4 text-violet-600 mx-auto mb-1" />
                        <p className="text-base font-bold text-violet-700">
                          {selectedPharmacy.medicationCount}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Médicaments</p>
                      </CardContent>
                    </Card>
                    <Card className="border-violet-100 bg-violet-50/30">
                      <CardContent className="p-3 text-center">
                        <ShoppingCart className="h-4 w-4 text-violet-600 mx-auto mb-1" />
                        <p className="text-base font-bold text-violet-700">
                          {selectedPharmacy.orderCount}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Commandes</p>
                      </CardContent>
                    </Card>
                    <Card className="border-violet-100 bg-violet-50/30">
                      <CardContent className="p-3 text-center">
                        <Star className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                        <p className="text-base font-bold text-violet-700">
                          {selectedPharmacy.reviewCountTotal || selectedPharmacy.reviewCount || 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Avis</p>
                      </CardContent>
                    </Card>
                    <Card className="border-violet-100 bg-violet-50/30">
                      <CardContent className="p-3 text-center">
                        <Heart className="h-4 w-4 text-rose-500 mx-auto mb-1" />
                        <p className="text-base font-bold text-violet-700">
                          {selectedPharmacy.favoriteCount}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Favoris</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Stock summary */}
                  {selectedPharmacy.stockSummary && (
                    <Card className="border-violet-100">
                      <CardContent className="p-3 sm:p-4 space-y-2">
                        <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
                          Résumé du stock
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <p className="text-sm font-bold text-foreground">
                              {selectedPharmacy.stockSummary.totalMedications}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Produits</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-emerald-600">
                              {selectedPharmacy.stockSummary.inStockCount}
                            </p>
                            <p className="text-[10px] text-muted-foreground">En stock</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-foreground">
                              {selectedPharmacy.stockSummary.totalQuantity?.toLocaleString('fr-FR') || 0}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Quantité totale</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Services */}
                  {parseServices(selectedPharmacy.services).length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
                        Services
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {parseServices(selectedPharmacy.services).map((service) => (
                          <Badge
                            key={service}
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 border-violet-200 text-violet-700"
                          >
                            {SERVICE_LABELS[service] || service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment methods */}
                  {parsePaymentMethods(selectedPharmacy.paymentMethods).length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
                        Moyens de paiement
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {parsePaymentMethods(selectedPharmacy.paymentMethods).map((method) => (
                          <Badge
                            key={method}
                            variant="secondary"
                            className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700"
                          >
                            {PAYMENT_LABELS[method] || method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Parking info */}
                  {selectedPharmacy.parkingInfo && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
                        Parking
                      </p>
                      <p className="text-xs text-muted-foreground">{selectedPharmacy.parkingInfo}</p>
                    </div>
                  )}

                  {/* GPS coordinates */}
                  {(selectedPharmacy.latitude || selectedPharmacy.longitude) && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
                        Coordonnées GPS
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {selectedPharmacy.latitude?.toFixed(4)}, {selectedPharmacy.longitude?.toFixed(4)}
                      </p>
                    </div>
                  )}

                  {/* Dates */}
                  <Separator className="bg-violet-100" />
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Créée le {formatDate(selectedPharmacy.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Modifiée le {formatDate(selectedPharmacy.updatedAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
