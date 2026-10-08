// Servicio de notificaciones locales. Expo-notifications ya no soporta push nativas.
// Carga de modulo con require y en try/catch para no romper la app, y
// Uso un fallback con Alert. 

import { Alert, Platform } from 'react-native';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('[notifications] modulo no disponible en este entorno:', e);
}

// Guardado de IDs de los setTimeout del fallback para poder cancelarlos
let timeoutIds = new Map<string, ReturnType<typeof setTimeout>>();
let intervalIds = new Map<string, ReturnType<typeof setInterval>>();
let fallbackCounter = 0;

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

  async hasPermission(): Promise<boolean> {
    if (!Notifications || Platform.OS === 'web') return false;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  async schedule(
    nombre: string,
    segundosHastaDisparar: number,
    userName?: string
  ): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    const saludo = userName ? `${userName}, es` : 'Es';

    // Intento: notificacion nativa (development build o iOS)
    if (Notifications) {
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Recordatorio de medicamento',
            body: `${saludo} hora de tomar ${nombre}`,
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

    // Fallback: simular con Alert (Expo Go Android no soporta push nativas)
    console.warn(
      '[notifications] usando fallback con Alert (limitacion de Expo Go Android)'
    );

    const fallbackId = `fallback-${++fallbackCounter}`;
    const timeoutId = setTimeout(() => {
      Alert.alert(
        'Recordatorio de medicamento',
        `${saludo} hora de tomar ${nombre}`
      );
      // Limpiar el id del array una vez disparado
      timeoutIds.delete(fallbackId);
    }, segundosHastaDisparar * 1000);

    timeoutIds.set(fallbackId, timeoutId);
    return fallbackId;
  },

  async scheduleRecurringInterval(
    nombre: string,
    segundos: number,
    personaName?: string
  ): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    const body = personaName
      ? `Recordatorio para ${personaName}: es hora de tomar ${nombre}`
      : `Es hora de tomar ${nombre}`;

    if (Notifications) {
      try {
        return await Notifications.scheduleNotificationAsync({
          content: { title: 'Recordatorio de medicamento', body, sound: 'default' },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: segundos,
            repeats: true,
          },
        });
      } catch (e) {
        console.warn('[notifications] recurring interval failed:', e);
      }
    }

    const fallbackId = `fallback-${++fallbackCounter}`;
    const intervalId = setInterval(() => Alert.alert('Recordatorio de medicamento', body), segundos * 1000);
    intervalIds.set(fallbackId, intervalId);
    return fallbackId;
  },

  async scheduleDaily(
    nombre: string,
    hour: number,
    minute: number,
    personaName?: string
  ): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    const body = personaName
      ? `Recordatorio para ${personaName}: es hora de tomar ${nombre}`
      : `Es hora de tomar ${nombre}`;

    if (Notifications) {
      try {
        return await Notifications.scheduleNotificationAsync({
          content: { title: 'Recordatorio de medicamento', body, sound: 'default' },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
          },
        });
      } catch (e) {
        console.warn('[notifications] daily schedule failed:', e);
      }
    }

    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
    const fallbackId = `fallback-${++fallbackCounter}`;
    const timeoutId = setTimeout(() => {
      Alert.alert('Recordatorio de medicamento', body);
      const intervalId = setInterval(() => Alert.alert('Recordatorio de medicamento', body), 24 * 60 * 60 * 1000);
      intervalIds.set(fallbackId, intervalId);
      timeoutIds.delete(fallbackId);
    }, next.getTime() - now.getTime());
    timeoutIds.set(fallbackId, timeoutId);
    return fallbackId;
  },

  async schedulePlan(
    plan: { nombre: string; tipoHorario?: 'intervalo' | 'diario'; frecuenciaHoras: number; horariosDiarios?: string[] },
    personaName?: string
  ): Promise<string[]> {
    const ids: string[] = [];
    if (plan.tipoHorario === 'diario') {
      for (const horario of plan.horariosDiarios ?? []) {
        const [hour, minute] = horario.split(':').map(Number);
        if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) continue;
        const id = await notificationService.scheduleDaily(plan.nombre, hour, minute, personaName);
        if (id) ids.push(id);
      }
      return ids;
    }
    const id = await notificationService.scheduleRecurringInterval(
      plan.nombre,
      Math.max(1, plan.frecuenciaHoras) * 60 * 60,
      personaName
    );
    if (id) ids.push(id);
    return ids;
  },

  async cancelMany(ids: Array<string | undefined>): Promise<void> {
    await Promise.all(ids.filter((id): id is string => Boolean(id)).map((id) => this.cancel(id)));
  },

  async cancel(id: string): Promise<void> {
    if (id.startsWith('fallback-')) {
      const timeoutId = timeoutIds.get(id);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutIds.delete(id);
      const intervalId = intervalIds.get(id);
      if (intervalId) clearInterval(intervalId);
      intervalIds.delete(id);
      return;
    }
    if (!Notifications || Platform.OS === 'web') return;
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.warn('[notifications] cancel failed:', e);
    }
  },

  // Cancela todas las notificaciones pendientes, nativas + fallback
  async cancelAll(): Promise<void> {
    // Cancelar los setTimeout pendientes del fallback
    timeoutIds.forEach((id) => clearTimeout(id));
    timeoutIds.clear();
    intervalIds.forEach((id) => clearInterval(id));
    intervalIds.clear();

    // Cancelar las notificaciones nativas pendientes, si estan disponibles
    if (Notifications && Platform.OS !== 'web') {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch (e) {
        console.warn('[notifications] cancelAll failed:', e);
      }
    }
  },
};
