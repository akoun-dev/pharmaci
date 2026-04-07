/**
 * Hook pour récupérer et gérer le compteur de notifications non lues
 */
import { useEffect, useState, useCallback } from 'react';

export function useUnreadNotifications(isAuthenticated: boolean, role?: string | null) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }

    setLoading(true);
    try {
      // Utiliser l'endpoint approprié selon le rôle
      const endpoint = role === 'pharmacist'
        ? '/api/pharmacist/notifications?unread=true&limit=1'
        : '/api/notifications?unread=true&limit=1';

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        // Le count peut être soit direct dans la réponse, soit la longueur du tableau
        const unreadCount = data.count ?? data.unreadCount ?? (Array.isArray(data.notifications) ? data.notifications.length : 0);
        setCount(unreadCount);
      }
    } catch {
      // Silently fail
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Rafraîchir toutes les 30 secondes
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchCount]);

  return { count, loading, refetch: fetchCount };
}
