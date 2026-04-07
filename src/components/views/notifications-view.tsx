'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ShoppingCart,
  AlertTriangle,
  Star,
  MessageCircle,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewHeader } from '@/components/view-header';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  data?: string | null;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; colorClass: string; bgClass: string }> = {
  order: {
    icon: ShoppingCart,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-100',
  },
  message: {
    icon: MessageCircle,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-100',
  },
  alert: {
    icon: AlertTriangle,
    colorClass: 'text-red-600',
    bgClass: 'bg-red-100',
  },
  review: {
    icon: Star,
    colorClass: 'text-yellow-500',
    bgClass: 'bg-yellow-100',
  },
  stock: {
    icon: AlertTriangle,
    colorClass: 'text-orange-600',
    bgClass: 'bg-orange-100',
  },
  info: {
    icon: Bell,
    colorClass: 'text-orange-600',
    bgClass: 'bg-orange-100',
  },
};

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    if (diffH < 24) return `il y a ${diffH} h`;
    if (diffDays === 1) return 'hier';
    if (diffDays < 7) return `il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

export function NotificationsView() {
  const { setCurrentView, currentUserId } = useAppStore();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch {
      setError('Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'PUT' });
      if (!res.ok) throw new Error('Erreur');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch {
      toast.error('Impossible de marquer les notifications comme lues');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationData) => {
    // Mark as read
    if (!notification.read) {
      try {
        const res = await fetch(`/api/notifications/${notification.id}`, { method: 'PUT' });
        if (res.ok) {
          setNotifications((prev) =>
            prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
          );
        }
      } catch {
        // Silent fail for read mark — don't block navigation
      }
    }

    // Navigate for order notifications
    if (notification.type === 'order' && notification.data) {
      try {
        const parsed = JSON.parse(notification.data);
        if (parsed.orderId) {
          useAppStore.getState().selectOrder(parsed.orderId);
          setCurrentView('order-history');
          return;
        }
      } catch {
        // data not valid JSON, ignore
      }
    }

    // Navigate for message notifications
    if (notification.type === 'message' && notification.data) {
      try {
        const parsed = JSON.parse(notification.data);
        if (parsed.senderId) {
          // Navigate to messages (if we have a messages view for patients)
          // For now, we'll just show a toast
          toast.info('Ouvrez la messagerie pour répondre');
          return;
        }
      } catch {
        // data not valid JSON, ignore
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full px-4 sm:px-6 py-4">
        <ViewHeader
          title="Notifications"
          icon={<Bell className="h-5 w-5 text-amber-600" />}
        />
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Erreur de chargement</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={fetchNotifications}
              variant="outline"
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-4">
      {/* Header */}
      <ViewHeader
        title="Notifications"
        description="Retrouvez toutes vos alertes de commandes et messages importants."
        icon={<Bell className="h-5 w-5 text-amber-600" />}
      />

      {/* Unread count badge */}
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Badge className="bg-amber-600 text-white text-xs hover:bg-amber-700">
            {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      {/* Mark all read button */}
      {unreadCount > 0 && (
        <div className="mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 h-9 text-xs gap-1.5"
          >
            <CheckCheck className={`h-3.5 w-3.5 ${markingAll ? 'animate-spin' : ''}`} />
            Tout marquer comme lu
          </Button>
        </div>
      )}

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <Card className="border-amber-100">
          <CardContent className="p-8 text-center">
            <Inbox className="h-12 w-12 text-amber-300 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Aucune notification</h3>
            <p className="text-sm text-muted-foreground">
              Vos nouvelles alertes et messages apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 sm:space-y-3"
          >
            {notifications.map((notification, index) => {
              const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
              const Icon = config.icon;

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                >
                  <Card
                    className={`border overflow-hidden transition-colors cursor-pointer hover:border-amber-200 active:scale-[0.99] duration-150 ${
                      notification.read
                        ? 'border-amber-100 bg-white dark:bg-gray-900'
                        : 'border-amber-200 bg-amber-50 dark:bg-amber-950/30'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div
                          className={`flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 ${config.bgClass}`}
                        >
                          <Icon className={`h-4 w-4 ${config.colorClass}`} />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3
                                  className={`text-sm leading-tight ${
                                    notification.read
                                      ? 'font-medium text-muted-foreground'
                                      : 'font-bold text-foreground'
                                  }`}
                                >
                                  {notification.title}
                                </h3>
                                {!notification.read && (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          </div>
                          <p
                            className={`text-xs mt-1 leading-relaxed line-clamp-2 ${
                              notification.read ? 'text-muted-foreground' : 'text-foreground/80'
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1.5">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
