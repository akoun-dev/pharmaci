/**
 * Capacitor Plugins - Export principal
 *
 * Ce fichier exporte tous les wrappers Capacitor pour une utilisation facile dans l'application
 */

// Imports depuis @capacitor/core
import { Capacitor } from '@capacitor/core';
export { Capacitor };

// Exports regroupés - API principales
export { Camera } from './camera';
export { Geolocation } from './geolocation';
export { BarcodeScanner } from './barcode-scanner';
export { LocalNotifications } from './local-notifications';
export { Haptics } from './haptics';
export { ActionSheet } from './action-sheet';
export { App } from './app';
export { StatusBar } from './status-bar';
export { Network } from './network';

// Vérification de la plateforme
export const isNative = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === 'android';
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isWeb = Capacitor.getPlatform() === 'web';
