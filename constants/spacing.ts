import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Spacing, radius and elevation tokens.
 *
 * The base 4pt scale and the radius scale are identical to
 * `costonomy-mobile-app`. What differs is `Touch` below: the ops app is used by
 * trained staff on their own device several times a day, so it can afford dense
 * 36–40pt rows. Jobs is used by a candidate who may be standing outside a
 * restaurant, one-handed, on a cheap phone, once a week — so every interactive
 * element has a 48pt minimum target, no exceptions.
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  /** Big vertical breaks: between major sections of a long form or detail screen. */
  section: 40,

  screenHorizontal: 16,
  screenVertical: 16,
  cardPadding: 16,
  cardPaddingCompact: 12,
  /** Detail screens and empty states, where the content should breathe. */
  cardPaddingRoomy: 20,

  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 20,
  radiusFull: 9999,
} as const;

/**
 * Minimum hit targets. `min` is the floor for anything tappable — Apple's HIG
 * says 44, Android's Material says 48; 48 satisfies both and is what a thumb
 * actually needs on a 5.5" screen in daylight.
 */
export const Touch = {
  min: 48,
  buttonHeightSm: 40,
  buttonHeightMd: 48,
  buttonHeightLg: 56,
  inputHeight: 52,
  /** Expands a small icon's tappable area without changing its visual size. */
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  /** Bottom sheets and modals — the shadow points *up* toward the scrim. */
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

export const Layout = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 375,
  tabBarHeight: 60,
  headerHeight: Platform.OS === 'ios' ? 44 : 56,
} as const;
