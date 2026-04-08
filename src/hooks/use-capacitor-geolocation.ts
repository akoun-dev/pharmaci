/**
 * Hook React pour la géolocalisation
 */

import { useState, useCallback, useEffect } from 'react';
import { Geolocation as CapacitorGeolocation } from '@/lib/capacitor';
import type { GeoPosition, GeolocationOptions } from '@/lib/capacitor/geolocation';
import { toast } from 'sonner';

/**
 * Hook pour utiliser la géolocalisation
 */
export function useCapacitorGeolocation() {
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<string | null>(null);

  const checkPermissions = useCallback(async () => {
    const perms = await CapacitorGeolocation.checkPermissions();
    return perms;
  }, []);

  const requestPermissions = useCallback(async () => {
    const perms = await CapacitorGeolocation.requestPermissions();
    return perms;
  }, []);

  const getCurrentPosition = useCallback(async (options?: GeolocationOptions) => {
    setLoading(true);
    setError(null);
    try {
      const pos = await CapacitorGeolocation.getCurrentPosition(options);
      setPosition(pos);
      return pos;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de récupérer la position';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startWatching = useCallback((callback: (pos: GeoPosition) => void, options?: GeolocationOptions) => {
    const id = CapacitorGeolocation.watchPosition((pos, err) => {
      if (err) {
        setError(err.message);
        return;
      }
      setPosition(pos);
      callback(pos);
    }, options);
    setWatchId(id);
    return id;
  }, []);

  const stopWatching = useCallback(async () => {
    if (watchId) {
      await CapacitorGeolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // Nettoyer le watch lors du démontage
  useEffect(() => {
    return () => {
      if (watchId) {
        CapacitorGeolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    return CapacitorGeolocation.calculateDistance(lat1, lon1, lat2, lon2);
  }, []);

  const distanceBetween = useCallback((pos1: { latitude: number; longitude: number }, pos2: { latitude: number; longitude: number }) => {
    return CapacitorGeolocation.distanceBetween(pos1, pos2);
  }, []);

  return {
    loading,
    position,
    error,
    watching: watchId !== null,
    checkPermissions,
    requestPermissions,
    getCurrentPosition,
    startWatching,
    stopWatching,
    calculateDistance,
    distanceBetween,
  };
}
