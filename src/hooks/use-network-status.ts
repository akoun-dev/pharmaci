/**
 * Hook React pour le statut réseau
 * Utilise le plugin Network de Capacitor
 */

import { useState, useEffect, useCallback } from 'react';
import { Network, NetworkStatusExtended, isNetworkAvailable } from '@/lib/capacitor/network';

/**
 * Hook pour utiliser le statut réseau
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatusExtended>({
    connected: true,
    connectionType: 'unknown',
  });
  const [loading, setLoading] = useState(true);

  // Récupérer le statut initial
  const refreshStatus = useCallback(async () => {
    setLoading(true);
    const currentStatus = await Network.getStatus();
    setStatus(currentStatus);
    setLoading(false);
    return currentStatus;
  }, []);

  // Initialiser le listener
  useEffect(() => {
    if (!isNetworkAvailable()) {
      // Fallback pour le web
      const handleOnline = () => {
        setStatus({
          connected: true,
          connectionType: 'unknown',
        });
        setLoading(false);
      };
      const handleOffline = () => {
        setStatus({
          connected: false,
          connectionType: 'none',
        });
        setLoading(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Statut initial
      handleOnline();

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Récupérer le statut initial
    refreshStatus();

    // Ajouter un écouteur pour les changements
    const removeListener = Network.addListener((newStatus) => {
      setStatus(newStatus);
      setLoading(false);
    });

    return removeListener;
  }, [refreshStatus]);

  return {
    ...status,
    loading,
    refresh: refreshStatus,
    isOnline: status.connected,
    isWiFi: status.connected && status.connectionType === 'wifi',
    isCellular: status.connected && status.connectionType === 'cellular',
  };
}

/**
 * Hook simplifié qui retourne uniquement si l'appareil est en ligne
 */
export function useIsOnline() {
  const { isOnline, loading } = useNetworkStatus();
  return { isOnline, loading };
}
