'use client';

import { logger } from '@/lib/logger';
import { useState, useCallback } from 'react';
import { Geolocation as CapacitorGeolocation } from '@/lib/capacitor';
import { isNative } from '@/lib/capacitor';

const DEFAULT_LAT = 5.36;
const DEFAULT_LNG = -3.94;

export type UserLocation = {
  lat: number;
  lng: number;
};

export type LocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'fallback';

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [status, setStatus] = useState<LocationStatus>('fallback');

  const requestLocation = useCallback(async () => {
    setStatus('loading');

    try {
      // Utiliser le plugin Capacitor si disponible
      if (isNative) {
        const position = await CapacitorGeolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });

        setLocation({ lat: position.latitude, lng: position.longitude });
        setStatus('granted');
      } else if (navigator.geolocation) {
        // Fallback navigateur
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setStatus('granted');
          },
          () => {
            // Denied or unavailable — keep fallback
            setLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
            setStatus('denied');
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      } else {
        setLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
        setStatus('fallback');
      }
    } catch (error) {
      logger.error('Error getting location:', error);
      setLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
      setStatus('denied');
    }
  }, []);

  return { location, status, requestLocation };
}
