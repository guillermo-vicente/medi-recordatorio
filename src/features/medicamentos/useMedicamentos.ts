import { useCallback, useEffect, useState } from 'react';
import { Medicamento, medicamentoService } from './medicamentoService';
import { useAuth } from '../auth/useAuth';
import { notificationService } from '../notifications/notificationService';

export interface UseMedicamentosResult {
  medicamentos: Medicamento[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  reloadSilently: () => Promise<void>;
  add: (
    data: Omit<Medicamento, 'id' | 'estado' | 'createdAt' | 'userEmail'>
  ) => Promise<Medicamento>;
  remove: (id: string) => Promise<void>;
  update: (id: string, changes: Partial<Medicamento>) => Promise<void>;
  markAsTaken: (id: string, ubicacion?: string) => Promise<void>;
  markAsMissed: (id: string) => Promise<void>;
}

export function useMedicamentos(): UseMedicamentosResult {
  const { user } = useAuth();
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
      // Sin una sesión activa, la lista de medicamentos queda vacía.
      if (!user?.email) {
        setMedicamentos([]);
        setIsLoading(false);
        return;
      }

      if (mode === 'initial') setIsLoading(true);
      if (mode === 'refresh') setIsRefreshing(true);
      if (mode !== 'silent') setError(null);

      try {
        const items = await medicamentoService.list(user.email);
        setMedicamentos(items);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : 'Error al cargar medicamentos'
        );
      } finally {
        if (mode === 'initial') setIsLoading(false);
        if (mode === 'refresh') setIsRefreshing(false);
      }
    },
    // Recalcula la carga cuando cambia la cuenta activa.
    [user?.email]
  );

  useEffect(() => {
    load('initial');
  }, [load]);

  const refresh = useCallback(() => load('refresh'), [load]);
  const reloadSilently = useCallback(() => load('silent'), [load]);

  const add = useCallback(
    async (
      data: Omit<Medicamento, 'id' | 'estado' | 'createdAt' | 'userEmail'>
    ) => {
      if (!user?.email) {
        throw new Error('Usuario no autenticado');
      }
      const created = await medicamentoService.add(user.email, data);
      await reloadSilently();
      return created;
    },
    [user?.email, reloadSilently]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user?.email) throw new Error('Usuario no autenticado');
      const item = await medicamentoService.getById(user.email, id);
      if (!item) return;
      await notificationService.cancelMany([...(item.notificationIds ?? []), item.notificationId]);
      await medicamentoService.remove(user.email, id);
      await reloadSilently();
    },
    [user?.email, reloadSilently]
  );

  const update = useCallback(
    async (id: string, changes: Partial<Medicamento>) => {
      if (!user?.email) throw new Error('Usuario no autenticado');
      const item = await medicamentoService.getById(user.email, id);
      if (!item) throw new Error('No se encontró el medicamento');
      await medicamentoService.update(user.email, id, changes);
      await reloadSilently();
    },
    [user?.email, reloadSilently]
  );

  const recordDose = useCallback(
    async (id: string, estado: 'tomado' | 'omitido', ubicacion?: string) => {
      if (!user?.email) throw new Error('Usuario no autenticado');
      const item = await medicamentoService.getById(user.email, id);
      if (!item) return;
      const next = await medicamentoService.recordDose(user.email, id, estado, ubicacion);
      if (!next) return;
      await reloadSilently();
    },
    [user?.email, user?.name, reloadSilently]
  );

  const markAsTaken = useCallback(
    async (id: string, ubicacion?: string) => recordDose(id, 'tomado', ubicacion),
    [recordDose]
  );

  const markAsMissed = useCallback(
    async (id: string) => recordDose(id, 'omitido'),
    [recordDose]
  );

  return {
    medicamentos,
    isLoading,
    isRefreshing,
    error,
    refresh,
    reloadSilently, 
    add,
    remove,
    update,
    markAsTaken,
    markAsMissed,
  };
}
