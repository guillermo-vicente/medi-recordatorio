import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { medicamentoService } from '../medicamentos/medicamentoService';
import { mediaService } from '../../services/mediaService';
import { Persona, personaService } from './personaService';

export function usePersonas() {
  const { user } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user?.email) {
      setPersonas([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setPersonas(await personaService.list(user.email, user.name));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las personas.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, user?.name]);

  useEffect(() => { void reload(); }, [reload]);

  const add = useCallback(async (nombre: string, relacion?: string, avatarUri?: string) => {
    if (!user?.email) throw new Error('Usuario no autenticado');
    if (!nombre.trim()) throw new Error('El nombre es obligatorio.');
    const created = await personaService.add(user.email, nombre, relacion, avatarUri);
    await reload();
    return created;
  }, [user?.email, reload]);

  const update = useCallback(async (persona: Persona, nombre: string, relacion?: string) => {
    if (!user?.email) throw new Error('Usuario no autenticado');
    await personaService.update(user.email, persona.id, { nombre, relacion });
    await reload();
  }, [user?.email, reload]);

  const remove = useCallback(async (persona: Persona) => {
    if (!user?.email) throw new Error('Usuario no autenticado');
    if (persona.esPropia) throw new Error('La ficha propia no se puede quitar.');
    const medication = (await medicamentoService.list(user.email)).find((item) => item.personaId === persona.id);
    if (medication) throw new Error('Primero reasigná o eliminá sus medicamentos.');
    await personaService.remove(user.email, persona.id);
    await mediaService.deleteImage(persona.avatarUri);
    await reload();
  }, [user?.email, reload]);

  return { personas, isLoading, error, reload, add, update, remove };
}
