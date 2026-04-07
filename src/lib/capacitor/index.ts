/**
 * Capacitor Plugins - Export principal
 *
 * Ce fichier exporte tous les wrappers Capacitor pour une utilisation facile dans l'application
 */

// Plugins individuels
export * from './camera';
export * from './geolocation';
export * from './barcode-scanner';
export * from './local-notifications';
export * from './haptics';
export * from './action-sheet';
export * from './app';
export * from './status-bar';

// Exports regroupés
export { Camera } from './camera';
export { Geolocation } from './geolocation';
export { BarcodeScanner } from './barcode-scanner';
export { LocalNotifications } from './local-notifications';
export { Haptics } from './haptics';
export { ActionSheet } from './action-sheet';
export { App, AppEvents } from './app';
export { StatusBar } from './status-bar';

// Imports depuis @capacitor/core
import { Capacitor } from '@capacitor/core';
export { Capacitor };

// Vérification de la plateforme
export const isNative = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === 'android';
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isWeb = Capacitor.getPlatform() === 'web';
