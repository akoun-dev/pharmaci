/**
 * Push Notifications - Wrapper pour les notifications push
 * Documentation: https://capacitorjs.com/docs/apis/push-notifications
 */

import {
  PushNotifications as CapacitorPushNotifications,
  PushNotificationSchema,
  Token,
  PushNotificationActionPerformed,
  PushNotificationToken,
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Vérifie si le plugin PushNotifications est disponible
 */
export const isPushNotificationsAvailable = (): boolean => {
  return Capacitor.isPluginAvailable('PushNotifications');
};

/**
 * Vérifie les permissions de notifications push
 */
export const checkPermissions = async (): Promise<{ receive: string }> => {
  if (!isPushNotificationsAvailable()) {
    return { receive: 'denied' };
  }

  try {
    const permissions = await CapacitorPushNotifications.checkPermissions();
    return permissions;
  } catch (error) {
    console.error('Check push notifications permissions error:', error);
    return { receive: 'denied' };
  }
};

/**
 * Demande les permissions de notifications push
 */
export const requestPermissions = async (): Promise<{ receive: string }> => {
  if (!isPushNotificationsAvailable()) {
    return { receive: 'denied' };
  }

  try {
    const permissions = await CapacitorPushNotifications.requestPermissions();
    return permissions;
  } catch (error) {
    console.error('Request push notifications permissions error:', error);
    return { receive: 'denied' };
  }
};

/**
 * Enregistre l'app pour recevoir les notifications push
 */
export const register = async (): Promise<void> => {
  if (!isPushNotificationsAvailable()) {
    console.warn('PushNotifications not available');
    return;
  }

  try {
    await CapacitorPushNotifications.register();
  } catch (error) {
    console.error('Register push notifications error:', error);
    throw error;
  }
};

/**
 * Désenregistre l'app des notifications push
 */
export const unregister = async (): Promise<void> => {
  if (!isPushNotificationsAvailable()) {
    console.warn('PushNotifications not available');
    return;
  }

  try {
    await CapacitorPushNotifications.unregister();
  } catch (error) {
    console.error('Unregister push notifications error:', error);
    throw error;
  }
};

/**
 * Écouteur d'événement pour l'enregistrement du token
 */
export const addRegistrationListener = (
  callback: (token: string) => void
) => {
  if (!isPushNotificationsAvailable()) return { remove: () => {} };

  return CapacitorPushNotifications.addListener('registration', (token: Token) => {
    callback(token.value);
  });
};

/**
 * Écouteur d'événement pour les erreurs d'enregistrement
 */
export const addRegistrationErrorListener = (
  callback: (error: string) => void
) => {
  if (!isPushNotificationsAvailable()) return { remove: () => {} };

  return CapacitorPushNotifications.addListener('registrationError', (error: any) => {
    callback(error.error);
  });
};

/**
 * Écouteur d'événement pour la réception d'une notification push
 */
export const addNotificationReceivedListener = (
  callback: (notification: PushNotificationSchema) => void
) => {
  if (!isPushNotificationsAvailable()) return { remove: () => {} };

  return CapacitorPushNotifications.addListener('pushNotificationReceived', callback);
};

/**
 * Écouteur d'événement pour l'action sur une notification push
 */
export const addNotificationActionPerformedListener = (
  callback: (notification: PushNotificationSchema) => void
) => {
  if (!isPushNotificationsAvailable()) return { remove: () => {} };

  return CapacitorPushNotifications.addListener(
    'pushNotificationActionPerformed',
    (action: PushNotificationActionPerformed) => {
      if (action.notification) {
        callback(action.notification);
      }
    }
  );
};

/**
 * Supprime tous les écouteurs
 */
export const removeAllListeners = async (): Promise<void> => {
  if (!isPushNotificationsAvailable()) {
    console.warn('PushNotifications not available');
    return;
  }

  try {
    await CapacitorPushNotifications.removeAllListeners();
  } catch (error) {
    console.error('Remove all push notification listeners error:', error);
  }
};

/**
 * Récupère le token d'enregistrement actuel
 * Note: Le token est fourni via l'écouteur 'registration'
 */
export const getCurrentToken = async (): Promise<string | null> => {
  // Le token est géré par le système et fourni via l'écouteur
  // Cette fonction est un placeholder pour une implémentation future
  console.warn('Token is provided via registration listener');
  return null;
};

/**
 * Configuration des notifications push pour l'application
 * Cette fonction configure les écouteurs et enregistre l'app
 */
export const setupPushNotifications = async (
  onTokenReceived: (token: string) => void,
  onNotificationReceived: (notification: PushNotificationSchema) => void,
  onNotificationActionPerformed: (notification: PushNotificationSchema) => void
): Promise<void> => {
  if (!isPushNotificationsAvailable()) {
    console.warn('PushNotifications not available');
    return;
  }

  try {
    // Vérifier et demander les permissions
    const permissions = await requestPermissions();
    if (permissions.receive !== 'granted') {
      console.warn('Push notification permissions not granted');
      return;
    }

    // Enregistrer l'app
    await register();

    // Configurer les écouteurs
    addRegistrationListener(onTokenReceived);
    addRegistrationErrorListener((error) => {
      console.error('Push notification registration error:', error);
    });
    addNotificationReceivedListener(onNotificationReceived);
    addNotificationActionPerformedListener(onNotificationActionPerformed);
  } catch (error) {
    console.error('Setup push notifications error:', error);
    throw error;
  }
};

/**
 * Export de l'API
 */
export const PushNotifications = {
  register,
  unregister,
  checkPermissions,
  requestPermissions,
  addRegistrationListener,
  addRegistrationErrorListener,
  addNotificationReceivedListener,
  addNotificationActionPerformedListener,
  removeAllListeners,
  setup: setupPushNotifications,
  isAvailable: isPushNotificationsAvailable,
};
