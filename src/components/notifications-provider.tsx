/**
 * Provider pour le système de notifications en temps réel
 *
 * Gère le polling global des notifications pour toute l'application
 * Évite les polling multiples depuis différents composants
 */

'use client';

import { useEffect } from 'react';
import { useNotificationsPolling } from '@/hooks/use-notifications-polling';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';

interface NotificationsProviderProps {
  children: React.ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const { isAuthenticated, currentUser } = useAppStore();

  // Callback quand de nouvelles notifications arrivent
  const handleNotificationUpdate = (data: { count: number; notifications?: Array<{ id: string; title: string; message: string }> }) => {
    // Afficher un toast si nouvelle notification et page visible
    if (data.count > 0 && data.notifications && data.notifications.length > 0) {
      const latestNotification = data.notifications[0];
      if (latestNotification && !latestNotification.read) {
        // Ne pas notifier si on vient juste de marquer comme lu
        const wasJustRead = sessionStorage.getItem('lastReadNotification') === latestNotification.id;
        if (!wasJustRead) {
          // Afficher toast seulement pour les notifications importantes
          if (latestNotification.type === 'order' || latestNotification.type === 'alert') {
            toast.message(latestNotification.title, {
              description: latestNotification.message,
              icon: latestNotification.type === 'order' ? '📦' : '⚠️',
              action: {
                label: 'Voir',
                onClick: () => {
                  // Naviguer vers les notifications
                  useAppStore.getState().setCurrentView(
                    currentUser?.role === 'pharmacist' ? 'ph-notifications' : 'notifications'
                  );
                },
              },
            });
          }
        }
      }
    }
  };

  // Activer le polling seulement si authentifié
  useNotificationsPolling({
    enabled: isAuthenticated,
    onUpdate: handleNotificationUpdate,
  });

  // Réinitialiser le compteur global à la déconnexion
  useEffect(() => {
    if (!isAuthenticated) {
      const { resetGlobalNotificationCount } = require('@/hooks/use-notifications-polling');
      resetGlobalNotificationCount();
    }
  }, [isAuthenticated]);

  return <>{children}</>;
}
