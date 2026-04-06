'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Pill, Building2, SlidersHorizontal, X, MapPin, LocateFixed, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchBar } from '@/components/search-bar';
import { PharmacyCard } from '@/components/pharmacy-card';
import { MedicationCard } from '@/components/medication-card';
import { ViewHeader } from '@/components/view-header';
import { useAppStore } from '@/store/app-store';
import { useUserLocation } from '@/hooks/use-user-location';
import { haversineDistance } from '@/lib/navigation';

const CATEGORIES = [
  'Antalgique',
  'Antibiotique',
  'Antidiabétique',
  'Antipaludéen',
  'Antihistaminique',
  'Antihypertenseur',
  'Anti-inflammatoire',
  'Bronchodilatateur',
  'Antiacide',
  'Supplément',
];

const CITIES = ['Abidjan', 'Bouaké', 'San Pedro'];

export function SearchView() {
  const {
    searchQuery,
    setSearchQuery,
    selectPharmacy,
    selectMedication,
    setCurrentView,
    currentUserId,
  } = useAppStore();

  const { location, status, requestLocation } = useUserLocation();

  const [tab, setTab] = useState<'medications' | 'pharmacies'>('medications');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [isGuardOnly, setIsGuardOnly] = useState(false);
  const [nearMe, setNearMe] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      let url = '';
      if (tab === 'medications') {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (selectedCategory) params.set('category', selectedCategory);
        url = `/api/medications?${params.toString()}`;
      } else {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (selectedCity) params.set('city', selectedCity);
        if (isGuardOnly) params.set('isGuard', 'true');
        if (currentUserId) params.set('userId', currentUserId);
        url = `/api/pharmacies?${params.toString()}`;
      }

      const res = await fetch(url);
      const resData = await res.json();
      const data = resData.items || resData;
      setResults(data);
    } catch (error) {
      logger.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  }, [tab, searchQuery, selectedCategory, selectedCity, isGuardOnly, currentUserId]);

  useEffect(() => {
    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [fetchResults]);

  const handlePharmacyClick = (id: string) => {
    selectPharmacy(id);
    setCurrentView('pharmacy-detail');
  };

  const handleMedicationClick = (id: string) => {
    selectMedication(id);
    setCurrentView('medication-detail');
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedCity('');
    setIsGuardOnly(false);
    setNearMe(false);
  };

  const hasActiveFilters = selectedCategory || selectedCity || isGuardOnly || nearMe;

  // Sort pharmacies by distance when "near me" is active
  const displayResults = useMemo(() => {
    if (tab !== 'pharmacies' || !nearMe || !location) return results;

    return [...results]
      .map((p) => ({
        ...p,
        distance:
          p.latitude && p.longitude
            ? haversineDistance(location.lat, location.lng, p.latitude, p.longitude)
            : null,
      }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [results, tab, nearMe, location]);

  const toggleNearMe = () => {
    if (!nearMe) {
      requestLocation();
    }
    setNearMe(!nearMe);
  };

  return (
    <div className="pb-4">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ViewHeader title="Recherche" icon={<Search className="h-5 w-5 text-amber-600" />} />

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={
            tab === 'medications'
              ? 'Rechercher un médicament...'
              : 'Rechercher une pharmacie...'
          }
          autoFocus
        />

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4 mb-3 sm:mb-4 items-center">
          <Button
            variant={tab === 'medications' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('medications')}
            className={
              tab === 'medications'
                ? 'bg-amber-600 hover:bg-amber-700 text-white text-xs'
                : 'border-amber-200 text-amber-700 text-xs'
            }
          >
            <Pill className="h-3.5 w-3.5 mr-1" />
            Médicaments
          </Button>
          <Button
            variant={tab === 'pharmacies' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('pharmacies')}
            className={
              tab === 'pharmacies'
                ? 'bg-amber-600 hover:bg-amber-700 text-white text-xs'
                : 'border-amber-200 text-amber-700 text-xs'
            }
          >
            <Building2 className="h-3.5 w-3.5 mr-1" />
            Pharmacies
          </Button>

          {/* "Près de moi" button — only in pharmacy tab */}
          {tab === 'pharmacies' && (
            <Button
              variant={nearMe ? 'default' : 'outline'}
              size="sm"
              onClick={toggleNearMe}
              className={
                nearMe
                  ? 'bg-green-600 hover:bg-amber-700 text-white text-xs'
                  : 'border-indigo-200 text-green-600 text-xs'
              }
            >
              <LocateFixed className="h-3.5 w-3.5 mr-1" />
              Près de moi
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="border-amber-200 text-green-700 text-xs ml-auto"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
            Filtres
          </Button>
        </div>

        {/* Near me status indicator */}
        {nearMe && tab === 'pharmacies' && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 dark:bg-indigo-950/40 dark:ring-1 dark:ring-indigo-900/60">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${status === 'granted' ? 'bg-amber-500' : 'bg-amber-500'}`} />
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              {status === 'granted' ? (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  Résultats triés par proximité (GPS activé)
                </>
              ) : status === 'loading' ? (
                <>
                  <LocateFixed className="w-3.5 h-3.5 animate-pulse" />
                  Localisation en cours...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  GPS non disponible — position estimée (Abidjan)
                </>
              )}
            </span>
          </div>
        )}

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-3 space-y-3 rounded-xl border border-amber-100 bg-white p-3 dark:border-amber-900/50 dark:bg-gray-950/80 sm:mb-4 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Filtres</span>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-amber-600 hover:underline"
                    >
                      Effacer tout
                    </button>
                  )}
                </div>

                {tab === 'medications' && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Catégorie</label>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((cat) => (
                        <Badge
                          key={cat}
                          variant={selectedCategory === cat ? 'default' : 'outline'}
                          className={
                            selectedCategory === cat
                              ? 'cursor-pointer bg-amber-600 text-white dark:bg-amber-500 dark:text-amber-950'
                              : 'cursor-pointer border-amber-200 text-green-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-300 dark:hover:bg-white/5'
                          }
                          onClick={() =>
                            setSelectedCategory(selectedCategory === cat ? '' : cat)
                          }
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {tab === 'pharmacies' && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Ville</label>
                      <div className="flex flex-wrap gap-1.5">
                        {CITIES.map((city) => (
                          <Badge
                            key={city}
                            variant={selectedCity === city ? 'default' : 'outline'}
                            className={
                              selectedCity === city
                                ? 'cursor-pointer bg-green-600 text-white dark:bg-green-500 dark:text-green-950'
                                : 'cursor-pointer border-amber-200 text-green-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-300 dark:hover:bg-white/5'
                            }
                            onClick={() =>
                              setSelectedCity(selectedCity === city ? '' : city)
                            }
                          >
                            {city}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsGuardOnly(!isGuardOnly)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-colors ${
                          isGuardOnly
                            ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                            : 'border-amber-200 text-muted-foreground hover:bg-amber-50 dark:border-amber-900/50 dark:hover:bg-white/5'
                        }`}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Pharmacies de garde uniquement
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filter badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selectedCategory && (
              <Badge className="gap-1 bg-amber-100 text-xs text-green-700 dark:bg-amber-950/40 dark:text-amber-200">
                {selectedCategory}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
              </Badge>
            )}
            {selectedCity && (
              <Badge className="gap-1 bg-amber-100 text-xs text-green-700 dark:bg-amber-950/40 dark:text-amber-200">
                {selectedCity}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCity('')} />
              </Badge>
            )}
            {isGuardOnly && (
              <Badge className="gap-1 bg-amber-100 text-xs text-green-700 dark:bg-amber-950/40 dark:text-amber-200">
                Garde
                <X className="h-3 w-3 cursor-pointer" onClick={() => setIsGuardOnly(false)} />
              </Badge>
            )}
            {nearMe && (
              <Badge className="gap-1 bg-indigo-100 text-xs text-amber-700 dark:bg-indigo-950/40 dark:text-amber-200">
                <MapPin className="h-3 w-3" />
                Près de moi
                <X className="h-3 w-3 cursor-pointer" onClick={() => setNearMe(false)} />
              </Badge>
            )}
          </div>
        )}

        {/* Results */}
        <div className="space-y-2 sm:space-y-3">
          {!loading && displayResults.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3 flex justify-center">
                {tab === 'medications' ? (
                  <Pill className="w-12 h-12 text-amber-600" />
                ) : (
                  <Building2 className="w-12 h-12 text-amber-600" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? `Aucun résultat pour "${searchQuery}"`
                  : 'Entrez un terme de recherche'}
              </p>
            </div>
          )}

          {loading
            ? Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))
            : displayResults.map((item) =>
                tab === 'medications' ? (
                  <MedicationCard
                    key={item.id}
                    medication={item}
                    onClick={handleMedicationClick}
                  />
                ) : (
                  <PharmacyCard
                    key={item.id}
                    pharmacy={{ ...item, services: item.services || [], isFavorite: item.isFavorite || false }}
                    onClick={handlePharmacyClick}
                    distance={item.distance}
                    onFavoriteChange={() => fetchResults()}
                  />
                )
              )}
        </div>
      </div>
    </div>
  );
}
