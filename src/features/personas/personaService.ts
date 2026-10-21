import { storage } from '../../services/storage';
import { STORAGE_KEYS } from '../../config/constants';

export interface Persona {
  id: string;
  ownerEmail: string;
  nombre: string;
  relacion?: string;
  avatarUri?: string;
  emergencyContact?: { name: string; phone?: string };
  esPropia: boolean;
  createdAt: number;
}

function ownPersonaId(email: string): string {
  return `propia:${email}`;
}

const pendingLists = new Map<string, Promise<Persona[]>>();

export const personaService = {
  list(ownerEmail: string, ownerName: string): Promise<Persona[]> {
    const pending = pendingLists.get(ownerEmail);
    if (pending) return pending;
    const request = (async () => {
      const all = await storage.get<Persona[]>(STORAGE_KEYS.PERSONAS, []);
      let own = all.find((persona) => persona.ownerEmail === ownerEmail && persona.esPropia);
      if (!own) {
        own = {
          id: ownPersonaId(ownerEmail),
          ownerEmail,
          nombre: ownerName || 'Mi seguimiento',
          relacion: 'Yo',
          esPropia: true,
          createdAt: Date.now(),
        };
        await storage.set(STORAGE_KEYS.PERSONAS, [...all, own]);
        all.push(own);
      }
      return [own, ...all.filter((persona) => persona.ownerEmail === ownerEmail && persona.id !== own.id)];
    })().finally(() => pendingLists.delete(ownerEmail));
    pendingLists.set(ownerEmail, request);
    return request;
  },

  async add(ownerEmail: string, nombre: string, relacion?: string, avatarUri?: string, emergencyContact?: { name: string; phone?: string }): Promise<Persona> {
    const all = await storage.get<Persona[]>(STORAGE_KEYS.PERSONAS, []);
    const persona: Persona = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ownerEmail,
      nombre: nombre.trim(),
      relacion: relacion?.trim() || undefined,
      avatarUri,
      emergencyContact,
      esPropia: false,
      createdAt: Date.now(),
    };
    await storage.set(STORAGE_KEYS.PERSONAS, [...all, persona]);
    return persona;
  },

  async update(ownerEmail: string, id: string, changes: Pick<Persona, 'nombre' | 'relacion' | 'avatarUri' | 'emergencyContact'>): Promise<void> {
    const all = await storage.get<Persona[]>(STORAGE_KEYS.PERSONAS, []);
    await storage.set(
      STORAGE_KEYS.PERSONAS,
      all.map((persona) => persona.id === id && persona.ownerEmail === ownerEmail
        ? { ...persona, ...changes, nombre: changes.nombre.trim(), relacion: changes.relacion?.trim() || undefined }
        : persona)
    );
  },

  async remove(ownerEmail: string, id: string): Promise<void> {
    const all = await storage.get<Persona[]>(STORAGE_KEYS.PERSONAS, []);
    await storage.set(
      STORAGE_KEYS.PERSONAS,
      all.filter((persona) => persona.id !== id || persona.ownerEmail !== ownerEmail || persona.esPropia)
    );
  },
};

export function getOwnPersonaId(email: string): string {
  return ownPersonaId(email);
}
