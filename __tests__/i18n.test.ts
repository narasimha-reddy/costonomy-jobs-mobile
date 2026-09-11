import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import { setLocale } from '@/lib/locale';
import { translate } from '@/lib/i18n';

describe('translations', () => {
  it('has every English key in Hindi, with the same placeholders', () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    for (const [key, value] of Object.entries(en)) {
      const other = (hi as Record<string, string>)[key];
      expect({ key, present: other !== undefined }).toEqual({ key, present: true });
      expect({ key, placeholders: placeholders(other) }).toEqual({ key, placeholders: placeholders(value) });
    }
  });

  it('interpolates and follows the active locale', () => {
    setLocale('en');
    expect(translate('staff.payUpTo', { amount: '₹20k' })).toBe('Up to ₹20k');
    setLocale('hi');
    expect(translate('staff.payUpTo', { amount: '₹20k' })).toBe('₹20k तक');
    setLocale('en');
  });

  it('leaves an unknown placeholder visible rather than printing "undefined"', () => {
    expect(translate('staff.payUpTo')).toBe('Up to {amount}');
  });
});
