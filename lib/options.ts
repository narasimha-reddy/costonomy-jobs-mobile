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

/** Minimum-experience choices, in months. */
export const EXPERIENCE_MINIMUMS = [0, 6, 12, 24, 36, 60];

export function restaurantTypeLabel(value: string | null | undefined, t: (k: MessageKey) => string): string | null {
  if (!value) return null;
  const match = RESTAURANT_TYPES.find((r) => r.value === value);
  return match ? t(match.key) : value;
}
