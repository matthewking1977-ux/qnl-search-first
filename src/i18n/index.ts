import en from './en.json';
import ar from './ar.json';

export type Lang = 'en' | 'ar';
export type Key = keyof typeof en;

const dict = { en, ar } as const;

/**
 * Locale settings. One switch for numerals:
 *  - 'latn' → Western digits (0–9) in both languages (brief default)
 *  - 'arab' → Arabic-Indic digits (٠–٩) in AR only
 * Calendar is Gregorian in both; AR uses Arabic month names.
 */
export const LOCALE_SETTINGS = {
  numerals: 'latn' as 'latn' | 'arab',
  calendar: 'gregory' as const,
};

export function t(lang: Lang, key: Key): string {
  return (dict[lang] as Record<string, string>)[key] ?? (dict.en as Record<string, string>)[key] ?? key;
}

export function dir(lang: Lang): 'ltr' | 'rtl' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

export function intlLocale(lang: Lang): string {
  if (lang === 'en') return 'en-GB-u-ca-gregory-nu-latn';
  return `ar-QA-u-ca-${LOCALE_SETTINGS.calendar}-nu-${LOCALE_SETTINGS.numerals}`;
}

export function formatDate(lang: Lang, d: Date, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Intl.DateTimeFormat(intlLocale(lang), opts).format(d);
}

export function formatNumber(lang: Lang, n: number) {
  return new Intl.NumberFormat(intlLocale(lang)).format(n);
}

/** Path for the same page in the other language. */
export function altPath(lang: Lang, path: string): string {
  const clean = path.replace(/^\/ar(?=\/|$)/, '') || '/';
  return lang === 'en' ? (clean === '/' ? '/ar/' : `/ar${clean}`) : clean;
}

export function localPath(lang: Lang, path: string): string {
  return lang === 'ar' ? `/ar${path === '/' ? '/' : path}` : path;
}
