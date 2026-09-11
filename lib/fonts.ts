// Per-weight subpaths, not the package index: the index requires every weight and
// italic of the family, and Metro bundles every file it can see required — about
// 10 MB of fonts for the four weights this app actually renders.
import { SourceSans3_400Regular } from '@expo-google-fonts/source-sans-3/400Regular';
import { SourceSans3_500Medium } from '@expo-google-fonts/source-sans-3/500Medium';
import { SourceSans3_600SemiBold } from '@expo-google-fonts/source-sans-3/600SemiBold';
import { SourceSans3_700Bold } from '@expo-google-fonts/source-sans-3/700Bold';
import { NotoSansDevanagari_400Regular } from '@expo-google-fonts/noto-sans-devanagari/400Regular';
import { NotoSansDevanagari_500Medium } from '@expo-google-fonts/noto-sans-devanagari/500Medium';
import { NotoSansDevanagari_600SemiBold } from '@expo-google-fonts/noto-sans-devanagari/600SemiBold';
import { NotoSansDevanagari_700Bold } from '@expo-google-fonts/noto-sans-devanagari/700Bold';

/**
 * Every typeface the app can render, loaded at boot.
 *
 * Both scripts load up front rather than on locale switch. The Devanagari faces
 * are the larger half of the payload, so lazy-loading them is tempting — but the
 * locale can change at any moment from `LanguageSetting`, and a font that
 * arrives a beat after the strings do produces a visible reflow of the entire
 * screen. Paying for both once at splash is the better trade at this size.
 *
 * Pass to `useFonts()` in the root layout:
 *
 * ```tsx
 * const [loaded] = useFonts(APP_FONTS);
 * ```
 */
export const APP_FONTS = {
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_500Medium,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
} as const;
