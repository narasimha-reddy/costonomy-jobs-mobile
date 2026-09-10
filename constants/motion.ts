import { Easing } from 'react-native-reanimated';

/**
 * Motion tokens.
 *
 * Two rules this codifies, both from 05-mobile-screens §6:
 *
 * 1. Nothing that already has cached content is allowed a full-screen blocking
 *    spinner — it gets a skeleton at `skeletonPulse` instead.
 * 2. A press must acknowledge within `instant`. Anything slower reads as a
 *    dropped tap on the mid-range Android hardware this audience carries, and a
 *    dropped tap is how you lose an application.
 */
export const Duration = {
  /** Press feedback, ripple, chip toggle. */
  instant: 120,
  /** Fades, accordion disclosure, inline error appearing. */
  fast: 200,
  /** Sheet in/out, screen transition. */
  base: 280,
  /** Full-screen takeovers, the check-in success state. */
  slow: 400,
  /** One full breath of a loading skeleton. */
  skeletonPulse: 1500,
} as const;

export const Ease = {
  /** Default for anything entering — decelerates into place. */
  out: Easing.out(Easing.cubic),
  /** For anything leaving — accelerates away. */
  in: Easing.in(Easing.cubic),
  /** Two-way movement: a sheet being dragged, a value counting up. */
  inOut: Easing.inOut(Easing.ease),
} as const;

/** Opacity a `TouchableOpacity` drops to on press. One value, everywhere. */
export const PRESS_OPACITY = 0.7;
