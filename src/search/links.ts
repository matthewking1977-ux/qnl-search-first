import type { Lang, LibraryRecord } from './types';

export const itemHref = (lang: Lang, r: Pick<LibraryRecord, 'id'>) => `${lang === 'ar' ? '/ar' : ''}/item/${r.id}`;
export const searchHref = (lang: Lang, q: string, group?: string) => {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (group && group !== 'all') p.set('type', group);
  const qs = p.toString();
  return `${lang === 'ar' ? '/ar' : ''}/search${qs ? `?${qs}` : ''}`;
};
export const catalogueHref = (q: string) => `https://www.qnl.qa/en/search?keys=${encodeURIComponent(q)}`; // placeholder target for the Discovery System
