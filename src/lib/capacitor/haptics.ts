/**
 * Haptics - Wrapper pour les feedbacks vibreurs
 * Documentation: https://capacitorjs.com/docs/apis/haptics
 */

import { Haptics as CapacitorHaptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Vérifie si le plugin Haptics est disponible
 */
export const isHapticsAvailable = (): boolean => {
  return Capacitor.isPluginAvailable('Haptics');
};

/**
 * Types d'impacts disponibles
 */
export type HapticsImpactStyle = 'light' | 'medium' | 'heavy';

/**
 * Types de notifications
 */
export type HapticsNotificationType = 'success' | 'warning' | 'error';

/**
 * Éffectue une vibration d'impact
 * @param style - Intensité de l'impact (light, medium, heavy)
 */
export const hapticsImpact = async (style: HapticsImpactStyle = 'medium'): Promise<void> => {
  if (!isHapticsAvailable()) return;

  const impactStyle: Record<HapticsImpactStyle, ImpactStyle> = {
    light: ImpactStyle.Light,
    medium: ImpactStyle.Medium,
    heavy: ImpactStyle.Heavy,
  };

  try {
    await CapacitorHaptics.impact({ style: impactStyle[style] });
  } catch (error) {
    console.warn('Haptics impact error:', error);
  }
};

/**
 * Éffectue une vibration de notification
 * @param type - Type de notification (success, warning, error)
 */
export const hapticsNotification = async (type: HapticsNotificationType): Promise<void> => {
  if (!isHapticsAvailable()) return;

  const notificationType: Record<HapticsNotificationType, NotificationType> = {
    success: NotificationType.Success,
    warning: NotificationType.Warning,
    error: NotificationType.Error,
  };

  try {
    await CapacitorHaptics.notification({ type: notificationType[type] });
  } catch (error) {
    console.warn('Haptics notification error:', error);
  }
};

/**
 * Éffectue une vibration de sélection
 * Pour les interactions légères comme sélectionner un élément
 */
export const hapticsSelection = async (): Promise<void> => {
  if (!isHapticsAvailable()) return;

  try {
    await CapacitorHaptics.selectionStart();
    await CapacitorHaptics.selectionEnd();
  } catch (error) {
    console.warn('Haptics selection error:', error);
  }
};

/**
 * Éffectue une vibration personnalisée
 * @param duration - Durée en ms
 */
export const hapticsVibrate = async (duration: number): Promise<void> => {
  if (!isHapticsAvailable()) {
    // Fallback pour navigateur
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
    return;
  }

  try {
    await CapacitorHaptics.vibrate({ duration });
  } catch (error) {
    console.warn('Haptics vibrate error:', error);
  }
};

/**
 * Raccourcis pour les utilisations courantes
 */
export const Haptics = {
  impact: hapticsImpact,
  notification: hapticsNotification,
  selection: hapticsSelection,
  vibrate: hapticsVibrate,

  // Impacts rapides
  light: () => hapticsImpact('light'),
  medium: () => hapticsImpact('medium'),
  heavy: () => hapticsImpact('heavy'),

  // Notifications rapides
  success: () => hapticsNotification('success'),
  warning: () => hapticsNotification('warning'),
  error: () => hapticsNotification('error'),
};
