// Gestiona los medicamentos en AsyncStorage y los separa por cuenta mediante el email.

import { calcularProximaToma } from './calcularTomas';
export { calcularProximaToma, calcularProximaTomaDiaria } from './calcularTomas';
import { storage } from '../../services/storage';
import { STORAGE_KEYS, ESTADOS_TOMA } from '../../config/constants';
import { mediaService } from '../../services/mediaService';

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
  historialTomas?: { fecha: number; estado: 'tomado' | 'omitido'; ubicacion?: string }[];
  estado: 'pendiente' | 'tomado' | 'omitido';
  createdAt: number;
  userEmail: string;
  personaId: string;
  tipoHorario?: 'intervalo' | 'diario';
  horariosDiarios?: string[];
  inicioHorario?: number;
  notificationIds?: string[];
  fotoUri?: string;
}

export const medicamentoService = {
  // Devuelve solo los medicamentos de la cuenta indicada.
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
      fotoUri: data.fotoUri,
      estado: ESTADOS_TOMA.pendiente.key,
      createdAt: Date.now(),
      userEmail,
    };
    await storage.set(STORAGE_KEYS.MEDICAMENTOS, [nuevo, ...todos]);
    return nuevo;
  },

  // Las operaciones de actualización y eliminación recorren la lista completa por ID.
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
    const item = todos.find((m) => m.id === id && m.userEmail === userEmail);
    if (item?.fotoUri) {
      await mediaService.deleteImage(item.fotoUri);
    }
    await storage.set(
      STORAGE_KEYS.MEDICAMENTOS,
      todos.filter((m) => m.id !== id || m.userEmail !== userEmail)
    );
  },

  async recordDose(
    userEmail: string,
    id: string,
    estado: 'tomado' | 'omitido',
    ubicacion?: string
  ): Promise<Medicamento | null> {
    const item = await medicamentoService.getById(userEmail, id);
    if (!item) return null;
    const ahora = Date.now();
    const proximaToma = calcularProximaToma(item, ahora);
    const historialTomas = [
      ...(item.historialTomas ?? []),
      { fecha: ahora, estado, ...(ubicacion ? { ubicacion } : {}) },
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


