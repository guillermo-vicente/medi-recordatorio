// Constantes de la app: estados, frecuencias y claves de storage.

export const APP_NAME = 'MediRecordatorio';

// --- Estados de una toma ---
export const ESTADOS_TOMA = {
  pendiente: {
    key: 'pendiente',
    label: 'Pendiente',
    color: '#F7B731',
    icon: 'time-outline',
  },
  tomado: {
    key: 'tomado',
    label: 'Tomado',
    color: '#20BF6B',
    icon: 'checkmark-circle',
  },
  omitido: {
    key: 'omitido',
    label: 'Omitido',
    color: '#FF6584',
    icon: 'close-circle',
  },
} as const;

export type EstadoToma = (typeof ESTADOS_TOMA)[keyof typeof ESTADOS_TOMA]['key'];

// --- Frecuencias de medicacion ---
export const FRECUENCIAS = [
  { label: 'Cada 4 horas', horas: 4 },
  { label: 'Cada 6 horas', horas: 6 },
  { label: 'Cada 8 horas', horas: 8 },
  { label: 'Cada 12 horas', horas: 12 },
  { label: 'Cada 24 horas', horas: 24 },
] as const;

// --- Claves de AsyncStorage ---
export const STORAGE_KEYS = {
  USERS: '@medicamentos:users',
  CURRENT_USER: '@medicamentos:current_user',
  MEDICAMENTOS: '@medicamentos:list',
} as const;