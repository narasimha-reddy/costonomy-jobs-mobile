import { useCallback } from 'react';
import { useLocale } from '@/lib/locale';
import { fontFamilyFor, lineHeightFor, type FontWeightName } from '@/constants/typography';

/**
 * Locale-correct font families for the component that calls it.
 *
 * Every component in `components/ui` uses this rather than importing
 * `FontFamily` directly, which is what makes a Hindi build render in Noto Sans
 * Devanagari instead of falling through to the platform's default face — see
 * the header comment in `constants/typography.ts` for why that fallback is a
 * silent failure worth this much machinery.
 *
 * ```tsx
 * const { font, lineHeight } = useFontFamily();
 * <Text style={[styles.title, { fontFamily: font('semibold') }]}>…</Text>
 * ```
 */
export function useFontFamily() {
  const locale = useLocale();

  const font = useCallback(
    (weight: FontWeightName) => fontFamilyFor(weight, locale),
    [locale],
  );

  const lineHeight = useCallback(
    (size: number, density: 'tight' | 'normal' | 'relaxed' = 'normal') =>
      lineHeightFor(size, density, locale),
    [locale],
  );

  return { font, lineHeight, locale };
}
