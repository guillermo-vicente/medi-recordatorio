// Wrapper de AsyncStorage con tipado generico.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const storage = {
  async set<T>(key: StorageKey, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async get<T>(key: StorageKey, fallback: T): Promise<T> {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  },

  async remove(key: StorageKey): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  },
};