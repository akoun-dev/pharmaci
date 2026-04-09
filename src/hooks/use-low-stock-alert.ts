'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { useCapacitorNotifications } from '@/hooks/use-capacitor-notifications';

export const useLowStockAlert = () => {
  const { currentUser, selectedPharmacyId } = useAppStore();
  const currentPharmacyId = currentUser?.linkedPharmacyId || selectedPharmacyId;
  const { schedule } = useCapacitorNotifications();

  useEffect(() => {
    const checkLowStock = async () => {
      if (!currentPharmacyId) return;

      try {
        const res = await fetch(`/api/pharmacies/${currentPharmacyId}/stocks?lowStock=true&alertSent=false`);
        const lowStockItems = await res.json();

        for (const item of lowStockItems) {
          await schedule({
            title: '⚠️ Stock Bas',
            body: `${item.medication.name} : ${item.quantity} unités restantes`,
            schedule: { at: new Date(Date.now() + 1000) }, // Notification immédiate
          });

          // Marquer comme notifié
          await fetch(`/api/pharmacies/${currentPharmacyId}/stocks/${item.id}/alert`, {
            method: 'POST',
            body: JSON.stringify({ lowStockAlertSent: true })
          });
        }
      } catch (error) {
        console.error('Error checking low stock:', error);
      }
    };

    // Vérifier toutes les heures
    const interval = setInterval(checkLowStock, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentPharmacyId]);
};
