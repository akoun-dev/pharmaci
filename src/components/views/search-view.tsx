'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Pill, Building2, SlidersHorizontal, X, MapPin, LocateFixed } from 'lucide-react';
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
        url = `/api/pharmacies?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  }, [tab, searchQuery, selectedCategory, selectedCity, isGuardOnly]);

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
        <ViewHeader title="Recherche" icon={<Search className="h-5 w-5 text-emerald-600" />} />

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
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs'
                : 'border-emerald-200 text-emerald-700 text-xs'
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
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs'
                : 'border-emerald-200 text-emerald-700 text-xs'
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
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white text-xs'
                  : 'border-indigo-200 text-indigo-700 text-xs'
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
            className="border-emerald-200 text-emerald-700 text-xs ml-auto"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
            Filtres
          </Button>
        </div>

        {/* Near me status indicator */}
        {nearMe && tab === 'pharmacies' && (
          <div className="flex items-center gap-2 mb-3 bg-indigo-50 rounded-xl px-3 py-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${status === 'granted' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
            <span className="text-xs text-indigo-700 font-medium">
              {status === 'granted'
                ? '📍 Résultats triés par proximité (GPS activé)'
                : status === 'loading'
                  ? '📡 Localisation en cours...'
                  : '⚠️ GPS non disponible — position estimée (Abidjan)'}
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
              <div className="bg-white rounded-xl border border-emerald-100 p-3 sm:p-4 mb-3 sm:mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Filtres</span>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-emerald-600 hover:underline"
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
                              ? 'bg-emerald-600 text-white cursor-pointer'
                              : 'cursor-pointer border-emerald-200 text-emerald-700 hover:bg-emerald-50'
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
                                ? 'bg-emerald-600 text-white cursor-pointer'
                                : 'cursor-pointer border-emerald-200 text-emerald-700 hover:bg-emerald-50'
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
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'border-emerald-200 text-muted-foreground hover:bg-emerald-50'
                        }`}
                      >
                        <span className="text-sm">🛡️</span>
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
              <Badge className="bg-emerald-100 text-emerald-700 gap-1 text-xs">
                {selectedCategory}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
              </Badge>
            )}
            {selectedCity && (
              <Badge className="bg-emerald-100 text-emerald-700 gap-1 text-xs">
                {selectedCity}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCity('')} />
              </Badge>
            )}
            {isGuardOnly && (
              <Badge className="bg-emerald-100 text-emerald-700 gap-1 text-xs">
                Garde
                <X className="h-3 w-3 cursor-pointer" onClick={() => setIsGuardOnly(false)} />
              </Badge>
            )}
            {nearMe && (
              <Badge className="bg-indigo-100 text-indigo-700 gap-1 text-xs">
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
              <div className="text-4xl mb-3">
                {tab === 'medications' ? '💊' : '🏥'}
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
                    pharmacy={{ ...item, services: item.services || [] }}
                    onClick={handlePharmacyClick}
                    distance={item.distance}
                  />
                )
              )}
        </div>
      </div>
    </div>
  );
}
