/**
 * Barcode Scanner - Wrapper pour la scan de codes-barres et QR codes
 * Documentation: https://capacitorjs.com/docs/apis/barcode-scanner
 */

import { BarcodeScanner as CapacitorBarcodeScanner, ScanOption, ScanResult } from '@capacitor/barcode-scanner';
import { Capacitor } from '@capacitor/core';

/**
 * Vérifie si le plugin BarcodeScanner est disponible
 */
export const isBarcodeScannerAvailable = (): boolean => {
  return Capacitor.isPluginAvailable('BarcodeScanner');
};

/**
 * Types de codes supportés
 */
export type BarcodeFormat =
  | 'aztec'
  | 'codabar'
  | 'code_128'
  | 'code_39'
  | 'code_93'
  | 'data_matrix'
  | 'ean_13'
  | 'ean_8'
  | 'itf'
  | 'pdf417'
  | 'qr_code'
  | 'upc_a'
  | 'upc_e';

/**
 * Options de scan
 */
export interface ScanOptions {
  formats?: BarcodeFormat[];
  text?: string;
}

/**
 * Résultat du scan
 */
export interface BarcodeScanResult {
  format: BarcodeFormat;
  content: string;
}

/**
 * Vérifie les permissions de la caméra pour le scan
 */
export const checkPermissions = async (): Promise<{ camera: string }> => {
  if (!isBarcodeScannerAvailable()) {
    return { camera: 'denied' };
  }

  try {
    const permissions = await CapacitorBarcodeScanner.checkPermissions();
    return permissions;
  } catch (error) {
    console.error('Check barcode scanner permissions error:', error);
    return { camera: 'denied' };
  }
};

/**
 * Demande les permissions de la caméra pour le scan
 */
export const requestPermissions = async (): Promise<{ camera: string }> => {
  if (!isBarcodeScannerAvailable()) {
    return { camera: 'denied' };
  }

  try {
    const permissions = await CapacitorBarcodeScanner.requestPermissions();
    return permissions;
  } catch (error) {
    console.error('Request barcode scanner permissions error:', error);
    return { camera: 'denied' };
  }
};

/**
 * Prépare l'interface de scan (arrière-plan de la caméra)
 * @param show - true pour afficher, false pour cacher
 */
export const prepareScan = async (show: boolean): Promise<void> => {
  if (!isBarcodeScannerAvailable()) {
    console.warn('BarcodeScanner not available');
    return;
  }

  try {
    await CapacitorBarcodeScanner.prepare();
    if (!show) {
      await CapacitorBarcodeScanner.hideBackground();
    } else {
      await CapacitorBarcodeScanner.showBackground();
    }
  } catch (error) {
    console.error('Prepare scan error:', error);
    throw error;
  }
};

/**
 * Arrête l'interface de scan
 */
export const stopScan = async (): Promise<void> => {
  if (!isBarcodeScannerAvailable()) {
    console.warn('BarcodeScanner not available');
    return;
  }

  try {
    await CapacitorBarcodeScanner.stopScan();
    await CapacitorBarcodeScanner.hideBackground();
  } catch (error) {
    console.error('Stop scan error:', error);
  }
};

/**
 * Scan un code-barres ou QR code
 * @param options - Options de scan
 * @returns Le résultat du scan
 */
export const scanBarcode = async (options: ScanOptions = {}): Promise<BarcodeScanResult> => {
  if (!isBarcodeScannerAvailable()) {
    throw new Error('BarcodeScanner not available');
  }

  try {
    // Préparer l'interface
    await CapacitorBarcodeScanner.prepare();

    // Configurer les options
    const scanOptions: ScanOption = {
      text: options.text ?? 'Placez le QR code dans le cadre',
    };

    // Démarrer le scan
    const result: ScanResult = await CapacitorBarcodeScanner.startScan(scanOptions);

    // Arrêter l'interface après le scan
    await CapacitorBarcodeScanner.hideBackground();

    return {
      format: result.format as BarcodeFormat,
      content: result.content,
    };
  } catch (error) {
    console.error('Scan barcode error:', error);
    await CapacitorBarcodeScanner.hideBackground();
    throw error;
  }
};

/**
 * Scan un code avec retour d'arrière-plan personnalisé
 * @param callback - Fonction appelée quand un code est scanné
 * @param options - Options de scan
 */
export const startScanWithCallback = async (
  callback: (result: BarcodeScanResult) => void,
  options: ScanOptions = {}
): Promise<void> => {
  if (!isBarcodeScannerAvailable()) {
    throw new Error('BarcodeScanner not available');
  }

  try {
    await CapacitorBarcodeScanner.prepare();

    await CapacitorBarcodeScanner.startScan(
      {
        text: options.text ?? 'Placez le QR code dans le cadre',
      },
      (result) => {
        callback({
          format: result.format as BarcodeFormat,
          content: result.content,
        });
        // Arrêter le scan après un résultat réussi
        CapacitorBarcodeScanner.stopScan();
        CapacitorBarcodeScanner.hideBackground();
      }
    );
  } catch (error) {
    console.error('Start scan with callback error:', error);
    await CapacitorBarcodeScanner.hideBackground();
    throw error;
  }
};

/**
 * Vérifie si un code QR est valide pour l'application
 * Format attendu: PHARMAPP-{orderId}-{verificationCode}
 */
export const isValidAppQRCode = (content: string): boolean => {
  return /^PHARMAPP-[\w-]+-[A-Z0-9]+$/.test(content);
};

/**
 * Extrait les informations d'un QR code de commande
 * @param content - Contenu du QR code
 * @returns orderId et verificationCode
 */
export const parseOrderQRCode = (content: string): { orderId: string; verificationCode: string } | null => {
  const match = content.match(/^PHARMAPP-([\w-]+)-([A-Z0-9]+)$/);
  if (!match) return null;

  return {
    orderId: match[1],
    verificationCode: match[2],
  };
};

/**
 * Export de l'API
 */
export const BarcodeScanner = {
  scan: scanBarcode,
  scanWithCallback: startScanWithCallback,
  prepare: prepareScan,
  stop: stopScan,
  checkPermissions,
  requestPermissions,
  isValidAppQRCode,
  parseOrderQRCode,
  isAvailable: isBarcodeScannerAvailable,
};
