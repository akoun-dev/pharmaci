"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  Loader2,
  Navigation,
  Phone,
  MapPin,
  Locate,
  Star,
  Heart,
  X,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  pharmacyApi,
  type Pharmacy,
  formatFCFA,
  haversineDistance,
  formatDistance,
} from "@/lib/api";
import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/app/pharmacy-card";
import { cn } from "@/lib/utils";

// Fix default marker icon for Leaflet in bundlers — local files
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/marker-icon-2x.png",
  iconUrl: "/marker-icon.png",
  shadowUrl: "/marker-shadow.png",
});

// Custom green pharmacy marker
const pharmacyIcon = L.divIcon({
  className: "",
  html: `<div style="background: #16a34a; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
    <svg viewBox="0 0 24 24" fill="white" style="width: 14px; height: 14px; transform: rotate(45deg);"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4z"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Guard pharmacy marker (orange)
const guardIcon = L.divIcon({
  className: "",
  html: `<div style="background: #ea580c; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
    <svg viewBox="0 0 24 24" fill="white" style="width: 14px; height: 14px; transform: rotate(45deg);"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4z"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const userIcon = L.divIcon({
  className: "",
  html: `<div style="background: #2563eb; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 4px rgba(37,99,235,0.3);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const ABIDJAN_CENTER: [number, number] = [5.3599, -4.0083];

const NEARBY_RADIUS_KM = 10;

function Recenter({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 0.8 });
    }
  }, [center, map]);
  return null;
}

function computeDistance(
  userPos: [number, number] | null,
  pharmacy: Pharmacy
): number | null {
  if (!userPos) return null;
  return haversineDistance(
    userPos[0],
    userPos[1],
    pharmacy.latitude,
    pharmacy.longitude
  );
}

export function MapScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const pushToast = useAppStore((s) => s.pushToast);
  const user = useAppStore((s) => s.user);
  const setUserPosition = useAppStore((s) => s.setUserPosition);
  const navParams = useAppStore((s) => s.nav.params);

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardOnly, setGuardOnly] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [selected, setSelected] = useState<Pharmacy | null>(null);
  const [recenterTo, setRecenterTo] = useState<[number, number] | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favLoading, setFavLoading] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    void load();
  }, [guardOnly]);

  useEffect(() => {
    if (user) void loadFavorites();
  }, [user]);

  useEffect(() => {
    const lat = navParams.focusLat;
    const lng = navParams.focusLng;
    if (lat && lng) {
      const p: [number, number] = [parseFloat(lat), parseFloat(lng)];
      setRecenterTo(p);
      // Find and select the pharmacy
      const found = pharmacies.find(
        (ph) => Math.abs(ph.latitude - p[0]) < 0.01 && Math.abs(ph.longitude - p[1]) < 0.01
      );
      if (found) setSelected(found);
    }
  }, [navParams.focusLat, navParams.focusLng, pharmacies]);

  async function loadFavorites() {
    try {
      const res = await pharmacyApi.favorites();
      setFavorites(new Set(res.pharmacies.map((p) => p.id)));
    } catch {
      // ignore
    }
  }

  async function toggleFavorite(pharmacyId: string) {
    if (!user) { pushToast("Connectez-vous pour ajouter aux favoris.", "info"); return; }
    setFavLoading(true);
    try {
      if (favorites.has(pharmacyId)) {
        await pharmacyApi.favorite.remove(pharmacyId);
        setFavorites((prev) => { const next = new Set(prev); next.delete(pharmacyId); return next; });
        pushToast("Retiré des favoris.", "info");
      } else {
        await pharmacyApi.favorite.add(pharmacyId);
        setFavorites((prev) => new Set(prev).add(pharmacyId));
        pushToast("Ajouté aux favoris !", "success");
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setFavLoading(false);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const res = await pharmacyApi.list({
        onGuard: guardOnly || undefined,
        limit: 100,
      });
      setPharmacies(res.pharmacies);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function locateUser() {
    if (!("geolocation" in navigator)) {
      pushToast("Géolocalisation non disponible.", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(p);
        setUserPosition(p);
        setRecenterTo(p);
        setNearbyOnly(true);
        pushToast("Position localisée — pharmacies à proximité affichées.", "success");
      },
      () => pushToast("Impossible d'obtenir votre position.", "error"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // Filter & sort pharmacies
  const processedPharmacies = useMemo(() => {
    let list = [...pharmacies];
    if (!user) {
      list = list.filter((p) => !p.isOnGuard);
    }
    if (nearbyOnly && userPos) {
      list = list
        .map((p) => ({ ...p, _dist: computeDistance(userPos, p) }))
        .filter((p) => p._dist !== null && p._dist <= NEARBY_RADIUS_KM)
        .sort((a, b) => (a._dist ?? Infinity) - (b._dist ?? Infinity));
    }
    return list;
  }, [pharmacies, nearbyOnly, userPos]);

  const selectedDistance = selected ? computeDistance(userPos, selected) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppHeader title="Carte des pharmacies" showCart />
      {/* Filters */}
      <div className="flex items-center justify-between border-b border-border/60 bg-card px-4 py-2.5">
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2">
              <Switch
                id="guard"
                checked={guardOnly}
                onCheckedChange={setGuardOnly}
              />
              <label htmlFor="guard" className="text-sm font-medium text-foreground whitespace-nowrap">
                Garde
              </label>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch
              id="nearby"
              checked={nearbyOnly}
              onCheckedChange={setNearbyOnly}
              disabled={!userPos}
            />
            <label
              htmlFor="nearby"
              className={cn(
                "text-sm font-medium whitespace-nowrap",
                userPos ? "text-foreground" : "text-muted-foreground"
              )}
            >
              À proximité
            </label>
          </div>
        </div>
        <button
          onClick={locateUser}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
          aria-label="Me localiser"
        >
          <Locate className="h-4 w-4" />
        </button>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <MapContainer
          center={ABIDJAN_CENTER}
          zoom={12}
          className="absolute inset-0 z-0"
          ref={(m) => {
            mapRef.current = m;
          }}
          whenReady={() => {
            setTimeout(() => mapRef.current?.invalidateSize(), 100);
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <Recenter center={recenterTo} />
          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup>Vous êtes ici</Popup>
            </Marker>
          )}
          {processedPharmacies.map((p) => (
            <Marker
              key={p.id}
              position={[p.latitude, p.longitude]}
              icon={user && p.isOnGuard ? guardIcon : pharmacyIcon}
              eventHandlers={{
                click: () => {
                  setSelected(p);
                },
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <p className="font-bold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.address}</p>
                  {userPos && (
                    <p className="mt-1 text-xs font-semibold text-primary">
                      {formatDistance(computeDistance(userPos, p)!)}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Selected pharmacy card overlay */}
        {selected && (
          <div className="absolute inset-x-3 bottom-4 z-[1000] animate-fade-in-up">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
              <div className="flex items-start gap-3 p-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                  {selected.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-bold text-foreground">
                        {selected.name}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(selected.id); }}
                          disabled={favLoading}
                          className={cn(
                            "transition-colors",
                            favorites.has(selected.id) ? "text-red-500" : "text-muted-foreground hover:text-red-400"
                          )}
                          aria-label="Favori"
                        >
                          <Heart className={cn("h-4 w-4", favorites.has(selected.id) && "fill-current")} />
                        </button>
                        <StatusBadge isOnGuard={selected.isOnGuard} isOpen24h={selected.isOpen24h} />
                      </div>
                    </div>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {selected.address}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span className="font-semibold text-foreground">{selected.rating.toFixed(1)}</span>
                    </span>
                    <span className="text-muted-foreground">({selected.reviewCount})</span>
                    {selectedDistance !== null && (
                      <span className="flex items-center gap-0.5 font-semibold text-primary">
                        • {formatDistance(selectedDistance)}
                      </span>
                    )}
                  </div>
                  {user && selected.isOnGuard && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-500">
                      <Clock className="h-3 w-3" />
                      Pharmacie de garde
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 border-t border-border p-2">
                <a
                  href={`tel:${selected.phone}`}
                  className="flex items-center justify-center gap-1 rounded-lg bg-blue-500/10 py-2 text-xs font-semibold text-blue-500 hover:bg-blue-500/20"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Appeler
                </a>
                <a
                  href={`https://routing.openstreetmap.de/routed-car/route.html?start=${userPos ? `${userPos[1]},${userPos[0]}` : ""}&end=${selected.longitude},${selected.latitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Itinéraire
                </a>
                <button
                  onClick={() => navigate("pharmacy-detail", { id: selected.id })}
                  className="flex items-center justify-center gap-1 rounded-lg bg-muted py-2 text-xs font-semibold text-foreground hover:bg-muted/70"
                >
                  Détails
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nearby list panel */}
        {nearbyOnly && userPos && processedPharmacies.length > 0 && !selected && (
          <div className="absolute inset-x-3 bottom-4 z-[1000] max-h-[35vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-3 py-2">
              <p className="text-xs font-bold text-foreground">
                À proximité ({processedPharmacies.length})
              </p>
              <button
                onClick={() => setNearbyOnly(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-border/60">
              {processedPharmacies.map((p, idx) => {
                const dist = computeDistance(userPos, p);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelected(p);
                      setRecenterTo([p.latitude, p.longitude]);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="truncate text-sm font-semibold text-foreground">
                          {p.name}
                        </h4>
                        {user && p.isOnGuard && (
                          <span className="shrink-0 rounded bg-orange-500/10 px-1 py-0.5 text-[9px] font-bold text-orange-500">
                            Garde
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{p.address}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-primary">
                        {dist !== null ? formatDistance(dist) : "—"}
                      </p>
                      <p className="flex items-center gap-0.5 text-[10px] text-amber-500">
                        <Star className="h-3 w-3 fill-amber-500" />
                        {p.rating.toFixed(1)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {nearbyOnly && userPos && processedPharmacies.length === 0 && !selected && (
          <div className="absolute inset-x-3 bottom-4 z-[1000] rounded-2xl border border-border bg-card p-4 text-center shadow-xl">
            <p className="text-sm text-muted-foreground">
              Aucune pharmacie dans un rayon de {NEARBY_RADIUS_KM} km.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
