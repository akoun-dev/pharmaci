/**
 * Hook React pour le feedback vibreur (Haptics)
 */

import { useCallback } from 'react';
import { Haptics as CapacitorHaptics } from '@/lib/capacitor';
import { isHapticsAvailable } from '@/lib/capacitor/haptics';

/**
 * Hook pour utiliser les feedbacks vibreurs
 */
export function useHaptics() {
  const available = isHapticsAvailable();

  const impact = useCallback((style: 'light' | 'medium' | 'heavy' = 'medium') => {
    CapacitorHaptics.impact(style);
  }, []);

  const notification = useCallback((type: 'success' | 'warning' | 'error') => {
    CapacitorHaptics.notification(type);
  }, []);

  const selection = useCallback(() => {
    CapacitorHaptics.selection();
  }, []);

  const vibrate = useCallback((duration: number) => {
    CapacitorHaptics.vibrate(duration);
  }, []);

  return {
    available,
    impact,
    notification,
    selection,
    vibrate,

    // Raccourcis
    light: () => impact('light'),
    medium: () => impact('medium'),
    heavy: () => impact('heavy'),
    success: () => notification('success'),
    warning: () => notification('warning'),
    error: () => notification('error'),
  };
}
