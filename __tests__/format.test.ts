import { setLocale } from '@/lib/locale';
import { experience, formatMobile, monthYear, parseServerDate, rupees, rupeesShort, salaryRange } from '@/lib/format';

describe('money', () => {
  it('groups rupees the Indian way — lakhs, not millions', () => {
    expect(rupees(18000)).toBe('₹18,000');
    expect(rupees(125000)).toBe('₹1,25,000');
    expect(rupees(12345678)).toBe('₹1,23,45,678');
    expect(rupees(950)).toBe('₹950');
    expect(rupees(null)).toBe('');
  });

  it('shortens for chips', () => {
    expect(rupeesShort(18000)).toBe('₹18k');
    expect(rupeesShort(18500)).toBe('₹18.5k');
    expect(rupeesShort(150000)).toBe('₹1.5L');
  });

  it('writes a salary range once, with the period', () => {
    expect(salaryRange(18000, 24000)).toBe('₹18,000 – 24,000/month');
  });
});

describe('dates', () => {
  it('reads server date-times as UTC, since the API sends them without an offset', () => {
    const parsed = parseServerDate('2026-09-11T07:30:00');
    expect(parsed?.toISOString()).toBe('2026-09-11T07:30:00.000Z');
  });

  it('reads a plain date as that calendar day wherever the phone is', () => {
    const d = parseServerDate('2026-10-07')!;
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 7]);
  });

  it('shows month and year from a date string without timezone drift', () => {
    setLocale('en');
    expect(monthYear('2024-03-01')).toMatch(/Mar/);
    expect(monthYear('2024-03-01')).toMatch(/2024/);
    expect(monthYear(null)).toBe('');
  });
});

describe('experience and phone', () => {
  beforeEach(() => setLocale('en'));

  it('says fresher for zero, months under a year, and half-years after', () => {
    expect(experience(0)).toBe('Fresher');
    expect(experience(6)).toBe('6 mo');
    expect(experience(12)).toMatch(/1 yr/);
    expect(experience(18)).toMatch(/1\.5/);
  });

  it('formats an Indian mobile for reading', () => {
    expect(formatMobile('+919876543210')).toBe('+91 98765 43210');
    expect(formatMobile('del-12')).toBe('del-12');
  });
});
