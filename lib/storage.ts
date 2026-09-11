import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Key-value persistence for the session.
 *
 * Tokens go to the Keychain / Keystore on a phone. The web build — used for
 * development and screenshots — has no secure store, so it falls back to
 * localStorage, which is acceptable for a dev surface and never shipped to users.
 */
const web = Platform.OS === 'web';

export const storage = {
  async get(key: string): Promise<string | null> {
    if (web) return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (web) {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (web) {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
