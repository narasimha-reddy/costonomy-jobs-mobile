import { translate } from '@/lib/i18n';
import { getLocale } from '@/lib/locale';

/**
 * Money, experience and dates, the way an Indian user reads them.
 */

// ── Money ────────────────────────────────────────────────────────────────────

/**
 * Indian digit grouping — ₹1,20,000, not ₹120,000. Done by hand because Hermes'
 * Intl support for `en-IN` grouping has varied between React Native versions,
 * and a salary rendered with the wrong commas looks like the wrong number.
 */
export function rupees(amount: number | null | undefined): string {
  if (amount == null) return '';
  const digits = Math.round(amount).toString();
  if (digits.length <= 3) return `₹${digits}`;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `₹${rest},${last3}`;
}

/** "₹18k" — for chips and dense rows. */
export function rupeesShort(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  return `₹${amount}`;
}

export function salaryRange(min: number | null, max: number | null, period: string = 'MONTHLY'): string {
  const suffix = translate(period === 'DAILY' ? 'format.perDay' : period === 'HOURLY' ? 'format.perHour' : 'format.perMonth');
  if (min != null && max != null && min !== max) return `${rupees(min)} – ${rupees(max).slice(1)}${suffix}`;
  const one = max ?? min;
  return one != null ? `${rupees(one)}${suffix}` : '';
}

// ── Experience ───────────────────────────────────────────────────────────────

export function experience(months: number | null | undefined): string {
  if (!months) return translate('format.fresher');
  if (months < 12) return translate('format.months', { n: months });
  const years = months / 12;
  if (years < 1.5 && months % 12 === 0) return translate('format.oneYear');
  const rounded = Math.round(years * 2) / 2;
  return rounded === 1 ? translate('format.oneYear') : translate('format.years', { n: rounded });
}

// ── Dates ────────────────────────────────────────────────────────────────────

/**
 * The API sends `LocalDateTime` with no offset, and it is UTC. Parsing it as-is
 * would read it in the phone's zone — an interview at 3pm IST would show at 9:30am.
 */
export function parseServerDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y!, m! - 1, d!);
  }
  const hasZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

/** The reverse: a UTC `LocalDateTime` string for the API. */
export function toServerDateTime(date: Date): string {
  return date.toISOString().slice(0, 19);
}

/** A calendar day for the API, from the phone's local date. */
export function toServerDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function intlLocale() {
  return getLocale() === 'hi' ? 'hi-IN' : 'en-IN';
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Today", "Tomorrow" or "Tue, 14 Oct". */
export function dayLabel(date: Date): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(date, now)) return translate('time.today');
  if (sameDay(date, tomorrow)) return translate('time.tomorrow');
  return date.toLocaleDateString(intlLocale(), { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Weekday and month for a calendar tile, in the app's language rather than the device's. */
export function dayParts(date: Date): { weekday: string; month: string } {
  return {
    weekday: date.toLocaleDateString(intlLocale(), { weekday: 'short' }),
    month: date.toLocaleDateString(intlLocale(), { month: 'short' }),
  };
}

/** "Mar 2024" from a server date like "2024-03-01" — read as text, so no timezone can shift the month. */
export function monthYear(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  const date = new Date(Number(isoDate.slice(0, 4)), Number(isoDate.slice(5, 7)) - 1, 1);
  return date.toLocaleDateString(intlLocale(), { month: 'short', year: 'numeric' });
}

export function shortDate(date: Date): string {
  return date.toLocaleDateString(intlLocale(), { day: 'numeric', month: 'short', year: 'numeric' });
}

export function timeLabel(date: Date): string {
  return date.toLocaleTimeString(intlLocale(), { hour: 'numeric', minute: '2-digit' });
}

/** "Today, 3:00 PM" */
export function dateTimeLabel(value: string | Date | null | undefined): string {
  const date = value instanceof Date ? value : parseServerDate(value);
  if (!date) return '';
  return `${dayLabel(date)}, ${timeLabel(date)}`;
}

export function relativeTime(value: string | null | undefined): string {
  const date = parseServerDate(value);
  if (!date) return '';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return translate('time.justNow');
  if (minutes < 60) return translate('time.minutesAgo', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate('time.hoursAgo', { n: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return translate('time.yesterday');
  if (days < 7) return translate('time.daysAgo', { n: days });
  return shortDate(date);
}

/** "+91 98765 43210" */
export function formatMobile(e164: string): string {
  const digits = e164.replace(/^\+91/, '');
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : e164;
}

export function greetingKey(): 'feed.greeting.morning' | 'feed.greeting.afternoon' | 'feed.greeting.evening' {
  const h = new Date().getHours();
  return h < 12 ? 'feed.greeting.morning' : h < 17 ? 'feed.greeting.afternoon' : 'feed.greeting.evening';
}
