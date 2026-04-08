'use client';

import { logger } from '@/lib/logger';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Geolocation as CapacitorGeolocation } from '@/lib/capacitor';
import { isNative } from '@/lib/capacitor';

const DEFAULT_LAT = 5.36;
const DEFAULT_LNG = -3.94;

export type UserLocation = {
  lat: number;
  lng: number;
};

export type LocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'fallback';

interface UseUserLocationOptions {
  /** Request location automatically on mount */
  autoRequest?: boolean;
  /** Delay before auto-requesting (ms) */
  delay?: number;
}

export function useUserLocation(options: UseUserLocationOptions = {}) {
  const { autoRequest = false, delay = 1000 } = options;
  const [location, setLocation] = useState<UserLocation>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [status, setStatus] = useState<LocationStatus>('idle');
  const hasAutoRequested = useRef(false);

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

  // Auto-request location on mount if enabled
  useEffect(() => {
    if (autoRequest && !hasAutoRequested.current) {
      hasAutoRequested.current = true;
      const timer = setTimeout(() => {
        requestLocation();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [autoRequest, delay, requestLocation]);

  return { location, status, requestLocation };
}
