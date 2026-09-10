import { useSyncExternalStore } from 'react';

/**
 * The active UI locale, as a tiny module-level store.
 *
 * Deliberately *not* a React context. The locale is read from inside
 * `StyleSheet`-adjacent code and from non-React helpers (date/number
 * formatting, the API client's `Accept-Language` header), and a context would
 * force all of those through a component tree they don't live in.
 *
 * This is the seam the real i18n layer (07-localization §3: fetch
 * `GET /locales/{lang}.json`, cache in AsyncStorage, fall back to the bundled
 * `en.json`) plugs into later — it will call `setLocale` and nothing that
 * consumes the locale today has to change.
 */
export type Locale = 'en' | 'hi';

export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'hi'] as const;

let current: Locale = 'en';
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  return current;
}

export function setLocale(next: Locale): void {
  if (next === current) return;
  current = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Re-renders the calling component whenever the locale changes. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, getLocale);
}
