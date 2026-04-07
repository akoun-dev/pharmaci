/**
 * Geolocation - Wrapper pour la localisation GPS
 * Documentation: https://capacitorjs.com/docs/apis/geolocation
 */

import { Geolocation as CapacitorGeolocation, Position, PositionOptions, WatchPositionId } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

/**
 * Vérifie si le plugin Geolocation est disponible
 */
export const isGeolocationAvailable = (): boolean => {
  return Capacitor.isPluginAvailable('Geolocation');
};

/**
 * Options de localisation
 */
export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Position géographique étendue
 */
export interface GeoPosition extends Position {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

/**
 * Récupère la position actuelle
 * @param options - Options de localisation
 * @returns La position actuelle
 */
export const getCurrentPosition = async (options: GeolocationOptions = {}): Promise<GeoPosition> => {
  const geolocationOptions: PositionOptions = {
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    timeout: options.timeout ?? 10000,
    maximumAge: options.maximumAge ?? 0,
  };

  try {
    if (isGeolocationAvailable()) {
      const position = await CapacitorGeolocation.getCurrentPosition(geolocationOptions);
      return {
        ...position,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude ?? undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ?? undefined,
      };
    } else {
      // Fallback navigateur
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not available'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude ?? undefined,
              altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
              heading: position.coords.heading ?? undefined,
              speed: position.coords.speed ?? undefined,
              timestamp: position.timestamp,
            } as GeoPosition);
          },
          (error) => reject(error),
          geolocationOptions
        );
      });
    }
  } catch (error) {
    console.error('Geolocation error:', error);
    throw error;
  }
};

/**
 * Vérifie les permissions de localisation
 */
export const checkPermissions = async (): Promise<{ location: string; coarseLocation: string }> => {
  if (!isGeolocationAvailable()) {
    return { location: 'prompt', coarseLocation: 'prompt' };
  }

  try {
    const permissions = await CapacitorGeolocation.checkPermissions();
    return permissions;
  } catch (error) {
    console.error('Check geolocation permissions error:', error);
    return { location: 'prompt', coarseLocation: 'prompt' };
  }
};

/**
 * Demande les permissions de localisation
 */
export const requestPermissions = async (): Promise<{ location: string; coarseLocation: string }> => {
  if (!isGeolocationAvailable()) {
    return { location: 'prompt', coarseLocation: 'prompt' };
  }

  try {
    const permissions = await CapacitorGeolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
    return permissions;
  } catch (error) {
    console.error('Request geolocation permissions error:', error);
    return { location: 'prompt', coarseLocation: 'prompt' };
  }
};

/**
 * Surveille les changements de position
 * @param callback - Fonction appelée à chaque changement
 * @param options - Options de localisation
 * @returns ID pour arrêter le suivi
 */
export const watchPosition = (
  callback: (position: GeoPosition, err?: Error) => void,
  options: GeolocationOptions = {}
): WatchPositionId => {
  const geolocationOptions: PositionOptions = {
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    timeout: options.timeout ?? 10000,
    maximumAge: options.maximumAge ?? 0,
  };

  if (isGeolocationAvailable()) {
    return CapacitorGeolocation.watchPosition(geolocationOptions, (position, err) => {
      if (err) {
        callback({} as GeoPosition, new Error(err.message ?? 'Geolocation error'));
      } else {
        callback({
          ...position,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
        });
      }
    });
  } else {
    // Fallback navigateur
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
          timestamp: position.timestamp,
        } as GeoPosition);
      },
      (error) => callback({} as GeoPosition, error),
      geolocationOptions
    );

    return { id: `${watchId}` } as WatchPositionId;
  }
};

/**
 * Arrête le suivi de position
 * @param id - ID du suivi à arrêter
 */
export const clearWatch = async (id: WatchPositionId): Promise<void> => {
  if (isGeolocationAvailable()) {
    try {
      await CapacitorGeolocation.clearWatch(id);
    } catch (error) {
      console.error('Clear watch error:', error);
    }
  } else {
    const watchId = parseInt(id.id);
    if (!isNaN(watchId)) {
      navigator.geolocation.clearWatch(watchId);
    }
  }
};

/**
 * Calcule la distance entre deux positions (en mètres)
 * Utilise la formule de Haversine
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calcule la distance entre deux positions
 */
export const distanceBetween = (
  pos1: { latitude: number; longitude: number },
  pos2: { latitude: number; longitude: number }
): number => {
  return calculateDistance(pos1.latitude, pos1.longitude, pos2.latitude, pos2.longitude);
};

/**
 * Export de l'API
 */
export const Geolocation = {
  getCurrentPosition,
  checkPermissions,
  requestPermissions,
  watchPosition,
  clearWatch,
  calculateDistance,
  distanceBetween,
  isAvailable: isGeolocationAvailable,
};
