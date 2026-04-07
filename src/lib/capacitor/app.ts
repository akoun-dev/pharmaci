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
      name: 'Pharma CI',
      id: 'ci.pharmaci.app',
      build: 'web',
      version: '1.0.0',
    };
  }

  try {
    const info = await CapacitorApp.getInfo();
    return info;
  } catch (error) {
    console.warn('App info error:', error);
    return null;
  }
};

/**
 * Récupère l'URL de l'application
 */
export const getAppLaunchUrl = async (): Promise<string | null> => {
  if (!isAppAvailable()) return null;

  try {
    const { url } = await CapacitorApp.getLaunchUrl();
    return url;
  } catch (error) {
    console.warn('App launch url error:', error);
    return null;
  }
};

/**
 * Écouteur d'état de l'application
 */
export const addAppStateListener = (callback: (state: { isActive: boolean }) => void) => {
  if (!isAppAvailable()) return { remove: () => {} };

  return CapacitorApp.addListener('appStateChange', callback);
};

/**
 * Écouteur d'URL de lancement (deep link)
 */
export const addAppUrlOpenListener = (callback: (data: { url: string }) => void) => {
  if (!isAppAvailable()) return { remove: () => {} };

  return CapacitorApp.addListener('appUrlOpen', callback);
};

/**
 * Écouteur de bouton retour (Android)
 */
export const addBackButtonListener = (callback: (data: { canGoBack?: boolean }) => void) => {
  if (!isAppAvailable()) return { remove: () => {} };

  return CapacitorApp.addListener('backButton', callback);
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
 * Quitte l'application (si supporté)
 */
export const exitApp = async (): Promise<void> => {
  if (!isAppAvailable()) return;

  try {
    await CapacitorApp.exitApp();
  } catch (error) {
    console.warn('Exit app error:', error);
  }
};

/**
 * Raccourcis pour les événements
 */
export const AppEvents = {
  onStateChange: addAppStateListener,
  onUrlOpen: addAppUrlOpenListener,
  onBackButton: addBackButtonListener,
};

export const App = {
  getInfo: getAppInfo,
  getLaunchUrl: getAppLaunchUrl,
  minimize: minimizeApp,
  exit: exitApp,
  ...AppEvents,
};
