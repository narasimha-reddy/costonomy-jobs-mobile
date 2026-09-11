import type { MessageKey } from '@/lib/i18n';
import type { Availability, JoiningRequirement, Shift } from '@/lib/api';

/**
 * Choice lists shared between screens, so the candidate filtering jobs and the
 * restaurant posting one pick from exactly the same vocabulary.
 */
export const RESTAURANT_TYPES: { key: MessageKey; value: string }[] = [
  { key: 'restaurantType.casualDining', value: 'Casual Dining' },
  { key: 'restaurantType.qsr', value: 'Quick Service' },
  { key: 'restaurantType.fineDining', value: 'Fine Dining' },
  { key: 'restaurantType.cafe', value: 'Cafe' },
  { key: 'restaurantType.cloudKitchen', value: 'Cloud Kitchen' },
  { key: 'restaurantType.bar', value: 'Bar & Pub' },
  { key: 'restaurantType.bakery', value: 'Bakery' },
  { key: 'restaurantType.catering', value: 'Catering' },
];

export const AVAILABILITIES: Availability[] = ['IMMEDIATE', 'WITHIN_15_DAYS', 'WITHIN_30_DAYS', 'NOT_LOOKING'];
export const JOINING: JoiningRequirement[] = ['IMMEDIATE', 'WITHIN_15_DAYS', 'WITHIN_30_DAYS', 'FLEXIBLE'];
export const SHIFTS: Shift[] = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'FLEXIBLE'];

/** "Pays at least" choices for job search, monthly rupees. */
export const MIN_SALARIES = [12000, 15000, 18000, 22000, 26000, 32000];

/** "Expects at most" choices for Find Staff, monthly rupees. */
export const MAX_EXPECTED_SALARIES = [15000, 20000, 25000, 30000, 40000];

/** Availabilities a restaurant can filter on — someone NOT_LOOKING never appears. */
export const LOOKING: Availability[] = ['IMMEDIATE', 'WITHIN_15_DAYS', 'WITHIN_30_DAYS'];

/** Skill categories in the order people look for them. */
export const SKILL_CATEGORY_ORDER = ['Cuisine', 'Technical', 'Language'];

/** Minimum-experience choices, in months. */
export const EXPERIENCE_MINIMUMS = [0, 6, 12, 24, 36, 60];

export function restaurantTypeLabel(value: string | null | undefined, t: (k: MessageKey) => string): string | null {
  if (!value) return null;
  const match = RESTAURANT_TYPES.find((r) => r.value === value);
  return match ? t(match.key) : value;
}
