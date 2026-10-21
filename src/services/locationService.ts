import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export const locationService = {
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentLocation(): Promise<UserLocation | null> {
    const allowed = await this.requestPermission();
    if (!allowed) {
      throw new Error('Permití el acceso a la ubicación para registrar el lugar.');
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Intentar obtener la dirección (fallback silencioso si falla)
      let address: string | undefined;
      try {
        const [geocode] = await Location.reverseGeocodeAsync(coords);
        if (geocode) {
          address = [geocode.street, geocode.streetNumber, geocode.city]
            .filter(Boolean)
            .join(', ');
        }
      } catch {
        // Si falla la geocodificación, devolvemos solo las coordenadas
      }

      return { ...coords, address };
    } catch (error) {
      console.warn('[locationService] Error getting location:', error);
      return null;
    }
  },
};