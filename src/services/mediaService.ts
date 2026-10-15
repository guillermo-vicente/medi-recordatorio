// Servicio de medios: permisos, captura, persistencia y compartir.
// Usa expo-image-picker para cámara y galería (más estable en Expo Go Android).
// Guarda los archivos en documentDirectory para que persistan entre sesiones.

import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export interface PickedImage {
  uri: string;
  width?: number;
  height?: number;
  fileName?: string;
}

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.8;

async function persistImage(tempUri: string): Promise<string> {
  const processed = await ImageManipulator.manipulateAsync(
    tempUri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );

  if (Platform.OS === 'web') return processed.uri;

  const fileName = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const destUri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.copyAsync({ from: processed.uri, to: destUri });
  return destUri;
}

export const mediaService = {
  // ─── Permisos ──────────────────────────────────────────────────────────
  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return true;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  },

  async requestGalleryPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return true;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  },

  async requestSavePermission(): Promise<boolean> {
    // expo-media-library no está disponible en Expo Go SDK 57.
    // Requiere development build.
    return false;
  },

  // ─── Captura ───────────────────────────────────────────────────────────
  async takePhoto(aspect: [number, number] = [1, 1]): Promise<PickedImage | null> {
    const allowed = await this.requestCameraPermission();
    if (!allowed) throw new Error('Permití el acceso a la cámara en los ajustes para tomar una foto.');

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect,
      quality: JPEG_QUALITY,
    });

    if (result.canceled || !result.assets?.length) return null;
    const asset = result.assets[0];
    const uri = await persistImage(asset.uri);
    return {
      uri,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName ?? undefined,
    };
  },

  async pickImage(aspect: [number, number] = [1, 1]): Promise<PickedImage | null> {
    const allowed = await this.requestGalleryPermission();
    if (!allowed) throw new Error('Permití el acceso a tus fotos en los ajustes para elegir una imagen.');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect,
      quality: JPEG_QUALITY,
    });

    if (result.canceled || !result.assets?.length) return null;
    const asset = result.assets[0];
    const uri = await persistImage(asset.uri);
    return {
      uri,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName ?? undefined,
    };
  },

  async pickMultipleImages(limit = 5): Promise<PickedImage[]> {
    const allowed = await this.requestGalleryPermission();
    if (!allowed) return [];

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: limit,
      quality: JPEG_QUALITY,
    });

    if (result.canceled || !result.assets?.length) return [];

    const persisted: PickedImage[] = [];
    for (const asset of result.assets) {
      const uri = await persistImage(asset.uri);
      persisted.push({
        uri,
        width: asset.width,
        height: asset.height,
        fileName: asset.fileName ?? undefined,
      });
    }
    return persisted;
  },

  // ─── Borrar ────────────────────────────────────────────────────────────
  async deleteImage(uri?: string): Promise<void> {
    if (!uri || Platform.OS === 'web') return;
    if (!uri.startsWith(FileSystem.documentDirectory ?? '')) return;
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (e) {
      console.warn('[mediaService] delete failed:', e);
    }
  },

  // ─── Compartir / Guardar ───────────────────────────────────────────────
  async shareImage(uri: string): Promise<boolean> {
    try {
      if (!(await Sharing.isAvailableAsync())) return false;
      await Sharing.shareAsync(uri);
      return true;
    } catch (e) {
      console.warn('[mediaService] share failed:', e);
      return false;
    }
  },

  async saveToGallery(_uri: string): Promise<boolean> {
    // expo-media-library no está disponible en Expo Go SDK 57.
    // Requiere development build.
    console.warn('[mediaService] saveToGallery no disponible en Expo Go');
    return false;
  },

};
