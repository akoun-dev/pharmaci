/**
 * Hook React pour les notifications locales
 */

import { useState, useCallback, useEffect } from 'react';
import { LocalNotifications as CapacitorNotifications, NotificationOptions } from '@/lib/capacitor';
import type { LocalNotificationSchema } from '@capacitor/local-notifications';
import { toast } from 'sonner';

/**
 * Hook pour utiliser les notifications locales
 */
export function useCapacitorNotifications() {
  const [permissions, setPermissions] = useState<{ display: string } | null>(null);

  const checkPermissions = useCallback(async () => {
    const perms = await CapacitorNotifications.checkPermissions();
    setPermissions(perms);
    return perms;
  }, []);

  const requestPermissions = useCallback(async () => {
    const perms = await CapacitorNotifications.requestPermissions();
    setPermissions(perms);
    return perms;
  }, []);

  const schedule = useCallback(async (options: NotificationOptions): Promise<number> => {
    const id = await CapacitorNotifications.schedule(options);
    if (id > 0) {
      toast.success('Notification programmée');
    }
    return id;
  }, []);

  const cancel = useCallback(async (id: number) => {
    await CapacitorNotifications.cancel(id);
  }, []);

  const cancelAll = useCallback(async () => {
    await CapacitorNotifications.cancelAll();
    toast.success('Toutes les notifications annulées');
  }, []);

  const getPending = useCallback(async () => {
    return await CapacitorNotifications.getPending();
  }, []);

  const getDelivered = useCallback(async () => {
    return await CapacitorNotifications.getDelivered();
  }, []);

  const removeAllDelivered = useCallback(async () => {
    await CapacitorNotifications.removeAllDelivered();
  }, []);

  /**
   * Notifications prédéfinies
   */
  const notifyOrderReady = useCallback(async (orderId: string, pharmacyName: string) => {
    return await CapacitorNotifications.orderReady(orderId, pharmacyName);
  }, []);

  const notifyStockAlert = useCallback(async (medicationName: string, quantity: number) => {
    return await CapacitorNotifications.stockAlert(medicationName, quantity);
  }, []);

  const notifyMedicationReminder = useCallback(async (medicationName: string) => {
    return await CapacitorNotifications.medicationReminder(medicationName);
  }, []);

  const notifyPromotion = useCallback(async (title: string, message: string) => {
    return await CapacitorNotifications.promotion(title, message);
  }, []);

  // Vérifier les permissions au montage
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    permissions,
    checkPermissions,
    requestPermissions,
    schedule,
    cancel,
    cancelAll,
    getPending,
    getDelivered,
    removeAllDelivered,

    // Notifications prédéfinies
    orderReady: notifyOrderReady,
    stockAlert: notifyStockAlert,
    medicationReminder: notifyMedicationReminder,
    promotion: notifyPromotion,
  };
}
