/**
 * Costonomy Jobs typography tokens.
 *
 * ## Why this file is bigger than the ops app's
 *
 * `costonomy-mobile-app` ships one font family (Source Sans 3) and hardcodes it
 * globally via `Text.defaultProps`. That works there because the ops app is
 * English-only.
 *
 * Jobs is English **and Hindi** from day one (PRD §16.1, LOCKED), and Source
 * Sans 3 has no Devanagari coverage at all. Setting it as the global default
 * would make every Hindi string fall through to the platform's own fallback —
 * Roboto on Android, a system face on iOS — so the Hindi build would silently
 * lose the brand typeface and, worse, look inconsistent between platforms and
 * between the two apps. Nobody would see an error; it would just look wrong.
 *
 * So the family is resolved *per script*, not set once globally:
 *
 *   Latin (en, and the ASCII inside a Hindi string) → Source Sans 3
 *   Devanagari (hi)                                 → Noto Sans Devanagari
 *
 * The two are metrically compatible enough to share one size scale, but not one
 * line-height scale — see `LineHeight` below.
 *
 * Adding Telugu/Tamil/Kannada later (07-localization §3 makes this a content
 * change, not a code change) means adding one row to `SCRIPT_FONTS` and one
 * font package. Nothing that consumes these tokens has to change.
 */

// ─── Font families, by script ────────────────────────────────────────────────

export type FontWeightName =
  | 'light'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'extrabold';

/** Scripts the app has a real typeface for. Extend alongside a new locale. */
export type ScriptName = 'latin' | 'devanagari';

const LATIN_FONTS: Record<FontWeightName, string> = {
  light: 'SourceSans3_300Light',
  regular: 'SourceSans3_400Regular',
  medium: 'SourceSans3_500Medium',
  semibold: 'SourceSans3_600SemiBold',
  bold: 'SourceSans3_700Bold',
  extrabold: 'SourceSans3_800ExtraBold',
};

const DEVANAGARI_FONTS: Record<FontWeightName, string> = {
  light: 'NotoSansDevanagari_300Light',
  regular: 'NotoSansDevanagari_400Regular',
  medium: 'NotoSansDevanagari_500Medium',
  semibold: 'NotoSansDevanagari_600SemiBold',
  bold: 'NotoSansDevanagari_700Bold',
  extrabold: 'NotoSansDevanagari_800ExtraBold',
};

const SCRIPT_FONTS: Record<ScriptName, Record<FontWeightName, string>> = {
  latin: LATIN_FONTS,
  devanagari: DEVANAGARI_FONTS,
};

/** Which script a locale code is written in. Unknown locales fall back to Latin. */
const LOCALE_SCRIPT: Record<string, ScriptName> = {
  en: 'latin',
  hi: 'devanagari',
  // Reserved per 10-testing-cicd-seed-data §8 — these have no bundle yet and
  // fall back to English copy, so Latin is correct until each gets a typeface.
  te: 'latin',
  ta: 'latin',
  kn: 'latin',
  mr: 'devanagari', // Marathi is Devanagari, so it works the day its copy lands
  bn: 'latin',
  ml: 'latin',
  gu: 'latin',
};

export function scriptForLocale(locale: string | undefined): ScriptName {
  if (!locale) return 'latin';
  return LOCALE_SCRIPT[locale.split('-')[0]!] ?? 'latin';
}

/**
 * The font family to use for `weight` in the active `locale`.
 *
 * Call this through `useFontFamily()` (hooks/useFontFamily.ts) in components.
 * The bare function exists for the handful of module-scope `StyleSheet.create`
 * calls that can't take a hook — those must pass an explicit locale rather than
 * assuming English.
 */
export function fontFamilyFor(
  weight: FontWeightName,
  locale: string | undefined = 'en',
): string {
  return SCRIPT_FONTS[scriptForLocale(locale)][weight];
}

/**
 * Latin family names, for the (common) case of a screen that is already
 * locale-aware at a higher level, and for the bundled-English fallback path.
 * Mirrors `FontFamily` in the ops app so lifted code compiles unchanged.
 */
export const FontFamily = LATIN_FONTS;

/** Every family name the app must load at boot, across all scripts. */
export const ALL_FONT_FAMILIES = [
  ...Object.values(LATIN_FONTS),
  ...Object.values(DEVANAGARI_FONTS),
];

// ─── Size scale ──────────────────────────────────────────────────────────────

/**
 * Identical to the ops app's scale. Deliberately: the two apps share a visual
 * family, and a candidate-facing app doesn't need bigger type so much as more
 * *space*, which is what `Spacing` handles.
 */
