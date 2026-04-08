/**
 * Local Notifications - Wrapper pour les notifications locales
 * Documentation: https://capacitorjs.com/docs/apis/local-notifications
 */

import {
  LocalNotifications as CapacitorLocalNotifications,
  LocalNotificationSchema,
  ScheduleOptions,
} from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Interface pour le groupe d'actions de notification
 */
interface ActionGroup {
  id: string;
  actions: Array<{
    id: string;
    title: string;
    destructive?: boolean;
    requiresAuthentication?: boolean;
    foreground?: boolean;
  }>;
}

/**
 * Vérifie si le plugin LocalNotifications est disponible
 */
export const isLocalNotificationsAvailable = (): boolean => {
  return Capacitor.isPluginAvailable('LocalNotifications');
};

/**
 * Options de notification
 */
export interface NotificationOptions {
  id?: number;
  title: string;
  body: string;
  largeBody?: string;
  summaryText?: string;
  iconColor?: string;
  sound?: string;
  schedule?: {
    at?: Date;
    repeats?: boolean;
    every?: 'year' | 'month' | 'two-weeks' | 'week' | 'day' | 'hour' | 'minute' | 'second';
    count?: number;
    on?: { year?: number; month?: number; day?: number; hour?: number; minute?: number };
  };
  extra?: Record<string, any>;
  actionTypeId?: string;
  attachments?: Array<{ id: string; url: string }>;
}

/**
 * Vérifie les permissions de notifications
 */
export const checkPermissions = async (): Promise<{ display: string }> => {
  if (!isLocalNotificationsAvailable()) {
    return { display: 'denied' };
  }

  try {
    const permissions = await CapacitorLocalNotifications.checkPermissions();
    return permissions;
  } catch (error) {
    console.error('Check notifications permissions error:', error);
    return { display: 'denied' };
  }
};

/**
 * Demande les permissions de notifications
 */
export const requestPermissions = async (): Promise<{ display: string }> => {
  if (!isLocalNotificationsAvailable()) {
    return { display: 'denied' };
  }

  try {
    const permissions = await CapacitorLocalNotifications.requestPermissions();
    return permissions;
  } catch (error) {
    console.error('Request notifications permissions error:', error);
    return { display: 'denied' };
  }
};

/**
 * Programme une notification locale
 * @param options - Options de notification
 * @returns L'ID de la notification
 */
export const scheduleNotification = async (options: NotificationOptions): Promise<number> => {
  if (!isLocalNotificationsAvailable()) {
    console.warn('LocalNotifications not available');
    return -1;
  }

  try {
    const notification: LocalNotificationSchema = {
      id: options.id ?? Date.now(),
      title: options.title,
      body: options.body,
      largeBody: options.largeBody,
      summaryText: options.summaryText,
      sound: options.sound ?? 'beep.wav',
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: options.iconColor ?? '#FF9800',
      schedule: options.schedule ? {
        at: options.schedule.at,
        repeats: options.schedule.repeats,
        every: options.schedule.every,
        count: options.schedule.count,
        on: options.schedule.on,
      } : undefined,
      extra: options.extra,
      attachments: options.attachments,
      actionTypeId: options.actionTypeId,
    };

    const scheduleResult = await CapacitorLocalNotifications.schedule({
      notifications: [notification],
    });

    return scheduleResult.notifications[0]?.id ?? -1;
  } catch (error) {
    console.error('Schedule notification error:', error);
    return -1;
  }
};

/**
 * Annule une notification programmée
 * @param id - ID de la notification
 */
export const cancelNotification = async (id: number): Promise<void> => {
  if (!isLocalNotificationsAvailable()) {
    console.warn('LocalNotifications not available');
    return;
  }

  try {
    await CapacitorLocalNotifications.cancel({ notifications: [{ id }] });
  } catch (error) {
    console.error('Cancel notification error:', error);
  }
};

/**
 * Annule toutes les notifications programmées
 */
export const cancelAllNotifications = async (): Promise<void> => {
  if (!isLocalNotificationsAvailable()) {
    console.warn('LocalNotifications not available');
    return;
  }

  try {
    // Get all scheduled notifications and cancel them
    const pending = await CapacitorLocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await CapacitorLocalNotifications.cancel({
        notifications: pending.notifications.map(n => ({ id: n.id })),
      });
    }
  } catch (error) {
    console.error('Cancel all notifications error:', error);
  }
};

/**
 * Récupère les notifications programmées
 */
export const getPendingNotifications = async (): Promise<LocalNotificationSchema[]> => {
  if (!isLocalNotificationsAvailable()) {
    return [];
  }

  try {
    const result = await CapacitorLocalNotifications.getPending();
    return result.notifications ?? [];
  } catch (error) {
    console.error('Get pending notifications error:', error);
    return [];
  }
};

