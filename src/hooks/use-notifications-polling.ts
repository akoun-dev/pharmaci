/**
 * Hook de polling pour les notifications en temps réel
 *
 * Comportement intelligent :
 * - Polling toutes les 30s quand la page est visible
 * - Pause quand l'utilisateur quitte l'onglet
 * - Pause quand l'utilisateur est inactif (> 5 min)
 * - Rafraîchit automatiquement le compteur de notifications
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/app-store';

interface NotificationData {
  count: number;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
  }>;
}

let globalNotificationCount = 0;
let globalLastNotificationId = '';
let globalListeners: Set<(count: number) => void> = new Set();

/**
 * Récupère les notifications depuis l'API
 */
async function fetchNotifications(role?: string | null): Promise<NotificationData | null> {
  try {
    const endpoint = role === 'pharmacist'
      ? '/api/pharmacist/notifications?limit=50'
      : '/api/notifications?limit=50';

    const response = await fetch(endpoint);
    if (!response.ok) return null;

    const data = await response.json();
    const count = data.unreadCount || 0;

    return {
      count,
      notifications: data.notifications || [],
    };
  } catch {
    return null;
  }
}

/**
 * Hook pour le polling des notifications
 */
export function useNotificationsPolling(options: { enabled?: boolean; onUpdate?: (data: NotificationData) => void } = {}) {
  const { enabled = true, onUpdate } = options;
  const { currentUser } = useAppStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  const lastCountRef = useRef(0);

  /**
   * Déclenche le rafraîchissement des notifications
   */
  const refreshNotifications = useCallback(async () => {
    if (!currentUser || !enabled) return;

    const data = await fetchNotifications(currentUser.role);
    if (!data) return;

    // Mise à jour du compteur global
    if (data.count !== globalNotificationCount) {
      globalNotificationCount = data.count;
      lastCountRef.current = data.count;

      // Notifier tous les listeners
      globalListeners.forEach((listener) => listener(data.count));

      // Callback personnalisé
      if (onUpdate) {
        onUpdate(data);
      }
    }
  }, [currentUser, enabled, onUpdate]);

  /**
   * Démarre le polling
   */
  const startPolling = useCallback(() => {
    if (!currentUser || !enabled || intervalRef.current) return;

    // Fetch immédiat
    refreshNotifications();

    // Puis interval régulier (30 secondes)
    intervalRef.current = setInterval(() => {
      refreshNotifications();
    }, 30000);
  }, [currentUser, enabled, refreshNotifications]);

  /**
   * Arrête le polling
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Gestion de la visibilité de la page
   * - Polling quand la page est visible
   * - Pause quand l'utilisateur quitte l'onglet
   */
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Démarrer initial
    startPolling();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopPolling();
      if (visibilityHandlerRef.current) {
        visibilityHandlerRef.current();
        visibilityHandlerRef.current = null;
      }
    };
  }, [enabled, startPolling, stopPolling]);

  /**
   * Gestion de l'inactivité de l'utilisateur
   * - Pause après 5 min d'inactivité
   */
  useEffect(() => {
    if (!enabled) return;

    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        stopPolling();
      }, 300000); // 5 minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'touchstart', 'scroll'];

    events.forEach((event) => {
      document.addEventListener(event, () => {
        // Réactiver le polling si l'utilisateur redevient actif
        if (!intervalRef.current && !document.hidden) {
          startPolling();
        }
        resetTimer();
      });
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
      clearTimeout(inactivityTimer);
    };
  }, [enabled, startPolling, stopPolling]);

  return {
    refreshNotifications,
    startPolling,
    stopPolling,
    isPolling: !!intervalRef.current,
  };
}

/**
 * Hook pour accéder au compteur global de notifications
 * Permet le partage entre composants sans polling multiple
 */
export function useGlobalNotificationCount() {
  const [count, setCount] = useState(globalNotificationCount);

  useEffect(() => {
    const listener = (newCount: number) => {
      setCount(newCount);
    };

    globalListeners.add(listener);

    // S'assurer que le compteur est à jour
    if (count !== globalNotificationCount) {
      setCount(globalNotificationCount);
    }

    return () => {
      globalListeners.delete(listener);
    };
  }, [count]);

  return count;
}

/**
 * Force le rafraîchissement immédiat des notifications
 * Utile après des actions qui créent des notifications
 */
export function refreshNotifications() {
  return fetchNotifications().then((data) => {
    if (data) {
      globalNotificationCount = data.count;
      globalListeners.forEach((listener) => listener(data.count));
    }
    return data;
  });
}

/**
 * Réinitialise le compteur global (à utiliser lors de la déconnexion)
 */
export function resetGlobalNotificationCount() {
  globalNotificationCount = 0;
  globalLastNotificationId = '';
  globalListeners.forEach((listener) => listener(0));
}
