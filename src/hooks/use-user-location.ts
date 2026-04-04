'use client';

import { logger } from '@/lib/logger';
import { useState, useCallback } from 'react';

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

  const requestLocation = useCallback(() => {
    setStatus('loading');

    if (!navigator.geolocation) {
      setLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
      setStatus('fallback');
      return;
    }

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
  }, []);

  return { location, status, requestLocation };
}
