/**
 * Barcode Scanner - Wrapper pour la scan de codes-barres et QR codes
 * Documentation: https://capacitorjs.com/docs/apis/barcode-scanner
 */

import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
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
  text?: string;
}

/**
 * Résultat du scan
 */
export interface BarcodeScanResult {
  content?: string;
  hasContent: boolean;
}

/**
 * Vérifie les permissions de la caméra pour le scan
 */
export const checkPermissions = async (): Promise<{ camera: string }> => {
  if (!isBarcodeScannerAvailable()) {
    return { camera: 'denied' };
  }

  try {
    // Le plugin BarcodeScanner n'a pas de méthode checkPermissions
    // On assume que si le plugin est disponible, les permissions sont gérées automatiquement
    return { camera: 'granted' };
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
    // Le plugin BarcodeScanner gère les permissions automatiquement lors du scan
    return { camera: 'granted' };
  } catch (error) {
    console.error('Request barcode scanner permissions error:', error);
    return { camera: 'denied' };
  }
};

/**
 * Scan un code-barres ou QR code
 * @param options - Options de scan
 * @returns Le résultat du scan
 */
export const scan = async (options: ScanOptions = {}): Promise<BarcodeScanResult> => {
  if (!isBarcodeScannerAvailable()) {
    throw new Error('BarcodeScanner not available');
  }

  try {
    const result = await CapacitorBarcodeScanner.scanBarcode({
      hint: 17, // ALL_FORMATS - support both QR codes and barcodes
      scanButton: false, // Pas de bouton de scan personnalisé
      scanText: ' ', // Texte par défaut
      scanInstructions: options.text ?? 'Placez le QR code dans le cadre',
    });

    return {
      content: result.ScanResult || undefined,
      hasContent: !!result.ScanResult,
    };
  } catch (error) {
    console.error('Scan barcode error:', error);
    throw error;
  }
};

/**
 * Vérifie si un code QR est valide pour l'application
 * Format attendu: PHARMACI-{orderId}-{verificationCode}
 */
export const isValidAppQRCode = (content: string): boolean => {
  if (!content || typeof content !== 'string') return false;
  return /^PHARMACI-[\w-]+-[A-Z0-9]+$/.test(content);
};

/**
 * Extrait les informations d'un QR code de commande
 * @param content - Contenu du QR code
 * @returns orderId et verificationCode
 */
export const parseOrderQRCode = (content: string): { orderId: string; verificationCode: string } | null => {
  if (!content) return null;

  const match = content.match(/^PHARMACI-([\w-]+)-([A-Z0-9]+)$/);
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
  scan,
  checkPermissions,
  requestPermissions,
  isValidAppQRCode,
  parseOrderQRCode,
  isAvailable: isBarcodeScannerAvailable,
};
