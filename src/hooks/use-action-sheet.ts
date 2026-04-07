/**
 * Hook React pour les menus d'action natifs (Action Sheet)
 */

import { useCallback } from 'react';
import { ActionSheet as CapacitorActionSheet } from '@/lib/capacitor';
import { toast } from 'sonner';

export type ActionSheetButton = {
  title: string;
  icon?: string;
  style?: 'default' | 'destructive' | 'cancel';
};

export type ActionSheetOptions = {
  title?: string;
  message?: string;
  buttons: ActionSheetButton[];
};

/**
 * Hook pour utiliser les Action Sheets natifs
 */
export function useActionSheet() {
  const show = useCallback(async (options: ActionSheetOptions): Promise<number | null> => {
    try {
      const index = await CapacitorActionSheet.show({
        title: options.title,
        message: options.message,
        buttons: options.buttons,
      });

      return index;
    } catch (error) {
      console.error('ActionSheet error:', error);
      return null;
    }
  }, []);

  const confirm = useCallback(async (title: string, message?: string): Promise<boolean> => {
    const index = await show({
      title,
      message,
      buttons: [
        { title: 'Confirmer', icon: 'check' },
        { title: 'Annuler', style: 'cancel' },
      ],
    });

    return index === 0;
  }, [show]);

  const select = useCallback(async <T extends string>(
    title: string,
    options: Array<{ label: string; value: T; icon?: string }>
  ): Promise<T | null> => {
    const index = await show({
      title,
      buttons: [
        ...options.map(opt => ({
          title: opt.label,
          icon: opt.icon,
        })),
        { title: 'Annuler', style: 'cancel' },
      ],
    });

    if (index === null || index >= options.length) {
      return null;
    }

    return options[index]?.value ?? null;
  }, [show]);

  // Actions prédéfinies pour l'application

  const confirmDelete = useCallback(async (itemName?: string): Promise<boolean> => {
    const title = itemName
      ? `Supprimer ${itemName} ?`
      : 'Supprimer cet élément ?';
    const message = itemName
      ? `Êtes-vous sûr de vouloir supprimer "${itemName}" ? Cette action est irréversible.`
      : 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.';

    return confirm(title, message);
  }, [confirm]);

  const confirmCancel = useCallback(async (itemName?: string): Promise<boolean> => {
    const title = itemName
      ? `Annuler ${itemName} ?`
      : 'Annuler cette action ?';
    const message = itemName
      ? `Êtes-vous sûr de vouloir annuler "${itemName}" ?`
      : 'Êtes-vous sûr de vouloir annuler cette action ?';

    return confirm(title, message);
  }, [confirm]);

  const showOrderActions = useCallback(async (onAction: (action: string) => void): Promise<void> => {
    const index = await show({
      title: 'Actions de commande',
      buttons: [
        { title: 'Voir les détails', icon: 'doc_text' },
        { title: 'Contacter la pharmacie', icon: 'phone' },
        { title: 'Annuler la commande', style: 'destructive' },
        { title: 'Annuler', style: 'cancel' },
      ],
    });

    const actions = ['details', 'contact', 'cancel_order', 'cancel'];
    const action = actions[index ?? 3];

    if (action !== 'cancel') {
      onAction(action);
    }
  }, [show]);

  const showSortOptions = useCallback(async (onSort: (sort: string) => void): Promise<void> => {
    const result = await select('Trier par', [
      { label: 'Nom (A-Z)', value: 'name_asc' },
      { label: 'Nom (Z-A)', value: 'name_desc' },
      { label: 'Prix (croissant)', value: 'price_asc' },
      { label: 'Prix (décroissant)', value: 'price_desc' },
      { label: 'Distance', value: 'distance' },
    ]);

    if (result) {
      onSort(result);
    }
  }, [select]);

  const showShareOptions = useCallback(async (onShare: (method: string) => void): Promise<void> => {
    const index = await show({
      title: 'Partager',
      buttons: [
        { title: 'Copier le lien', icon: 'link' },
        { title: 'Partager via...', icon: 'square_arrow_up' },
        { title: 'Annuler', style: 'cancel' },
      ],
    });

    const actions = ['copy', 'share', 'cancel'];
    const action = actions[index ?? 2];

    if (action !== 'cancel') {
      onShare(action);
    }
  }, [show]);

  return {
    show,
    confirm,
    select,
    confirmDelete,
    confirmCancel,
    showOrderActions,
    showSortOptions,
    showShareOptions,
  };
}
