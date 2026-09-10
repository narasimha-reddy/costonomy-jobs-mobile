/**
 * Costonomy Jobs colour tokens.
 *
 * The neutral, surface and semantic ramps are **identical** to
 * `costonomy-mobile-app/constants/colors.ts` on purpose — the two apps should
 * read as one product family, and a designer moving between them should never
 * have to ask which grey is "the" grey.
 *
 * What is new here is `accent` (teal) and the domain status ramps below it.
 * Costonomy's ops app is a single-colour product: orange means "interactive."
 * Jobs is not — it renders a *pipeline*, and a pipeline needs colour to carry
 * meaning (where a candidate is) as well as affordance (what you can tap). If
 * both jobs did the work, every screen would be an undifferentiated wall of
 * orange. So the split is:
 *
 *   primary (orange)  → brand, and the one primary action on a screen
 *   accent  (teal)    → progress, pipeline, secondary actions, selection
 *   semantic          → success / warning / danger / info, unchanged
 *
 * Teal specifically: it is complementary to #FF6000 (so the two never muddy
 * each other), and it is far enough from the existing `info` blue and `chart6`
 * cyan that a badge can't be mistaken for either.
 */

// ─── Brand ───────────────────────────────────────────────────────────────────

const BRAND = {
  /** Costonomy orange. Identical to the ops app. Primary CTAs, brand marks. */
  primary: '#FF6000',
  primaryDark: '#CC4D00',
  primaryLight: '#FFF7ED',
  /** For a tinted border/outline on a primary-tinted surface. */
  primaryMuted: '#FFD5B8',

  /** Jobs accent. Progress, pipeline, secondary actions, selected states. */
  accent: '#0D9488',
  accentDark: '#0F766E',
  accentLight: '#F0FDFA',
  accentMuted: '#99F6E4',
} as const;

// ─── Semantic ────────────────────────────────────────────────────────────────

const SEMANTIC = {
  success: '#16A34A',
  successLight: '#F0FDF4',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  info: '#2563EB',
  infoLight: '#EFF6FF',
} as const;

// ─── Neutrals & surfaces ─────────────────────────────────────────────────────

const NEUTRAL = {
  white: '#FFFFFF',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  /** A surface that needs to sit *back* from `surface` — e.g. a kanban column. */
  surfaceSunken: '#F3F4F6',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  /** Scrim behind modals and bottom sheets. */
  overlay: 'rgba(17, 24, 39, 0.45)',
} as const;

// ─── Charts (admin dashboards, funnel views) ─────────────────────────────────

const CHART = {
  chart1: '#FF6000',
  chart2: '#0D9488',
  chart3: '#2563EB',
  chart4: '#D97706',
  chart5: '#7C3AED',
  chart6: '#0891B2',
  chart7: '#DC2626',
  chart8: '#16A34A',
} as const;

export const Colors = {
  ...BRAND,
  ...SEMANTIC,
  ...NEUTRAL,
  ...CHART,
} as const;

// ─── Domain status ramps ─────────────────────────────────────────────────────

/**
 * A status token is always a `{ fg, bg }` pair: `fg` for the label and icon,
 * `bg` for the badge fill. Both are chosen so `fg` on `bg` clears WCAG AA at
 * badge text size (11–13px semibold).
 *
 * **Colour is never the only signal.** Every badge that uses these also renders
 * a label and an icon — required for accessibility, and doubly so here because
 * the same badge has to survive a Hindi label of a very different length.
 */
export interface StatusToken {
  fg: string;
  bg: string;
}

const NEUTRAL_STATUS: StatusToken = { fg: '#64748B', bg: '#F1F5F9' };
const MUTED_STATUS: StatusToken = { fg: NEUTRAL.textTertiary, bg: NEUTRAL.borderLight };

/**
 * `application.status` — the spine of the product (see 03-state-machines §2).
 *
 * The ramp reads as a journey rather than a rainbow: cool and quiet while the
 * employer hasn't acted (slate → blue), warming through the advancing middle
 * (teal → violet → indigo), hitting brand orange at the offer — the moment the
 * product exists for — and resolving to green at JOINED.
 *
 * Terminal states break the ramp deliberately: REJECTED is red, but WITHDRAWN
 * is grey, not red. A candidate withdrawing is not a failure and must not be
 * coloured like one.
 */
