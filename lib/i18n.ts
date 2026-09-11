import { useCallback } from 'react';
import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import { getLocale, useLocale, type Locale } from '@/lib/locale';

/**
 * UI copy, bundled for both languages.
 *
 * Keys are the English bundle's keys, so a typo in `t('feed.titel')` is a compile
 * error, and `scripts/check-locale-parity.js` fails if Hindi drifts from English.
 * A key Hindi lacks at runtime falls back to English rather than rendering the key.
 *
 * Design 07 §3 moves these bundles to the server later so a language can ship
 * without a store release; this module is the only thing that would change.
 */
export type MessageKey = keyof typeof en;

const BUNDLES: Record<Locale, Record<string, string>> = { en, hi };

type Params = Record<string, string | number>;

function interpolate(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] !== undefined ? String(params[name]) : match,
  );
}

/** For non-React code. Components use `useT()` so they re-render on a language switch. */
export function translate(key: MessageKey, params?: Params, locale: Locale = getLocale()): string {
  return interpolate(BUNDLES[locale][key] ?? en[key] ?? key, params);
}

/**
 * For keys built at runtime from a server value — `availability.${status}`. Unknown
 * values show `fallback` (usually the raw value), never a dotted key.
 */
export function translateDynamic(key: string, fallback: string, locale: Locale = getLocale()): string {
  return BUNDLES[locale][key] ?? (en as Record<string, string>)[key] ?? fallback;
}

export function useT() {
  const locale = useLocale();
  const t = useCallback((key: MessageKey, params?: Params) => translate(key, params, locale), [locale]);
  const tx = useCallback(
    (key: string, fallback?: string, params?: Params) =>
      interpolate(translateDynamic(key, fallback ?? key.split('.').pop() ?? key, locale), params),
    [locale],
  );
  return { t, tx, locale };
}
