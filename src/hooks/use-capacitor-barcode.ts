/**
 * Hook React pour le scan de codes-barres et QR codes
 */

import { useState, useCallback } from 'react';
import { BarcodeScanner as CapacitorBarcodeScanner, BarcodeScanResult } from '@/lib/capacitor';
import { toast } from 'sonner';

/**
 * Hook pour utiliser le scanner de codes-barres
 */
export function useCapacitorBarcode() {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const checkPermissions = useCallback(async () => {
    const perms = await CapacitorBarcodeScanner.checkPermissions();
    return perms;
  }, []);

  const requestPermissions = useCallback(async () => {
    const perms = await CapacitorBarcodeScanner.requestPermissions();
    return perms;
  }, []);

  const scan = useCallback(async (options?: { text?: string }): Promise<BarcodeScanResult | null> => {
    setLoading(true);
    setScanning(true);
    try {
      const result = await CapacitorBarcodeScanner.scan(options);
      return result;
    } catch (error) {
      console.error('Scan error:', error);
      // L'utilisateur a annulé le scan
      if (error === 'User canceled scanning action') {
        return null;
      }
      toast.error('Impossible de scanner le code');
      return null;
    } finally {
      setLoading(false);
      setScanning(false);
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      await CapacitorBarcodeScanner.stop();
      setScanning(false);
    } catch (error) {
      console.error('Stop scan error:', error);
    }
  }, []);

  const isValidOrderQR = useCallback((content: string) => {
    return CapacitorBarcodeScanner.isValidAppQRCode(content);
  }, []);

  const parseOrderQR = useCallback((content: string) => {
    return CapacitorBarcodeScanner.parseOrderQRCode(content);
  }, []);

  return {
    loading,
    scanning,
    checkPermissions,
    requestPermissions,
    scan,
    stop,
    isValidOrderQR,
    parseOrderQR,
  };
}
