import { useCallback, useEffect, useState } from 'react';
import { Medicamento, medicamentoService } from './medicamentoService';

export interface UseMedicamentosResult {
  medicamentos: Medicamento[];
  isLoading: boolean;
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
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await medicamentoService.list();
      setMedicamentos(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar medicamentos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load(), [load]);

  const add = useCallback(
    async (data: Omit<Medicamento, 'id' | 'estado' | 'createdAt'>) => {
      await medicamentoService.add(data);
      await load();
    },
    [load]
  );

  const remove = useCallback(
    async (id: string) => {
      await medicamentoService.remove(id);
      await load();
    },
    [load]
  );

  const markAsTaken = useCallback(
    async (id: string) => {
      await medicamentoService.markAsTaken(id);
      await load();
    },
    [load]
  );

  const markAsMissed = useCallback(
    async (id: string) => {
      await medicamentoService.markAsMissed(id);
      await load();
    },
    [load]
  );

  return { medicamentos, isLoading, error, refresh, add, remove, markAsTaken, markAsMissed };
}