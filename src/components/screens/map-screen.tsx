"use client";

import { useEffect, useState, useRef } from "react";
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

// Fix default marker icon for Leaflet in bundlers
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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

const userIcon = L.divIcon({
  className: "",
  html: `<div style="background: #2563eb; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 4px rgba(37,99,235,0.3);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const ABIDJAN_CENTER: [number, number] = [5.3599, -4.0083];

function Recenter({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 0.8 });
    }
  }, [center, map]);
  return null;
}

// Force Leaflet to recalculate its size after mount/layout
function ResizeFix() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export function MapScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const pushToast = useAppStore((s) => s.pushToast);

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardOnly, setGuardOnly] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [selected, setSelected] = useState<Pharmacy | null>(null);
  const [recenterTo, setRecenterTo] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    void load();
  }, [guardOnly]);

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
        setRecenterTo(p);
        pushToast("Position localisée.", "success");
      },
      () => pushToast("Impossible d'obtenir votre position.", "error"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppHeader title="Carte des pharmacies" />
      {/* Filter */}
      <div className="flex items-center justify-between border-b border-border/60 bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Switch
            id="guard"
            checked={guardOnly}
            onCheckedChange={setGuardOnly}
          />
          <label htmlFor="guard" className="text-sm font-medium text-foreground">
            Pharmacies de garde uniquement
          </label>
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
      <div className="relative min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <MapContainer
            center={ABIDJAN_CENTER}
            zoom={12}
            className="h-full w-full"
            ref={(m) => {
              mapRef.current = m;
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ResizeFix />
            <Recenter center={recenterTo} />
            {userPos && (
              <Marker position={userPos} icon={userIcon}>
                <Popup>Vous êtes ici</Popup>
              </Marker>
            )}
            {pharmacies.map((p) => (
              <Marker
                key={p.id}
                position={[p.latitude, p.longitude]}
                icon={pharmacyIcon}
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
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

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
                    <StatusBadge isOnGuard={selected.isOnGuard} isOpen24h={selected.isOpen24h} />
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {selected.address}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-0.5 text-amber-600">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span className="font-semibold text-foreground">{selected.rating.toFixed(1)}</span>
                    </span>
                    {userPos && (
                      <span className="text-muted-foreground">
                        • {formatDistance(haversineDistance(userPos[0], userPos[1], selected.latitude, selected.longitude))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 border-t border-border p-2">
                <a
                  href={`tel:${selected.phone}`}
                  className="flex items-center justify-center gap-1 rounded-lg bg-blue-50 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Appeler
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
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
      </div>
    </div>
  );
}
