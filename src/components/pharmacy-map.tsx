'use client';

import { logger } from '@/lib/logger';
import { useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { openGoogleMaps } from '@/lib/navigation';

type Pharmacy = {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  isGuard: boolean;
  rating: number | null;
};

type PharmacyMapProps = {
  pharmacies: Pharmacy[];
  onPharmacyClick?: (id: string) => void;
  onReady?: () => void;
};

const DEFAULT_CENTER: [number, number] = [7.5, -5.5];
const DEFAULT_ZOOM = 7;

// Create icons outside component since this module is only loaded client-side (ssr: false)
const regularIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 32px; height: 32px;
    background: #d1fae5;
    border: 2px solid #059669;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  ">
    <div style="
      width: 10px; height: 10px;
      background: #059669;
      border-radius: 50%;
      transform: rotate(45deg);
    "></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const guardIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 32px; height: 32px;
    background: #fef3c7;
    border: 2px solid #d97706;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  ">
    <div style="
      width: 10px; height: 10px;
      background: #d97706;
      border-radius: 50%;
      transform: rotate(45deg);
    "></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export function PharmacyMap({ pharmacies, onPharmacyClick, onReady }: PharmacyMapProps) {
  // Compute map bounds from pharmacy positions
  const mapBounds = useMemo(() => {
    if (pharmacies.length === 0) return undefined;
    const validPharmacies = pharmacies.filter(p => p.latitude && p.longitude);
    if (validPharmacies.length === 0) return undefined;
    const lats = validPharmacies.map(p => p.latitude);
    const lngs = validPharmacies.map(p => p.longitude);
    return [
      [Math.min(...lats) - 0.05, Math.min(...lngs) - 0.05],
      [Math.max(...lats) + 0.05, Math.max(...lngs) + 0.05],
    ] as [[number, number], [number, number]];
  }, [pharmacies]);

  const handleClick = (id: string) => {
    onPharmacyClick?.(id);
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        bounds={mapBounds}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        whenReady={() => onReady?.()}
      >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {pharmacies.map((p) => {
        if (!p.latitude || !p.longitude) return null;
        return (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={p.isGuard ? guardIcon : regularIcon}
            eventHandlers={{
              click: () => handleClick(p.id),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]" style={{ fontFamily: 'system-ui, sans-serif' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>
                  {p.name}
                </h3>
                {p.isGuard && (
                  <span style={{
                    display: 'inline-block',
                    background: '#fef3c7',
                    color: '#d97706',
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 8,
                    marginBottom: 4,
                  }}>
                    🛡️ Garde
                  </span>
                )}
                <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0' }}>
                  📍 {p.address}, {p.city}
                </p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0' }}>
                  📞 {p.phone}
                </p>
                {p.rating != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>
                      {p.rating.toFixed(1)} ⭐
                    </span>
                  </div>
                )}
                <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                  <a
                    href={`tel:${p.phone}`}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '6px 8px',
                      background: '#059669',
                      color: 'white',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    📞 Appeler
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openGoogleMaps(p.latitude, p.longitude, p.name);
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '6px 8px',
                      background: '#2563eb',
                      color: 'white',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    🧭 Y aller
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
    </div>
  );
}
