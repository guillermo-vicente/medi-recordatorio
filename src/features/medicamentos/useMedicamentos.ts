import { useCallback, useEffect, useState } from 'react';
import { Medicamento, medicamentoService } from './medicamentoService';
import { useAuth } from '../auth/useAuth';

export interface UseMedicamentosResult {
  medicamentos: Medicamento[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  reloadSilently: () => Promise<void>;
  add: (
    data: Omit<Medicamento, 'id' | 'estado' | 'createdAt' | 'userEmail'>
  ) => Promise<void>;
  remove: (id: string) => Promise<void>;
  markAsTaken: (id: string) => Promise<void>;
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
      // Si no hay usuario logueado, no hay nada que cargar
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
    [user?.email]   // <-- clave: recarga cuando cambia el usuario
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
      await medicamentoService.add(user.email, data);
      await reloadSilently();
    },
    [user?.email, reloadSilently]
  );

  const remove = useCallback(
    async (id: string) => {
      await medicamentoService.remove(id);
      await reloadSilently();
    },
    [reloadSilently]
  );

  const markAsTaken = useCallback(
    async (id: string) => {
      await medicamentoService.markAsTaken(id);
      await reloadSilently();
    },
    [reloadSilently]
  );

  const markAsMissed = useCallback(
    async (id: string) => {
      await medicamentoService.markAsMissed(id);
      await reloadSilently();
    },
    [reloadSilently]
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
    markAsTaken,
    markAsMissed,
  };
}