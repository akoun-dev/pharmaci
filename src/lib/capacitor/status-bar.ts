/**
 * Status Bar - Wrapper pour le style des barres d'état et de navigation
 * Documentation: https://capacitorjs.com/docs/apis/status-bar
 */

import { StatusBar as CapacitorStatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

/**
 * Vérifie si le plugin StatusBar est disponible
 */
export const isStatusBarAvailable = (): boolean => {
  return Capacitor.isPluginAvailable('StatusBar');
};

/**
 * Style de la barre d'état
 */
export type StatusBarStyle = 'dark' | 'light';

/**
 * Définit le style de la barre d'état
 * @param style - Style (dark ou light)
 */
export const setStatusBarStyle = async (style: StatusBarStyle): Promise<void> => {
  if (!isStatusBarAvailable()) return;

  try {
    await CapacitorStatusBar.setStyle({ style: style === 'dark' ? Style.Dark : Style.Light });
  } catch (error) {
    console.warn('StatusBar set style error:', error);
  }
};

/**
 * Définit la couleur de fond de la barre d'état (Android)
 * @param color - Couleur en hexadécimal
 */
export const setStatusBarBackgroundColor = async (color: string): Promise<void> => {
  if (!isStatusBarAvailable()) return;

  try {
    await CapacitorStatusBar.setBackgroundColor({ color });
  } catch (error) {
    console.warn('StatusBar set background color error:', error);
  }
};

/**
 * Affiche ou cache la barre d'état
 * @param show - true pour afficher, false pour cacher
 */
export const setStatusBarVisible = async (show: boolean): Promise<void> => {
  if (!isStatusBarAvailable()) return;

  try {
    await CapacitorStatusBar.setOverlaysWebView({ overlay: !show });
  } catch (error) {
    console.warn('StatusBar set visible error:', error);
  }
};

/**
 * Récupère les infos de la barre d'état
 */
export const getInfo = async () => {
  if (!isStatusBarAvailable()) {
    return { visible: true, style: 'dark' };
  }

  try {
    const info = await CapacitorStatusBar.getInfo();
    return info;
  } catch (error) {
    console.warn('StatusBar get info error:', error);
    return { visible: true, style: 'dark' };
  }
};

/**
 * Cache la barre d'état (overlay mode)
 */
export const hideStatusBar = async (): Promise<void> => {
  await setStatusBarVisible(false);
};

/**
 * Affiche la barre d'état
 */
export const showStatusBar = async (): Promise<void> => {
  await setStatusBarVisible(true);
};

/**
 * Définit le style sombre (texte clair sur fond sombre)
 */
export const setStatusBarStyleDark = async (): Promise<void> => {
  await setStatusBarStyle('dark');
};

/**
 * Définit le style clair (texte sombre sur fond clair)
 */
export const setStatusBarStyleLight = async (): Promise<void> => {
  await setStatusBarStyle('light');
};

/**
 * Applique le style de l'application (vert amber)
 */
export const applyAppStatusBarStyle = async (): Promise<void> => {
  if (!isStatusBarAvailable()) return;

  try {
    // Style clair pour notre thème
    await setStatusBarStyle('light');

    // Couleur de fond (Android) - ambre clair
    await setStatusBarBackgroundColor('#fef3c7');
  } catch (error) {
    console.warn('Apply app status bar style error:', error);
  }
};

/**
 * Écouteur de changement de style de la barre d'état
 */
export const addStatusBarListener = (callback: () => void) => {
  if (!isStatusBarAvailable()) return { remove: () => {} };

  return CapacitorStatusBar.addListener('statusBarTap', callback);
};

/**
 * Export de l'API
 */
export const StatusBar = {
  setStyle: setStatusBarStyle,
  setBackgroundColor: setStatusBarBackgroundColor,
  setVisible: setStatusBarVisible,
  getInfo,
  hide: hideStatusBar,
  show: showStatusBar,
  setDark: setStatusBarStyleDark,
  setLight: setStatusBarStyleLight,
  applyAppStyle: applyAppStatusBarStyle,
  onTap: addStatusBarListener,
  isAvailable: isStatusBarAvailable,
};
