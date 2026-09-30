// Almacenamiento seguro del token de sesion.
// En web usa localStorage porque expo-secure-store no existe en navegador.

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

const webStorage = {
  async set(key: string, value: string): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  async get(key: string): Promise<string | null> {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  async remove(key: string): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

const nativeStorage = {
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  get: (key: string) => SecureStore.getItemAsync(key),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};

const impl = Platform.OS === 'web' ? webStorage : nativeStorage;

export const tokenStorage = {
  set: (token: string) => impl.set(TOKEN_KEY, token),
  get: () => impl.get(TOKEN_KEY),
  remove: () => impl.remove(TOKEN_KEY),
};
