/**
 * Hook React pour la caméra
 */

import { useState, useCallback } from 'react';
import { Camera as CapacitorCamera, CameraOptions } from '@/lib/capacitor';
import { toast } from 'sonner';

/**
 * Hook pour utiliser la caméra
 */
export function useCapacitorCamera() {
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<{ camera: string; photos: string } | null>(null);

  const checkPermissions = useCallback(async () => {
    const perms = await CapacitorCamera.checkPermissions();
    setPermissions(perms);
    return perms;
  }, []);

  const requestPermissions = useCallback(async () => {
    const perms = await CapacitorCamera.requestPermissions();
    setPermissions(perms);
    return perms;
  }, []);

  const takePhoto = useCallback(async (options?: CameraOptions) => {
    setLoading(true);
    try {
      const result = await CapacitorCamera.take(options);
      return result;
    } catch (error) {
      console.error('Take photo error:', error);
      toast.error('Impossible de prendre la photo');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const selectFromGallery = useCallback(async (options?: CameraOptions) => {
    setLoading(true);
    try {
      const result = await CapacitorCamera.fromGallery(options);
      return result;
    } catch (error) {
      console.error('Select from gallery error:', error);
      toast.error('Impossible de sélectionner l\'image');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const pickImage = useCallback(async (options?: CameraOptions) => {
    setLoading(true);
    try {
      const result = await CapacitorCamera.pick(options);
      return result;
    } catch (error) {
      console.error('Pick image error:', error);
      // L'utilisateur a annulé, pas d'erreur
      if (error === 'User cancelled photos app') {
        return null;
      }
      toast.error('Impossible de sélectionner l\'image');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    permissions,
    checkPermissions,
    requestPermissions,
    takePhoto,
    selectFromGallery,
    pickImage,
  };
}