/**
 * Récupère les notifications délivrées (read/unread)
 */
export const getDeliveredNotifications = async (): Promise<LocalNotificationSchema[]> => {
  if (!isLocalNotificationsAvailable()) {
    return [];
  }

  try {
    const result = await CapacitorLocalNotifications.getDeliveredNotifications();
    return result.notifications ?? [];
  } catch (error) {
    console.error('Get delivered notifications error:', error);
    return [];
  }
};

/**
 * Supprime toutes les notifications délivrées
 */
export const removeAllDeliveredNotifications = async (): Promise<void> => {
  if (!isLocalNotificationsAvailable()) {
    console.warn('LocalNotifications not available');
    return;
  }

  try {
    await CapacitorLocalNotifications.removeAllDeliveredNotifications();
  } catch (error) {
    console.error('Remove all delivered notifications error:', error);
  }
};

/**
 * Crée un groupe d'actions pour les notifications
 */
export const createActionGroup = async (
  id: string,
  actions: Array<{
    id: string;
    title: string;
    destructive?: boolean;
    requiresAuthentication?: boolean;
    foreground?: boolean;
  }>
): Promise<string | null> => {
  if (!isLocalNotificationsAvailable()) {
    return null;
  }

  try {
    await CapacitorLocalNotifications.registerActionTypes({
      types: [
        {
          id,
          actions: actions.map(action => ({
            id: action.id,
            title: action.title,
            destructive: action.destructive ?? false,
            requiresAuthentication: action.requiresAuthentication ?? false,
            foreground: action.foreground ?? false,
          })),
        },
      ],
    });
    return id;
  } catch (error) {
    console.error('Create action group error:', error);
    return null;
  }
};

/**
 * Enregistre un écouteur d'action de notification
 */
export const addNotificationActionListener = (callback: (action: { id: string; notificationId: number }) => void) => {
  if (!isLocalNotificationsAvailable()) return { remove: () => {} };

  return CapacitorLocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    callback({
      id: action.actionId,
      notificationId: action.notification?.id ?? -1,
    });
  });
};

/**
 * Enregistre un écouteur de délivrance de notification
 */
export const addNotificationReceivedListener = (callback: (notification: LocalNotificationSchema) => void) => {
  if (!isLocalNotificationsAvailable()) return { remove: () => {} };

  return CapacitorLocalNotifications.addListener('localNotificationReceived', callback);
};

/**
 * Notifications prédéfinies pour l'application
 */

/**
 * Notifie que la commande est prête
 */
export const notifyOrderReady = async (orderId: string, pharmacyName: string): Promise<number> => {
  return scheduleNotification({
    title: 'Commande prête !',
    body: `Votre commande chez ${pharmacyName} est prête à être récupérée.`,
    largeBody: `Passez à la pharmacie muni de votre code de vérification pour récupérer votre commande.`,
    sound: 'beep.wav',
    extra: { type: 'order_ready', orderId },
  });
};

/**
 * Notifie une alerte de stock
 */
export const notifyStockAlert = async (medicationName: string, quantity: number): Promise<number> => {
  return scheduleNotification({
    title: 'Alerte stock',
    body: `${medicationName} - Stock faible (${quantity} unités)`,
    largeBody: `Le stock de ${medicationName} est bas. Pensez à réapprovisionner.`,
    sound: 'beep.wav',
    extra: { type: 'stock_alert', medication: medicationName },
  });
};

/**
 * Notifie un rappel de médicament
 */
export const notifyMedicationReminder = async (medicationName: string): Promise<number> => {
  return scheduleNotification({
    title: 'Rappel médicament',
    body: `N'oubliez pas de prendre : ${medicationName}`,
    sound: 'beep.wav',
    extra: { type: 'medication_reminder', medication: medicationName },
  });
};

/**
 * Notifie une promotion
 */
export const notifyPromotion = async (title: string, message: string): Promise<number> => {
  return scheduleNotification({
    title,
    body: message,
    sound: 'beep.wav',
    extra: { type: 'promotion' },
  });
};

/**
 * Export de l'API
 */
export const LocalNotifications = {
  schedule: scheduleNotification,
  cancel: cancelNotification,
  cancelAll: cancelAllNotifications,
  getPending: getPendingNotifications,
  getDelivered: getDeliveredNotifications,
  removeAllDelivered: removeAllDeliveredNotifications,
  createActionGroup,
  checkPermissions,
  requestPermissions,
  addActionListener: addNotificationActionListener,
  addReceivedListener: addNotificationReceivedListener,

  // Notifications prédéfinies
  orderReady: notifyOrderReady,
  stockAlert: notifyStockAlert,
  medicationReminder: notifyMedicationReminder,
  promotion: notifyPromotion,
  isAvailable: isLocalNotificationsAvailable,
};
