// Operaciones CRUD de medicamentos sobre AsyncStorage.

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
}

export const medicamentoService = {
  async list(): Promise<Medicamento[]> {
    return storage.get<Medicamento[]>(STORAGE_KEYS.MEDICAMENTOS, []);
  },

  async getById(id: string): Promise<Medicamento | null> {
    const items = await medicamentoService.list();
    return items.find((m) => m.id === id) ?? null;
  },

  async add(data: Omit<Medicamento, 'id' | 'estado' | 'createdAt'>): Promise<Medicamento> {
    const items = await medicamentoService.list();
    const nuevo: Medicamento = {
      id: Date.now().toString(),
      nombre: data.nombre,
      dosis: data.dosis,
      frecuenciaHoras: data.frecuenciaHoras,
      proximaToma: data.proximaToma,
      estado: ESTADOS_TOMA.pendiente.key,
      createdAt: Date.now(),
    };
    await storage.set(STORAGE_KEYS.MEDICAMENTOS, [nuevo, ...items]);
    return nuevo;
  },

  async update(id: string, changes: Partial<Medicamento>): Promise<void> {
    const items = await medicamentoService.list();
    const updated = items.map((m) => (m.id === id ? { ...m, ...changes } : m));
    await storage.set(STORAGE_KEYS.MEDICAMENTOS, updated);
  },

  async remove(id: string): Promise<void> {
    const items = await medicamentoService.list();
    await storage.set(
      STORAGE_KEYS.MEDICAMENTOS,
      items.filter((m) => m.id !== id)
    );
  },

  async markAsTaken(id: string): Promise<void> {
    await medicamentoService.update(id, { estado: ESTADOS_TOMA.tomado.key });
  },

  async markAsMissed(id: string): Promise<void> {
    await medicamentoService.update(id, { estado: ESTADOS_TOMA.omitido.key });
  },
};