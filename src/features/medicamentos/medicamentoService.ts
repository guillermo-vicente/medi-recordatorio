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
  estado: 'pendiente' | 'tomado' | 'omitido';
  createdAt: number;
  userEmail: string;
}

export const medicamentoService = {
  // Devuelve solo los medicamentos del usuario actual
  async list(userEmail: string): Promise<Medicamento[]> {
    const todos = await storage.get<Medicamento[]>(
      STORAGE_KEYS.MEDICAMENTOS,
      []
    );
    return todos.filter((m) => m.userEmail === userEmail);
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
      id: Date.now().toString(),
      nombre: data.nombre,
      dosis: data.dosis,
      frecuenciaHoras: data.frecuenciaHoras,
      proximaToma: data.proximaToma,
      estado: ESTADOS_TOMA.pendiente.key,
      createdAt: Date.now(),
      userEmail,
    };
    await storage.set(STORAGE_KEYS.MEDICAMENTOS, [nuevo, ...todos]);
    return nuevo;
  },

  // update y remove trabajan sobre la lista completa porque el id es único
  async update(id: string, changes: Partial<Medicamento>): Promise<void> {
    const todos = await storage.get<Medicamento[]>(
      STORAGE_KEYS.MEDICAMENTOS,
      []
    );
    const updated = todos.map((m) =>
      m.id === id ? { ...m, ...changes } : m
    );
    await storage.set(STORAGE_KEYS.MEDICAMENTOS, updated);
  },

  async remove(id: string): Promise<void> {
    const todos = await storage.get<Medicamento[]>(
      STORAGE_KEYS.MEDICAMENTOS,
      []
    );
    await storage.set(
      STORAGE_KEYS.MEDICAMENTOS,
      todos.filter((m) => m.id !== id)
    );
  },

  async markAsTaken(id: string): Promise<void> {
    await medicamentoService.update(id, { estado: ESTADOS_TOMA.tomado.key });
  },

  async markAsMissed(id: string): Promise<void> {
    await medicamentoService.update(id, { estado: ESTADOS_TOMA.omitido.key });
  },
};