export const ApplicationStatusColors = {
  APPLIED: NEUTRAL_STATUS,
  VIEWED: { fg: '#2563EB', bg: '#EFF6FF' },
  SHORTLISTED: { fg: BRAND.accent, bg: BRAND.accentLight },
  INTERVIEW: { fg: '#7C3AED', bg: '#F5F3FF' },
  SELECTED: { fg: '#4F46E5', bg: '#EEF2FF' },
  OFFERED: { fg: BRAND.primary, bg: BRAND.primaryLight },
  OFFER_ACCEPTED: { fg: '#059669', bg: '#ECFDF5' },
  JOINED: { fg: SEMANTIC.success, bg: SEMANTIC.successLight },
  REJECTED: { fg: SEMANTIC.danger, bg: SEMANTIC.dangerLight },
  WITHDRAWN: MUTED_STATUS,
} as const satisfies Record<string, StatusToken>;

/** `interview.status` — 03-state-machines §3. */
export const InterviewStatusColors = {
  /** Amber because it is *waiting on the employee* — an action, not a state. */
  PROPOSED: { fg: SEMANTIC.warning, bg: SEMANTIC.warningLight },
  CONFIRMED: { fg: BRAND.accent, bg: BRAND.accentLight },
  RESCHEDULED: { fg: SEMANTIC.warning, bg: SEMANTIC.warningLight },
  CANCELLED: MUTED_STATUS,
  COMPLETED: { fg: SEMANTIC.success, bg: SEMANTIC.successLight },
  NO_SHOW: { fg: SEMANTIC.danger, bg: SEMANTIC.dangerLight },
} as const satisfies Record<string, StatusToken>;

/** `offer.status` — 03-state-machines §4. */
export const OfferStatusColors = {
  DRAFT: MUTED_STATUS,
  SENT: { fg: BRAND.primary, bg: BRAND.primaryLight },
  ACCEPTED: { fg: SEMANTIC.success, bg: SEMANTIC.successLight },
  DECLINED: { fg: SEMANTIC.danger, bg: SEMANTIC.dangerLight },
  EXPIRED: MUTED_STATUS,
  CANCELLED: MUTED_STATUS,
} as const satisfies Record<string, StatusToken>;

/** `job.status` — 02-domain-model §5. */
export const JobStatusColors = {
  DRAFT: MUTED_STATUS,
  OPEN: { fg: SEMANTIC.success, bg: SEMANTIC.successLight },
  PAUSED: { fg: SEMANTIC.warning, bg: SEMANTIC.warningLight },
  FILLED: { fg: SEMANTIC.info, bg: SEMANTIC.infoLight },
  CLOSED: MUTED_STATUS,
  EXPIRED: MUTED_STATUS,
} as const satisfies Record<string, StatusToken>;

/**
 * `event_checkin.verification_status` — 06-location-checkin §8.
 *
 * These colours are for the **restaurant and admin** surfaces only. The
 * employee never sees a check-in rendered in amber or red: per PRD §9.9 and
 * 05-mobile-screens, a GPS quirk must not produce penalised-feeling UX for the
 * candidate, who sees a plain "Checked in" confirmation regardless.
 */
export const CheckInStatusColors = {
  WITHIN_RANGE: { fg: SEMANTIC.success, bg: SEMANTIC.successLight },
  OUT_OF_RANGE: { fg: SEMANTIC.warning, bg: SEMANTIC.warningLight },
  LOW_ACCURACY: { fg: SEMANTIC.warning, bg: SEMANTIC.warningLight },
  MOCK_LOCATION_SUSPECTED: { fg: SEMANTIC.danger, bg: SEMANTIC.dangerLight },
  OUTSIDE_WINDOW: NEUTRAL_STATUS,
  MANUAL_OVERRIDE: { fg: SEMANTIC.info, bg: SEMANTIC.infoLight },
} as const satisfies Record<string, StatusToken>;

export type ApplicationStatus = keyof typeof ApplicationStatusColors;
export type InterviewStatus = keyof typeof InterviewStatusColors;
export type OfferStatus = keyof typeof OfferStatusColors;
export type JobStatus = keyof typeof JobStatusColors;
export type CheckInStatus = keyof typeof CheckInStatusColors;
