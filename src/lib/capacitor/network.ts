/**
 * Network - Wrapper pour la gestion du réseau
 * Documentation: https://capacitorjs.com/docs/apis/network
 */

import { Network as CapacitorNetwork } from '@capacitor/network';
import type { ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

/**
 * Vérifie si le plugin Network est disponible
 */
export const isNetworkAvailable = (): boolean => {
  return Capacitor.isPluginAvailable('Network');
};

/**
 * Type de connexion étendu avec des propriétés supplémentaires
 */
export type NetworkStatusExtended = ConnectionStatus;

/**
 * Récupère le statut actuel du réseau
 */
export const getStatus = async (): Promise<NetworkStatusExtended> => {
  if (!isNetworkAvailable()) {
    // Fallback pour le web
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return {
        connected: navigator.onLine,
        connectionType: navigator.onLine ? 'unknown' : 'none',
      };
    }
    return {
      connected: true,
      connectionType: 'unknown',
    };
  }

  try {
    return await CapacitorNetwork.getStatus();
  } catch (error) {
    console.error('Get network status error:', error);
    return {
      connected: true,
      connectionType: 'unknown',
    };
  }
};

/**
 * Vérifie si l'appareil est connecté à Internet
 */
export const isConnected = async (): Promise<boolean> => {
  const status = await getStatus();
  return status.connected;
};

/**
 * Vérifie si l'appareil est connecté en WiFi
 */
export const isWiFi = async (): Promise<boolean> => {
  const status = await getStatus();
  return status.connected && status.connectionType === 'wifi';
};

/**
 * Vérifie si l'appareil est connecté en données mobiles
 */
export const isCellular = async (): Promise<boolean> => {
  const status = await getStatus();
  return status.connected && status.connectionType === 'cellular';
};

/**
 * Type de listener pour les changements de réseau
 */
export type NetworkStatusListener = (status: NetworkStatusExtended) => void;

/**
 * Liste des listeners actifs
 */
const activeListeners = new Set<Promise<{ remove: () => void }>>();

/**
 * Ajoute un écouteur pour les changements de statut réseau
 * @param callback - Fonction appelée lors d'un changement de réseau
 * @returns Fonction pour supprimer l'écouteur
 */
export const addListener = (callback: NetworkStatusListener): (() => void) => {
  if (!isNetworkAvailable()) {
    // Fallback pour le web
    const handleOnline = () => callback({
      connected: true,
      connectionType: 'unknown',
    });
    const handleOffline = () => callback({
      connected: false,
      connectionType: 'none',
    });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  const listener = CapacitorNetwork.addListener('networkStatusChange', (status) => {
    callback(status);
  });

  activeListeners.add(listener);

  // Retourne une fonction pour supprimer l'écouteur
  return () => {
    listener.then(handle => {
      handle.remove();
      activeListeners.delete(listener);
    });
  };
};

/**
 * Supprime tous les écouteurs actifs
 */
export const removeAllListeners = async (): Promise<void> => {
  for (const listener of activeListeners) {
    const handle = await listener;
    await handle.remove();
  }
  activeListeners.clear();
};

/**
 * Export de l'API
 */
export const Network = {
  getStatus,
  isConnected,
  isWiFi,
  isCellular,
  addListener,
  removeAllListeners,
  isAvailable: isNetworkAvailable,
};
