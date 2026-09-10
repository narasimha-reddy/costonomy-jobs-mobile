import {
  SourceSans3_300Light,
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
  SourceSans3_800ExtraBold,
} from '@expo-google-fonts/source-sans-3';
import {
  NotoSansDevanagari_300Light,
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_500Medium,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
  NotoSansDevanagari_800ExtraBold,
} from '@expo-google-fonts/noto-sans-devanagari';

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
  SourceSans3_300Light,
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
  SourceSans3_800ExtraBold,
  NotoSansDevanagari_300Light,
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_500Medium,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
  NotoSansDevanagari_800ExtraBold,
} as const;