export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
} as const;

// ─── Line heights ────────────────────────────────────────────────────────────

/**
 * Devanagari carries marks both above (matras, anusvara) and below (halant,
 * subscript conjuncts) the base line. At the Latin multipliers those marks
 * collide with the line above and below — the single most common way a
 * "translated" app looks broken. Every multiplier is a step looser.
 */
export const LineHeight: Record<ScriptName, { tight: number; normal: number; relaxed: number }> = {
  latin: { tight: 1.2, normal: 1.5, relaxed: 1.7 },
  devanagari: { tight: 1.45, normal: 1.7, relaxed: 1.9 },
};

export function lineHeightFor(
  size: number,
  density: 'tight' | 'normal' | 'relaxed',
  locale: string | undefined = 'en',
): number {
  return Math.round(size * LineHeight[scriptForLocale(locale)][density]);
}

// ─── Named text styles ───────────────────────────────────────────────────────

/**
 * The presets a screen should reach for before inventing a size/weight pair.
 *
 * They intentionally carry **no colour** — colour is a semantic decision the
 * call site makes from `Colors`, and baking `textPrimary` in here would make
 * every inverse or muted variant fight the preset.
 *
 * `fontFamily` is Latin here. Compose with `useFontFamily()` at the call site
 * for a locale-correct family; `TextStyles.body` alone is right for English and
 * is the base every locale-aware style spreads over.
 */
export const TextStyles = {
  /** Screen titles. One per screen, in the header. */
  displayLg: {
    fontSize: FontSize.xxl,
    fontFamily: LATIN_FONTS.bold,
    lineHeight: Math.round(FontSize.xxl * 1.2),
    letterSpacing: -0.3,
  },
  /** Big numbers: salary on an offer, match score, funnel counts. */
  displayMd: {
    fontSize: FontSize.xl,
    fontFamily: LATIN_FONTS.bold,
    lineHeight: Math.round(FontSize.xl * 1.2),
    letterSpacing: -0.2,
  },
  /** Card titles: a job title, a candidate name. */
  titleLg: {
    fontSize: FontSize.lg,
    fontFamily: LATIN_FONTS.semibold,
    lineHeight: Math.round(FontSize.lg * 1.35),
  },
  titleMd: {
    fontSize: FontSize.md,
    fontFamily: LATIN_FONTS.semibold,
    lineHeight: Math.round(FontSize.md * 1.35),
  },
  /** Default running text. */
  body: {
    fontSize: FontSize.base,
    fontFamily: LATIN_FONTS.regular,
    lineHeight: Math.round(FontSize.base * 1.5),
  },
  bodyStrong: {
    fontSize: FontSize.base,
    fontFamily: LATIN_FONTS.semibold,
    lineHeight: Math.round(FontSize.base * 1.5),
  },
  /** Supporting text: outlet name under a job title, helper text under a field. */
  caption: {
    fontSize: FontSize.sm,
    fontFamily: LATIN_FONTS.regular,
    lineHeight: Math.round(FontSize.sm * 1.45),
  },
  captionStrong: {
    fontSize: FontSize.sm,
    fontFamily: LATIN_FONTS.semibold,
    lineHeight: Math.round(FontSize.sm * 1.45),
  },
  /** Badges, chips, metadata. The floor — never go smaller than this. */
  overline: {
    fontSize: FontSize.xs,
    fontFamily: LATIN_FONTS.semibold,
    lineHeight: Math.round(FontSize.xs * 1.4),
    letterSpacing: 0.2,
  },
  /** Button labels. Separate from `bodyStrong` so button type can be tuned alone. */
  button: {
    fontSize: FontSize.base,
    fontFamily: LATIN_FONTS.semibold,
    lineHeight: Math.round(FontSize.base * 1.3),
    letterSpacing: 0.1,
  },
} as const;

export type TextStyleName = keyof typeof TextStyles;

/**
 * Back-compat shim for code lifted from `costonomy-mobile-app`, which imports a
 * single flat `Typography` object holding sizes, weights and families together.
 * New code should use `FontSize` / `TextStyles` / `fontFamilyFor` instead.
 */
export const Typography = {
  ...FontSize,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  fontLight: LATIN_FONTS.light,
  fontRegular: LATIN_FONTS.regular,
  fontMedium: LATIN_FONTS.medium,
  fontSemiBold: LATIN_FONTS.semibold,
  fontBold: LATIN_FONTS.bold,
  fontExtraBold: LATIN_FONTS.extrabold,
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;
