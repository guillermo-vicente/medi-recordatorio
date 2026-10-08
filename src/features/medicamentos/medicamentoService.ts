// Operaciones CRUD de medicamentos sobre AsyncStorage.
// Cada medicamento está asociado al email del usuario que lo creó,
// y el servicio filtra por ese email para aislar los datos.

import { storage } from '../../services/storage';
import { STORAGE_KEYS, ESTADOS_TOMA } from '../../config/constants';

export interface Medicamento {
  id: string;
  nombre: string;
  dosis: string;
  frecuenciaHoras: number;
  proximaToma: number;
  momentoComida?: 'antes' | 'durante' | 'despues' | 'sin_indicar';
  observaciones?: string;
  /** Compatibilidad con registros creados antes de separar las indicaciones. */
  indicaciones?: string;
  notificationId?: string;
  ultimaToma?: number;
  historialTomas?: { fecha: number; estado: 'tomado' | 'omitido' }[];
  estado: 'pendiente' | 'tomado' | 'omitido';
  createdAt: number;
  userEmail: string;
  personaId: string;
  tipoHorario?: 'intervalo' | 'diario';
  horariosDiarios?: string[];
  inicioHorario?: number;
  notificationIds?: string[];
}

export const medicamentoService = {
  // Devuelve solo los medicamentos del usuario actual
  async list(userEmail: string): Promise<Medicamento[]> {
    const todos = await storage.get<Medicamento[]>(
      STORAGE_KEYS.MEDICAMENTOS,
      []
    );
    let migrated = false;
    const ownPersonaId = `propia:${userEmail}`;
    const userItems = todos.map((item) => {
      if (item.userEmail !== userEmail || item.personaId) return item;
      migrated = true;
      return { ...item, personaId: ownPersonaId };
    });
    if (migrated) await storage.set(STORAGE_KEYS.MEDICAMENTOS, userItems);
    return userItems.filter((m) => m.userEmail === userEmail);
  },

  async getById(userEmail: string, id: string): Promise<Medicamento | null> {
    const items = await medicamentoService.list(userEmail);
    return items.find((m) => m.id === id) ?? null;
  },

  async add(
    userEmail: string,
    data: Omit<Medicamento, 'id' | 'estado' | 'createdAt' | 'userEmail'>
  ): Promise<Medicamento> {
    const todos = await storage.get<Medicamento[]>(
      STORAGE_KEYS.MEDICAMENTOS,
      []
    );
    const nuevo: Medicamento = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nombre: data.nombre,
      dosis: data.dosis,
      frecuenciaHoras: data.frecuenciaHoras,
      proximaToma: data.proximaToma,
      personaId: data.personaId,
      tipoHorario: data.tipoHorario ?? 'intervalo',
      horariosDiarios: data.horariosDiarios,
      inicioHorario: data.inicioHorario,
      notificationIds: data.notificationIds ?? [],
      momentoComida: data.momentoComida,
      observaciones: data.observaciones,
      indicaciones: data.indicaciones,
      estado: ESTADOS_TOMA.pendiente.key,
      createdAt: Date.now(),
      userEmail,
    };
    await storage.set(STORAGE_KEYS.MEDICAMENTOS, [nuevo, ...todos]);
    return nuevo;
  },

  // update y remove trabajan sobre la lista completa porque el id es único
  async update(userEmail: string, id: string, changes: Partial<Medicamento>): Promise<void> {
    const todos = await storage.get<Medicamento[]>(
      STORAGE_KEYS.MEDICAMENTOS,
      []
    );
    const updated = todos.map((m) =>
      m.id === id && m.userEmail === userEmail ? { ...m, ...changes } : m
    );
    await storage.set(STORAGE_KEYS.MEDICAMENTOS, updated);
  },

  async remove(userEmail: string, id: string): Promise<void> {
    const todos = await storage.get<Medicamento[]>(
      STORAGE_KEYS.MEDICAMENTOS,
      []
    );
    await storage.set(
      STORAGE_KEYS.MEDICAMENTOS,
      todos.filter((m) => m.id !== id || m.userEmail !== userEmail)
    );
  },

  async recordDose(
    userEmail: string,
    id: string,
    estado: 'tomado' | 'omitido'
  ): Promise<Medicamento | null> {
    const item = await medicamentoService.getById(userEmail, id);
    if (!item) return null;
    const ahora = Date.now();
    const proximaToma = calcularProximaToma(item, ahora);
    const historialTomas = [
      ...(item.historialTomas ?? []),
      { fecha: ahora, estado },
    ].slice(-100);
    const updated: Medicamento = {
      ...item,
      estado,
      ultimaToma: estado === 'tomado' ? ahora : item.ultimaToma,
      historialTomas,
      proximaToma,
      notificationId: undefined,
    };
    await medicamentoService.update(userEmail, id, {
      estado,
      ultimaToma: updated.ultimaToma,
      historialTomas,
      proximaToma,
      notificationId: undefined,
    });
    return updated;
  },
};

const HORA_MS = 60 * 60 * 1000;

export function calcularProximaToma(item: Medicamento, desde = Date.now()): number {
  if (item.tipoHorario === 'diario' && item.horariosDiarios?.length) {
    return calcularProximaTomaDiaria(item.horariosDiarios, desde);
  }

  const intervalMs = Math.max(1, item.frecuenciaHoras) * HORA_MS;
  const anchor = item.inicioHorario ?? item.proximaToma - intervalMs;
  const intervalsElapsed = Math.floor((desde - anchor) / intervalMs) + 1;
  return anchor + Math.max(1, intervalsElapsed) * intervalMs;
}

export function calcularProximaTomaDiaria(horarios: string[], desde = Date.now()): number {
  const validTimes = horarios
    .map((value) => value.split(':').map(Number))
    .filter(([hour, minute]) => Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)
    .map(([hour, minute]) => ({ hour, minute, minuteOfDay: hour * 60 + minute }))
    .sort((a, b) => a.minuteOfDay - b.minuteOfDay);
  if (!validTimes.length) return desde;

  const now = new Date(desde);
  const minuteOfDayNow = now.getHours() * 60 + now.getMinutes();
  const upcoming = validTimes.find((time) => time.minuteOfDay > minuteOfDayNow);
  const chosen = upcoming ?? validTimes[0];
  const next = new Date(desde);
  if (!upcoming) next.setDate(next.getDate() + 1);
  next.setHours(chosen.hour, chosen.minute, 0, 0);
  return next.getTime();
}
