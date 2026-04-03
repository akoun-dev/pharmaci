/**
 * Navigation and utility functions for pharmacy visit experience.
 */

/** Haversine distance in km between two lat/lng points */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Open Google Maps directions in new tab */
export function openGoogleMaps(lat: number, lng: number, name?: string): void {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${name ? `&destination_place_id=${encodeURIComponent(name)}` : ''}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/** Open Waze navigation in new tab */
export function openWaze(lat: number, lng: number): void {
  const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/** Format distance for display */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Payment method labels in French */
export const PAYMENT_LABELS: Record<string, string> = {
  especes: 'Espèces',
  orange_money: 'Orange Money',
  wave: 'Wave',
  mtn_money: 'MTN Money',
  carte: 'Carte bancaire',
};

/** Payment method icons (emoji) */
export const PAYMENT_ICONS: Record<string, string> = {
  especes: '💵',
  orange_money: '🟠',
  wave: '🌊',
  mtn_money: '🟡',
  carte: '💳',
};
