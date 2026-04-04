'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Pill,
  MapPin,
  Building2,
  Heart,
  TrendingUp,
  ChevronRight,
  LocateFixed,
  X,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PharmacyCard } from '@/components/pharmacy-card';
import { useAppStore } from '@/store/app-store';
import { useUserLocation } from '@/hooks/use-user-location';
import { haversineDistance } from '@/lib/navigation';

export function HomeView() {
  const { setCurrentView, selectPharmacy, selectMedication, setSearchQuery, currentUserId } = useAppStore();
  const { location, status, requestLocation } = useUserLocation();
  const [guardPharmacies, setGuardPharmacies] = useState<any[]>([]);
  const [allPharmacies, setAllPharmacies] = useState<any[]>([]);
  const [stats, setStats] = useState({ pharmacies: 0, medications: 0, cities: 0 });
  const [loading, setLoading] = useState(true);

  // Inline search state
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<{ medications: any[]; pharmacies: any[] }>({ medications: [], pharmacies: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch inline search results
  const fetchInlineResults = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ medications: [], pharmacies: [] });
      return;
    }
    setSearchLoading(true);
    try {
      const [medsRes, pharmaRes] = await Promise.all([
        fetch(`/api/medications?q=${encodeURIComponent(query)}&limit=4`),
        fetch(`/api/pharmacies?q=${encodeURIComponent(query)}&limit=3${currentUserId ? `&userId=${currentUserId}` : ''}`),
      ]);
      const medsData = await medsRes.json();
      const pharmaData = await pharmaRes.json();
      setSearchResults({ medications: medsData, pharmacies: pharmaData });
    } catch {
      setSearchResults({ medications: [], pharmacies: [] });
    } finally {
      setSearchLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    const timer = setTimeout(() => fetchInlineResults(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText, fetchInlineResults, currentUserId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasSearchResults = searchResults.medications.length > 0 || searchResults.pharmacies.length > 0;

  useEffect(() => {
    async function fetchData() {
      try {
        const uidParam = currentUserId ? `&userId=${currentUserId}` : '';
        const [guardRes, allPharmaciesRes, medsCountRes] = await Promise.all([
          fetch(`/api/pharmacies?isGuard=true&limit=5${uidParam}`),
          fetch(`/api/pharmacies?limit=50${uidParam}`),
          fetch('/api/medications?count=true'),
        ]);
        const guardData = await guardRes.json();
        const allData = await allPharmaciesRes.json();
        const medsCountData = await medsCountRes.json();

        setGuardPharmacies(guardData);
        setAllPharmacies(allData);
        const cities = new Set(allData.map((p: any) => p.city));
        setStats({
          pharmacies: allData.length,
          medications: medsCountData.total || 0,
          cities: cities.size,
        });
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentUserId]);

  // Compute nearest pharmacies
  const nearestPharmacies = useMemo(() => {
    if (!location || allPharmacies.length === 0) return [];
    return [...allPharmacies]
      .map((p) => ({
        ...p,
        distance:
          p.latitude && p.longitude
            ? haversineDistance(location.lat, location.lng, p.latitude, p.longitude)
            : null,
      }))
      .filter((p) => p.distance !== null)
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      .slice(0, 3);
  }, [allPharmacies, location]);

  const featuredPharmacies = useMemo(() => {
    return [...allPharmacies].sort((a: any, b: any) => b.rating - a.rating);
  }, [allPharmacies]);

  const goToFullSearch = () => {
    setSearchQuery(searchText);
    setShowDropdown(false);
    setCurrentView('search');
  };

  const handlePharmacyClick = (id: string) => {
    setShowDropdown(false);
    setSearchText('');
    selectPharmacy(id);
    setCurrentView('pharmacy-detail');
  };

  const handleMedicationClick = (id: string) => {
    setShowDropdown(false);
    setSearchText('');
    selectMedication(id);
    setCurrentView('medication-detail');
  };

  return (
    <div className="pb-4">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white px-4 sm:px-6 pt-5 sm:pt-6 pb-7 sm:pb-8 rounded-b-3xl"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Pharma CI</h1>
              <p className="text-emerald-200 text-xs">Côte d&apos;Ivoire</p>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold mb-1 leading-tight">
            Trouvez vos médicaments
          </h2>
          <p className="text-emerald-200 text-xs sm:text-sm mb-4 sm:mb-5">
            Pharmacies de garde, disponibilités et prix en temps réel
          </p>

          {/* Search Input */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm">
              <Search className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  if (searchText.trim()) setShowDropdown(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') goToFullSearch();
                }}
                placeholder="Rechercher un médicament, pharmacie..."
                className="flex-1 bg-transparent text-gray-700 text-sm placeholder:text-gray-400 outline-none"
              />
              {searchText && (
                <button
                  onClick={() => {
                    setSearchText('');
                    setShowDropdown(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showDropdown && searchText.trim() && (
                <motion.div
                  ref={searchDropdownRef}
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-emerald-100 z-50 overflow-hidden"
                >
                  {searchLoading ? (
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-24" />
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 rounded-lg" />
                      ))}
                    </div>
                  ) : hasSearchResults ? (
                    <div className="max-h-72 overflow-y-auto">
                      {/* Medications */}
                      {searchResults.medications.length > 0 && (
                        <div className="border-b border-emerald-50">
                          <div className="px-4 pt-3 pb-1.5">
                            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                              <Pill className="h-3 w-3" /> Médicaments
                            </span>
                          </div>
                          {searchResults.medications.map((med: any) => (
                            <button
                              key={med.id}
                              onClick={() => handleMedicationClick(med.id)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <Pill className="h-4 w-4 text-emerald-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{med.commercialName || med.name}</p>
                                <p className="text-[11px] text-gray-400 truncate">{med.activePrinciple || med.category}</p>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Pharmacies */}
                      {searchResults.pharmacies.length > 0 && (
                        <div>
                          <div className="px-4 pt-3 pb-1.5">
                            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> Pharmacies
                            </span>
                          </div>
                          {searchResults.pharmacies.map((pharma: any) => (
                            <button
                              key={pharma.id}
                              onClick={() => handlePharmacyClick(pharma.id)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-4 w-4 text-indigo-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{pharma.name}</p>
                                <p className="text-[11px] text-gray-400 truncate">{pharma.city}{pharma.district ? ` — ${pharma.district}` : ''}</p>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* See all results link */}
                      <div className="border-t border-emerald-100">
                        <button
                          onClick={goToFullSearch}
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          Voir tous les résultats
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-2xl mb-1.5">🔍</p>
                      <p className="text-xs text-gray-400">Aucun résultat pour « {searchText} »</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-5 sm:space-y-6 -mt-3">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-3 sm:p-4 grid grid-cols-3 gap-2 sm:gap-3"
        >
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-xl font-bold text-emerald-700">{stats.pharmacies}</p>
                <p className="text-[11px] text-muted-foreground">Pharmacies</p>
              </div>
              <div className="text-center border-x border-emerald-100">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Pill className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-xl font-bold text-emerald-700">{stats.medications}</p>
                <p className="text-[11px] text-muted-foreground">Médicaments</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-xl font-bold text-emerald-700">{stats.cities}</p>
                <p className="text-[11px] text-muted-foreground">Villes</p>
              </div>
            </>
          )}
        </motion.div>

        {/* Pharmacies proches — Nearest pharmacies */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <LocateFixed className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
              <h3 className="font-semibold text-sm text-foreground">Pharmacies proches</h3>
            </div>
            <button
              onClick={() => {
                requestLocation();
                setCurrentView('map');
              }}
              className="text-xs text-indigo-600 flex items-center gap-0.5 hover:underline"
            >
              Voir la carte <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {location && nearestPharmacies.length > 0 ? (
            <div className="space-y-2">
              {nearestPharmacies.map((p) => (
                <PharmacyCard
                  key={p.id}
                  pharmacy={{ ...p, services: p.services || [] }}
                  onClick={handlePharmacyClick}
                  compact
                  distance={p.distance}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-emerald-100 p-4 text-center">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              ) : (
                <>
                  <p className="text-3xl mb-2">📍</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    Activez votre GPS pour voir les pharmacies les plus proches
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      requestLocation();
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <LocateFixed className="h-4 w-4 mr-1" />
                    Activer la localisation
                  </Button>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Pharmacies de garde */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <span className="text-base sm:text-lg">🛡️</span>
            <h3 className="font-semibold text-sm text-foreground">Pharmacies de garde</h3>
          </div>
          {loading ? (
            <div className="space-y-2 sm:space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {guardPharmacies.map((p) => (
                <PharmacyCard
                  key={p.id}
                  pharmacy={{ ...p, services: p.services || [] }}
                  onClick={handlePharmacyClick}
                  compact
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Featured Pharmacies */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              <h3 className="font-semibold text-sm text-foreground">Meilleures pharmacies</h3>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {featuredPharmacies.slice(0, 4).map((p) => (
                <PharmacyCard
                  key={p.id}
                  pharmacy={{ ...p, services: p.services || [] }}
                  onClick={handlePharmacyClick}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
