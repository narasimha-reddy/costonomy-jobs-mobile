/**
 * Window size classes, in dp, following Material 3's classes — the same ones
 * `costonomy-mobile-app/constants/breakpoints.ts` uses, so a layout rule written
 * for one app means the same thing in the other.
 *
 * Classification uses the window's **shortest side**, which keeps a device in
 * the same class through a rotation, so a layout can't flip branches mid-spin.
 * It also degrades correctly: an iPad in Slide Over is ~320dp and is treated as
 * a phone, which is exactly the layout that fits there.
 *
 * Jobs is phone-first far more than the ops app is — a candidate is on a phone,
 * always. Tablet support here is about a restaurant manager reviewing a hiring
 * inbox on an iPad, so `expanded` mostly means "cap the column, don't stretch."
 */
export const Breakpoints = {
  /** Phones, and any window narrower than a tablet's short side. */
  compact: 0,
  /** Small tablets, and large tablets in a two-thirds Split View. */
  medium: 600,
  /** Full-screen tablets. */
  expanded: 840,
} as const;

export type SizeClass = 'compact' | 'medium' | 'expanded';

/**
 * In a desktop browser the app renders as a phone-width column, the same 430 as
 * costonomy-mobile-app's web frame, so the web build shows the phone layout —
 * which is the product — rather than a stretched tablet one.
 */
export const WEB_FRAME_WIDTH = 430;

export const TABLET_MIN_SHORT_SIDE = Breakpoints.medium;

/**
 * Max content width per size class. A job card that reads well at 390dp becomes
 * an unreadable ribbon at 1024dp; capping the column is what makes a tablet
 * look like a tablet layout rather than a blown-up phone. `null` on compact
 * means "full width" — phones are untouched.
 */
export const ContentMaxWidth: Record<SizeClass, number | null> = {
  compact: null,
  medium: 720,
  expanded: 900,
};

/** Width cap for bottom sheets and pickers on tablet. */
export const SHEET_MAX_WIDTH_TABLET = 560;

/** Horizontal screen gutter per size class. `compact` matches `Spacing.screenHorizontal`. */
export const Gutter: Record<SizeClass, number> = {
  compact: 16,
  medium: 24,
  expanded: 32,
};

/** Classify a window from raw dimensions. Pure — safe to unit test. */
export function sizeClassFor(width: number, height: number): SizeClass {
  const shortSide = Math.min(width, height);
  if (shortSide < Breakpoints.medium) return 'compact';
  if (shortSide < Breakpoints.expanded) return 'medium';
  return 'expanded';
}
