// Servicio de notificaciones locales.
// En Expo Go Android SDK 53+, el import de expo-notifications lanza
// una excepcion a nivel modulo. Por eso lo cargamos con require y en try/catch.
// Las notificaciones locales siguen funcionando.

import { Alert, Platform } from 'react-native';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('[notifications] modulo no disponible en este entorno:', e);
}

let handlerConfigurado = false;

function setupHandler() {
  if (!Notifications || handlerConfigurado) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerConfigurado = true;
  } catch (e) {
    console.warn('[notifications] handler setup failed:', e);
  }
}

export const notificationService = {
  setup() {
    setupHandler();
  },

  isAvailable(): boolean {
    return Notifications !== null && Platform.OS !== 'web';
  },

  async requestPermissions(): Promise<boolean> {
    if (!Notifications || Platform.OS === 'web') return false;
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Recordatorios',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.warn('[notifications] permissions failed:', e);
      return false;
    }
  },

  async schedule(
  nombre: string,
  segundosHastaDisparar: number
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  // Intento 1: notificación real (mobile con dev build o iOS)
  if (Notifications) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Recordatorio de medicamento',
          body: `Es hora de tomar ${nombre}`,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: segundosHastaDisparar,
        },
      });
      return id;
    } catch (e) {
      console.warn('[notifications] schedule failed:', e);
    }
  }

  // Fallback: simular con Alert (Expo Go Android no soporta notificaciones)
  console.warn(
    '[notifications] usando fallback con Alert (limitacion de Expo Go Android)'
  );
  setTimeout(() => {
    Alert.alert(
      'Recordatorio de medicamento',
      `Es hora de tomar ${nombre}`
    );
  }, segundosHastaDisparar * 1000);

  return null;
},

  async cancel(id: string): Promise<void> {
    if (!Notifications || Platform.OS === 'web') return;
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.warn('[notifications] cancel failed:', e);
    }
  },
};