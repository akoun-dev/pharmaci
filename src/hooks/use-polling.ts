/**
 * Hook de polling intelligent pour le temps réel
 *
 * Stratégie :
 * - Polling actif seulement quand l'utilisateur est sur la page (Page Visibility API)
 * - Intervalle adaptatif selon le type de données
 * - Pause quand l'utilisateur est inactif
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface PollingOptions {
  enabled?: boolean;
  interval?: number; // en ms
  isActive?: boolean; // pour contrôler manuellement l'état actif
}

/**
 * Hook pour faire du polling intelligent
 */
export function usePolling<T>(
  fetchFn: () => Promise<T>,
  callback: (data: T) => void,
  options: PollingOptions = {}
) {
  const { enabled = true, interval = 30000, isActive: true } = options;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const startPolling = useCallback(() => {
    if (!enabled || intervalRef.current) return;

    setIsPolling(true);

    // Fetch immédiat
    fetchFn().then(callback).catch(() => {
      // Silent fail
    });

    // Puis interval régulier
    intervalRef.current = setInterval(() => {
      fetchFn().then(callback).catch(() => {
        // Silent fail
      });
    }, interval);
  }, [fetchFn, callback, enabled, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

  // Démarrer/arrêter selon isActive et enabled
  useEffect(() => {
    if (isActive && enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [isActive, enabled, startPolling, stopPolling]);

  return { isPolling, startPolling, stopPolling };
}

/**
 * Hook pour détecter si la page est visible (Page Visibility API)
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

/**
 * Hook pour détecter si l'utilisateur est inactif (pas de mouvement souris/touch)
 */
export function useUserInactivity(timeoutMs: number = 300000) { // 5 min par défaut
  const [isInactive, setIsInactive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsInactive(false);

    timeoutRef.current = setTimeout(() => {
      setIsInactive(true);
    }, timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'touchstart', 'scroll'];

    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer, timeoutMs]);

  return isInactive;
}
