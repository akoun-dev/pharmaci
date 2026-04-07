/**
 * Camera - Wrapper pour la prise de photos et sélection d'images
 * Documentation: https://capacitorjs.com/docs/apis/camera
 */

import { Camera as CapacitorCamera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

/**
 * Vérifie si le plugin Camera est disponible
 */
export const isCameraAvailable = (): boolean => {
  return Capacitor.isPluginAvailable('Camera');
};

/**
 * Options pour la prise de photo
 */
export interface CameraOptions {
  quality?: number;
  allowEditing?: boolean;
  saveToGallery?: boolean;
  width?: number;
  height?: number;
  direction?: 'rear' | 'front';
}

/**
 * Résultat de la caméra
 */
export interface CameraResult {
  dataUrl?: string;
  webPath?: string;
  format?: string;
}

/**
 * Prend une photo avec la caméra
 * @param options - Options de capture
 * @returns L'image capturée (dataUrl ou webPath)
 */
export const takePhoto = async (options: CameraOptions = {}): Promise<CameraResult> => {
  if (!isCameraAvailable()) {
    throw new Error('Camera not available');
  }

  const cameraOptions = {
    quality: options.quality ?? 90,
    allowEditing: options.allowEditing ?? false,
    saveToGallery: options.saveToGallery ?? true,
    width: options.width,
    height: options.height,
    direction: options.direction === 'front' ? CameraDirection.Front : CameraDirection.Rear,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
  };

  try {
    const result = await CapacitorCamera.getPhoto(cameraOptions);
    return {
      dataUrl: result.dataUrl,
      webPath: result.webPath,
      format: result.format,
    };
  } catch (error) {
    console.error('Camera error:', error);
    throw error;
  }
};

/**
 * Sélectionne une image depuis la galerie
 * @param options - Options de sélection
 * @returns L'image sélectionnée
 */
export const selectFromGallery = async (options: CameraOptions = {}): Promise<CameraResult> => {
  if (!isCameraAvailable()) {
    throw new Error('Camera not available');
  }

  const cameraOptions = {
    quality: options.quality ?? 90,
    allowEditing: options.allowEditing ?? false,
    width: options.width,
    height: options.height,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Photos,
  };

  try {
    const result = await CapacitorCamera.getPhoto(cameraOptions);
    return {
      dataUrl: result.dataUrl,
      webPath: result.webPath,
      format: result.format,
    };
  } catch (error) {
    console.error('Gallery selection error:', error);
    throw error;
  }
};

/**
 * Permet de choisir entre caméra ou galerie
 * @param options - Options de capture
 * @returns L'image capturée ou sélectionnée
 */
export const pickImage = async (options: CameraOptions = {}): Promise<CameraResult> => {
  if (!isCameraAvailable()) {
    throw new Error('Camera not available');
  }

  const cameraOptions = {
    quality: options.quality ?? 90,
    allowEditing: options.allowEditing ?? false,
    saveToGallery: options.saveToGallery ?? true,
    width: options.width,
    height: options.height,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt, // Demande à l'utilisateur de choisir
  };

  try {
    const result = await CapacitorCamera.getPhoto(cameraOptions);
    return {
      dataUrl: result.dataUrl,
      webPath: result.webPath,
      format: result.format,
    };
  } catch (error) {
    console.error('Pick image error:', error);
    throw error;
  }
};

/**
 * Vérifie les permissions de la caméra
 */
export const checkPermissions = async (): Promise<{ camera: string; photos: string }> => {
  if (!isCameraAvailable()) {
    return { camera: 'denied', photos: 'denied' };
  }

  try {
    const permissions = await CapacitorCamera.checkPermissions();
    return permissions;
  } catch (error) {
    console.error('Check camera permissions error:', error);
    return { camera: 'denied', photos: 'denied' };
  }
};

/**
 * Demande les permissions de la caméra
 */
export const requestPermissions = async (): Promise<{ camera: string; photos: string }> => {
  if (!isCameraAvailable()) {
    return { camera: 'denied', photos: 'denied' };
  }

  try {
    const permissions = await CapacitorCamera.requestPermissions({ permissions: ['camera', 'photos'] });
    return permissions;
  } catch (error) {
    console.error('Request camera permissions error:', error);
    return { camera: 'denied', photos: 'denied' };
  }
};

/**
 * Convertit un dataUrl en Blob
 */
export const dataUrlToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mime = arr[0]?.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const bstr = atob(arr[1] ?? '');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Convertit un dataUrl en File
 */
export const dataUrlToFile = (dataUrl: string, filename: string = 'photo.jpg'): File => {
  const blob = dataUrlToBlob(dataUrl);
  return new File([blob], filename, { type: blob.type });
};

/**
 * Export de l'API
 */
export const Camera = {
  take: takePhoto,
  fromGallery: selectFromGallery,
  pick: pickImage,
  checkPermissions,
  requestPermissions,
  dataUrlToBlob,
  dataUrlToFile,
  isAvailable: isCameraAvailable,
};
