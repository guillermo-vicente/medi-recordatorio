import { useCallback, useEffect, useState } from 'react';
import { Medicamento, medicamentoService } from './medicamentoService';

export interface UseMedicamentosResult {
  medicamentos: Medicamento[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (data: Omit<Medicamento, 'id' | 'estado' | 'createdAt'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  markAsTaken: (id: string) => Promise<void>;
  markAsMissed: (id: string) => Promise<void>;
}

export function useMedicamentos(): UseMedicamentosResult {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
      if (mode === 'initial') setIsLoading(true);
      if (mode === 'refresh') setIsRefreshing(true);
      if (mode !== 'silent') setError(null);

      try {
        const items = await medicamentoService.list();
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
    []
  );

  useEffect(() => {
    load('initial');
  }, [load]);

  const refresh = useCallback(() => load('refresh'), [load]);
  const reloadSilently = useCallback(() => load('silent'), [load]);

  const add = useCallback(
    async (data: Omit<Medicamento, 'id' | 'estado' | 'createdAt'>) => {
      await medicamentoService.add(data);
      await reloadSilently();
    },
    [reloadSilently]
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
    add,
    remove,
    markAsTaken,
    markAsMissed,
  };
}