/**
 * Action Sheet - Wrapper pour les menus d'action natifs
 * Documentation: https://capacitorjs.com/docs/apis/action-sheet
 */

import { ActionSheet as CapacitorActionSheet, ActionSheetButtonStyle, ActionSheetOptions } from '@capacitor/action-sheet';
import { Capacitor } from '@capacitor/core';

/**
 * Vérifie si le plugin ActionSheet est disponible
 */
export const isActionSheetAvailable = (): boolean => {
  return Capacitor.isPluginAvailable('ActionSheet');
};

/**
 * Bouton d'action
 */
export interface ActionSheetButton {
  title: string;
  icon?: string;
  style?: 'default' | 'destructive' | 'cancel';
}

/**
 * Options pour l'action sheet
 */
export interface ShowActionSheetOptions {
  title?: string;
  message?: string;
  buttons: ActionSheetButton[];
}

/**
 * Affiche une action sheet
 * @param options - Options de l'action sheet
 * @returns L'index du bouton cliqué
 */
export const showActionSheet = async (options: ShowActionSheetOptions): Promise<number> => {
  if (!isActionSheetAvailable()) {
    // Fallback web avec prompt
    console.warn('ActionSheet not available, using fallback');
    return -1;
  }

  try {
    const buttonStyleMap: Record<string, ActionSheetButtonStyle> = {
      default: ActionSheetButtonStyle.Default,
      destructive: ActionSheetButtonStyle.Destructive,
      cancel: ActionSheetButtonStyle.Cancel,
    };

    const capacitorOptions: ActionSheetOptions = {
      title: options.title,
      message: options.message,
      buttons: options.buttons.map(btn => ({
        title: btn.title,
        icon: btn.icon,
        style: btn.style ? buttonStyleMap[btn.style] : ActionSheetButtonStyle.Default,
      })),
    };

    const result = await CapacitorActionSheet.showActions(capacitorOptions);
    return result.index;
  } catch (error) {
    console.warn('ActionSheet error:', error);
    return -1;
  }
};

/**
 * Actions prédéfinies pour l'application
 */

/**
 * Affiche le menu de partage
 */
export const showShareMenu = async (): Promise<string> => {
  const index = await showActionSheet({
    title: 'Partager',
    buttons: [
      { title: 'Copier le lien', icon: 'link' },
      { title: 'Partager via...', icon: 'square_arrow_up' },
      { title: 'Annuler', style: 'cancel' },
    ],
  });

  const actions = ['copy', 'share', 'cancel'];
  return actions[index] || 'cancel';
};

/**
 * Affiche le menu de tri
 */
export const showSortMenu = async (): Promise<string> => {
  const index = await showActionSheet({
    title: 'Trier par',
    buttons: [
      { title: 'Nom (A-Z)', icon: 'textformat_abc' },
      { title: 'Prix (croissant)', icon: 'arrow_up' },
      { title: 'Prix (décroissant)', icon: 'arrow_down' },
      { title: 'Distance', icon: 'location' },
      { title: 'Annuler', style: 'cancel' },
    ],
  });

  const actions = ['name', 'price_asc', 'price_desc', 'distance', 'cancel'];
  return actions[index] || 'cancel';
};

/**
 * Affiche le menu d'options de commande
 */
export const showOrderOptionsMenu = async (): Promise<string> => {
  const index = await showActionSheet({
    title: 'Options de commande',
    buttons: [
      { title: 'Voir les détails', icon: 'doc_text' },
      { title: 'Contacter la pharmacie', icon: 'phone' },
      { title: 'Annuler la commande', style: 'destructive' },
      { title: 'Annuler', style: 'cancel' },
    ],
  });

  const actions = ['details', 'contact', 'cancel_order', 'cancel'];
  return actions[index] || 'cancel';
};

/**
 * Export de l'API
 */
export const ActionSheet = {
  show: showActionSheet,
  isAvailable: isActionSheetAvailable,

  // Menus prédéfinis
  showShareMenu,
  showSortMenu,
  showOrderOptionsMenu,
};
