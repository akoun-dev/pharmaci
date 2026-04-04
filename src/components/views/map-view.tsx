'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  Navigation,
  Clock,
  Shield,
  MapPin,
  LocateFixed,
  Crosshair,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PharmacyCard } from '@/components/pharmacy-card';
import { ViewHeader } from '@/components/view-header';
import { useAppStore } from '@/store/app-store';
import { useUserLocation } from '@/hooks/use-user-location';
import { openGoogleMaps, haversineDistance, formatDistance } from '@/lib/navigation';

type MapFilter = 'all' | 'guard' | '24h';
type SortMode = 'distance' | 'rating';

const MAP_CENTER: [number, number] = [5.35, -4.00]; // Centré sur Abidjan
const MAP_ZOOM = 12;
const MAP_HEIGHT = 300;

export function MapView() {
  const { selectPharmacy, setCurrentView, currentUserId } = useAppStore();
  const { location, status, requestLocation } = useUserLocation();
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MapFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('distance');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateRequested, setLocateRequested] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  // Fetch pharmacies
  const fetchPharmacies = useCallback(async (f: MapFilter) => {
    setLoading(true);
    try {
      const uidParam = currentUserId ? `&userId=${currentUserId}` : '';
      let url = `/api/pharmacies?limit=50${uidParam}`;
      if (f === 'guard') url += '&isGuard=true';
      if (f === '24h') url += '&is24h=true';
      const res = await fetch(url);
      const data = await res.json();
      // L'API retourne { items: [...], pagination: {...} }
      setPharmacies(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      logger.error('Error fetching pharmacies:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchPharmacies('all');
  }, [fetchPharmacies]);

  const handleFilterChange = (f: MapFilter) => {
    setFilter(f);
    fetchPharmacies(f);
  };

  // Initialize Leaflet map imperatively
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled) return;
      LRef.current = L;

      const map = L.map(mapContainerRef.current!, {
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
        userMarkerRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Update map markers when pharmacies change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    // Clear existing pharmacy markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const validPharmacies = pharmacies.filter((p) => p.latitude && p.longitude);
    if (validPharmacies.length === 0) return;

    validPharmacies.forEach((p) => {
      const isGuard = p.isGuard;
      const color = isGuard ? '#d97706' : '#059669';
      const bgColor = isGuard ? '#fef3c7' : '#d1fae5';

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 32px; height: 32px;
          background: ${bgColor};
          border: 2px solid ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ">
          <div style="
            width: 10px; height: 10px;
            background: ${color};
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const distance = location
        ? haversineDistance(location.lat, location.lng, p.latitude, p.longitude)
        : null;
      const distStr = distance !== null ? formatDistance(distance) : '';

      const ratingStr = p.rating != null ? Number(p.rating).toFixed(1) : '';
      const ratingHtml = ratingStr
        ? `<div style="font-size:12px;color:#059669;font-weight:700;margin-top:4px;">${ratingStr} ⭐</div>`
        : '';
      const distHtml = distStr
        ? `<div style="font-size:11px;color:#6366f1;font-weight:600;margin-top:2px;">📍 ${distStr}</div>`
        : '';

      const popupContent = `
        <div style="padding:8px;min-width:200px;font-family:system-ui,sans-serif;">
          <h3 style="font-size:14px;font-weight:700;margin:0 0 4px;">${p.name}</h3>
          ${isGuard ? '<span style="display:inline-block;background:#fef3c7;color:#d97706;font-size:10px;padding:1px 6px;border-radius:8px;margin-bottom:4px;">🛡️ Garde</span>' : ''}
          <p style="font-size:12px;color:#6b7280;margin:2px 0;">📍 ${p.address}, ${p.city}</p>
          <p style="font-size:12px;color:#6b7280;margin:2px 0;">📞 ${p.phone}</p>
          ${ratingHtml}${distHtml}
          <div style="margin-top:6px;display:flex;gap:4px;">
            <a href="tel:${p.phone}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;padding:6px 8px;background:#059669;color:white;border-radius:8px;font-size:11px;font-weight:600;text-decoration:none;">📞 Appeler</a>
            <a href="javascript:void(0)" onclick="window.openGoogleMapsNav(${p.latitude},${p.longitude},'${(p.name || '').replace(/'/g, "\\'")}')" style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;padding:6px 8px;background:#2563eb;color:white;border-radius:8px;font-size:11px;font-weight:600;text-decoration:none;">🧭 Y aller</a>
          </div>
        </div>
      `;

      const marker = L.marker([p.latitude, p.longitude], { icon });
      marker.bindPopup(popupContent, { maxWidth: 300, closeButton: true });
      marker.on('click', () => selectPharmacy(p.id));
      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [pharmacies, mapReady, location, selectPharmacy]);

  // Update user location marker when location changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L || !location) return;

    // Remove previous user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userIcon = L.divIcon({
      className: 'user-marker',
      html: `<div style="
        width: 20px; height: 20px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker([location.lat, location.lng], { icon: userIcon, zIndexOffset: 1000 });
    marker.addTo(map);
    userMarkerRef.current = marker;
  }, [location, mapReady]);

  // Fly to user location when GPS resolves after a locate request
  useEffect(() => {
    if (!locateRequested || !location) return;
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([location.lat, location.lng], 13, { duration: 1 });
    }
    setLocating(false);
    setLocateRequested(false);
  }, [location, locateRequested]);

  const handleLocateMe = () => {
    setLocating(true);
    setLocateRequested(true);
    requestLocation();
  };

  // Expose openGoogleMaps globally for popup buttons
  useEffect(() => {
    (window as any).openGoogleMapsNav = openGoogleMaps;
    return () => {
      delete (window as any).openGoogleMapsNav;
    };
  }, []);

  // Compute distances and sort pharmacies
  const pharmaciesWithDistance = useMemo(() => {
    return pharmacies.map((p) => ({
      ...p,
      distance:
        p.latitude && p.longitude && location
          ? haversineDistance(location.lat, location.lng, p.latitude, p.longitude)
          : null,
    }));
  }, [pharmacies, location]);

  const sortedPharmacies = useMemo(() => {
    const arr = [...pharmaciesWithDistance];
    if (sortMode === 'distance') {
      arr.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else {
      arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return arr;
  }, [pharmaciesWithDistance, sortMode]);

  // Group sorted pharmacies by city
  const pharmaciesByCity = useMemo(() => {
    return sortedPharmacies.reduce<Record<string, any[]>>((acc, p) => {
      if (!acc[p.city]) acc[p.city] = [];
      acc[p.city].push(p);
      return acc;
    }, {});
  }, [sortedPharmacies]);

  const handlePharmacyClick = (id: string) => {
    selectPharmacy(id);
    setCurrentView('pharmacy-detail');
  };

  return (
    <div className="pb-4">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ViewHeader title="Carte" icon={<Navigation className="h-5 w-5 text-emerald-600" />} />

        {/* Filter buttons + Sort + Near me */}
        <div className="flex flex-wrap gap-1.5 mb-2 sm:mb-3 items-center">
          {(['all', 'guard', '24h'] as MapFilter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange(f)}
              className={
                filter === f
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs'
                  : 'border-emerald-200 text-emerald-700 text-xs'
              }
            >
              {f === 'all' ? (
                'Toutes'
              ) : f === 'guard' ? (
                <>
                  <Shield className="h-3 w-3 mr-1" />
                  Garde
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  24h/24
                </>
              )}
            </Button>
          ))}

          {/* Sort toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortMode(sortMode === 'distance' ? 'rating' : 'distance')}
            className={
              sortMode === 'distance'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 text-xs'
                : 'border-emerald-200 text-emerald-700 text-xs'
            }
          >
            <ArrowUpDown className="h-3 w-3 mr-1" />
            {sortMode === 'distance' ? 'Plus proches' : 'Meilleures'}
          </Button>

          {selectedCity && (
            <Badge
              className="bg-emerald-100 text-emerald-700 self-center ml-auto gap-1 cursor-pointer text-xs"
              onClick={() => setSelectedCity(null)}
            >
              {selectedCity} ✕
            </Badge>
          )}
        </div>

        {/* Leaflet Map */}
        <div className="relative mb-3 sm:mb-4">
          {!mapReady && (
            <div
              className="rounded-2xl border border-emerald-200 mb-3 sm:mb-4 animate-pulse bg-emerald-50"
              style={{ height: MAP_HEIGHT }}
            />
          )}
          <div
            ref={mapContainerRef}
            className="rounded-2xl overflow-hidden border border-emerald-200"
            style={{ height: MAP_HEIGHT, width: '100%' }}
          />

          {/* Floating "Ma position" button */}
          <button
            onClick={handleLocateMe}
            className="absolute bottom-3 left-3 z-[1000] bg-white border border-emerald-200 shadow-lg rounded-full w-11 h-11 flex items-center justify-center hover:bg-emerald-50 transition-colors"
            title="Ma position"
          >
            {locating ? (
              <Crosshair className="h-5 w-5 text-emerald-600 animate-pulse" />
            ) : (
              <LocateFixed className="h-5 w-5 text-emerald-600" />
            )}
          </button>

          {/* Location status badge */}
          {status === 'granted' && location && (
            <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm border border-blue-200 rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
              <span className="text-[11px] font-medium text-blue-700">Position GPS</span>
            </div>
          )}
          {status === 'denied' && (
            <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm border border-amber-200 rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
              <span className="text-[11px] font-medium text-amber-700">Position estimée</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-1">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Pharmacie</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Garde</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
            <span>Vous</span>
          </div>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {pharmacies.length} pharmacie{pharmacies.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Pharmacy list sorted by distance/rating */}
        {loading ? (
          <div className="space-y-2 sm:space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {Object.entries(
              selectedCity
                ? { [selectedCity]: pharmaciesByCity[selectedCity] }
                : pharmaciesByCity
            ).map(([city, cityPharmacies]) =>
              Array.isArray(cityPharmacies) && cityPharmacies.length > 0 ? (
                <div key={city}>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <h3 className="font-semibold text-sm">{city}</h3>
                    <Badge variant="secondary" className="text-[10px] ml-auto">
                      {cityPharmacies.length} pharmacie{cityPharmacies.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {cityPharmacies.map((p: any) => (
                      <PharmacyCard
                        key={p.id}
                        pharmacy={{ ...p, services: p.services || [], isFavorite: p.isFavorite || false }}
                        onClick={handlePharmacyClick}
                        compact
                        distance={p.distance}
                        onFavoriteChange={() => fetchPharmacies(filter)}
                      />
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
