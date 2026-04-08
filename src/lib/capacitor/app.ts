/**
 * App - Wrapper pour les informations et contrôle de l'application
 * Documentation: https://capacitorjs.com/docs/apis/app
 */

import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Vérifie si le plugin App est disponible
 */
export const isAppAvailable = (): boolean => {
  return Capacitor.isPluginAvailable('App');
};

/**
 * Récupère les informations de l'application
 */
export const getAppInfo = async () => {
  if (!isAppAvailable()) {
    return {
      id: 'ci.pharmaci.app',
      name: 'Pharma CI',
      build: 'web',
      version: '1.0.0',
    };
  }

  try {
    return await CapacitorApp.getInfo();
  } catch (error) {
    console.warn('App info error:', error);
    return null;
  }
};

/**
 * Récupère l'URL de l'application
 */
export const getLaunchUrl = async (): Promise<string | null> => {
  if (!isAppAvailable()) return null;

  try {
    const result = await CapacitorApp.getLaunchUrl();
    return result?.url ?? null;
  } catch (error) {
    console.warn('App launch url error:', error);
    return null;
  }
};

/**
 * Récupère l'état de l'application
 */
export const getState = async () => {
  if (!isAppAvailable()) return { isActive: true };

  try {
    return await CapacitorApp.getState();
  } catch (error) {
    console.warn('App state error:', error);
    return { isActive: true };
  }
};

/**
 * Minimise l'application
 */
export const minimizeApp = async (): Promise<void> => {
  if (!isAppAvailable()) return;

  try {
    await CapacitorApp.minimizeApp();
  } catch (error) {
    console.warn('Minimize app error:', error);
  }
};

/**
 * Quitte l'application (Android only, via back button)
 * Note: iOS ne permet pas de quitter programmatiquement
 */
export const exitApp = async (): Promise<void> => {
  if (!isAppAvailable()) {
    console.warn('ExitApp not available on web');
    return;
  }

  try {
    await CapacitorApp.exitApp();
  } catch (error) {
    console.warn('Exit app error:', error);
  }
};

/**
 * Ajoute un écouteur pour le bouton retour (Android)
 * @param event - Nom de l'événement ('backButton')
 * @param callback - Fonction de rappel
 */
export const addListener = async (
  event: 'backButton' | 'appStateChange' | 'appUrlOpen' | 'restoredResult' | 'activityResults' | 'onLoadActivityList' | 'onLoadIntent',
  callback: (data: any) => void
) => {
  if (!isAppAvailable()) {
    // Retourner un objet vide avec une fonction remove vide pour la compatibilité
    return Promise.resolve({ remove: () => {} });
  }

  try {
    // CapacitorApp.addListener has different signatures for different events
    // We need to use type assertion for compatibility
    const result = await (CapacitorApp.addListener as any)(event, callback);
    return result;
  } catch (error) {
    console.error(`Add listener error for ${event}:`, error);
    return { remove: () => {} };
  }
};

/**
 * Export de l'API
 */
export const App = {
  getInfo: getAppInfo,
  getLaunchUrl,
  getState,
  minimize: minimizeApp,
  exit: exitApp,
  addListener,
};
