// Labels and derived values for catalogue records. Server-side and in the lazy
// search-data chunk only: never import this into an island's first-load code.
import ref from '../content/catalogue.json';
import type { Bi, CatalogueInfo, Holding, HoldingStatus, Lang, LibraryRecord } from './types';

type Labelled = { en: string; ar: string };
const R = ref as unknown as {
  formatGroups: Record<string, Labelled & { order: number }>;
  formats: Record<string, Labelled & { group: string; words: string }>;
  locations: Record<string, Labelled & { qnl: boolean; online?: boolean }>;
  collections: Record<string, Labelled>;
  languages: Record<string, Labelled>;
  status: Record<HoldingStatus, Labelled>;
  places: Record<string, Labelled & { variants: string[] }>;
};
export const catalogueRef = R;

const ROLES: Record<string, Labelled> = {
  editor: { en: 'editor', ar: 'تحرير' },
  compiler: { en: 'compiler', ar: 'جمع' },
  director: { en: 'director', ar: 'إخراج' },
  photographer: { en: 'photographer', ar: 'تصوير' },
  illustrator: { en: 'illustrator', ar: 'رسوم' },
  arranger: { en: 'arranger', ar: 'توزيع' },
};

export const formatLabel = (code: string, lang: Lang) => R.formats[code]?.[lang] ?? code;
export const formatGroup = (code: string) => R.formats[code]?.group ?? 'books';
export const formatGroupLabel = (g: string, lang: Lang) => R.formatGroups[g]?.[lang] ?? g;
export const locationLabel = (k: string, lang: Lang) => R.locations[k]?.[lang] ?? k;
export const isQnlLocation = (k: string) => !!R.locations[k]?.qnl;
export const collectionLabel = (k: string, lang: Lang) => R.collections[k]?.[lang] ?? k;
export const languageLabel = (code: string, lang: Lang) => R.languages[code]?.[lang] ?? code;
export const statusLabel = (s: HoldingStatus, lang: Lang) => R.status[s]?.[lang] ?? s;
export const placeLabel = (k: string, lang: Lang) => R.places[k]?.[lang] ?? k;

export function authorLine(c: CatalogueInfo, lang: Lang): string {
  const sep = lang === 'ar' ? '؛ ' : '; ';
  return c.authors.map((a) => (a.role && ROLES[a.role] ? `${a[lang]} (${ROLES[a.role][lang]})` : a[lang])).join(sep);
}

export function publicationLine(c: CatalogueInfo, lang: Lang): string {
  const p = c.publication;
  if (!p) return '';
  const where = [p.place?.[lang], p.publisher?.[lang]].filter(Boolean).join(lang === 'ar' ? ': ' : ': ');
  return [where, p.year].filter(Boolean).join(lang === 'ar' ? '، ' : ', ');
}

/** Best "what can I do now" status: online > available at QNL > available at a
 *  partner > library use only > on loan (soonest due) > on order. */
const RANK: Record<HoldingStatus, number> = { online: 0, available: 1, 'library-use': 3, 'on-loan': 4, 'on-order': 5 };
export function bestHolding(c: CatalogueInfo): Holding {
  return [...c.holdings].sort((a, b) => {
    const ra = RANK[a.status] + (a.status === 'available' && !isQnlLocation(a.location) ? 1 : 0);
    const rb = RANK[b.status] + (b.status === 'available' && !isQnlLocation(b.location) ? 1 : 0);
    return ra - rb || (a.due ?? '').localeCompare(b.due ?? '');
  })[0];
}

export const atQnl = (c: CatalogueInfo) => c.holdings.some((h) => isQnlLocation(h.location));
export const availableNow = (c: CatalogueInfo) => c.holdings.some((h) => h.status === 'available' || h.status === 'online');
export const isOnline = (c: CatalogueInfo) => c.holdings.some((h) => h.status === 'online');

/** Text the search index sees for a catalogue record. */
export function catalogueIndexText(r: LibraryRecord) {
  const c = r.catalogue!;
  const both = (b?: Bi) => (b ? `${b.en} ${b.ar}` : '');
  const placeValues = [
    ...(c.places ?? []).flatMap((k) => [R.places[k]?.en, R.places[k]?.ar, ...(R.places[k]?.variants ?? [])]),
    ...(c.placesAsCatalogued ?? []),
  ].filter((x): x is string => !!x);
  return {
    creators: c.authors.map(both).join(' '),
    subjects: c.subjects.map(both).join(' '),
    places_cat: placeValues.join(' '),
    placeValues,
    ids: [c.isbn, c.isbn?.replace(/-/g, ''), ...c.holdings.map((h) => h.callNo)].filter(Boolean).join(' '),
    typewords: `${R.formats[c.format]?.words ?? ''} ${R.formatGroups[formatGroup(c.format)]?.en ?? ''} catalogue فهرس`,
  };
}

/** Display labels attached to records in the lazy data chunk, so islands can
 *  show them without bundling this module. */
export function attachDisplay(r: LibraryRecord) {
  const c = r.catalogue;
  if (!c) return;
  c.display = {
    format: { en: formatLabel(c.format, 'en'), ar: formatLabel(c.format, 'ar') },
    language: { en: languageLabel(c.language, 'en'), ar: languageLabel(c.language, 'ar') },
    group: formatGroup(c.format),
    locations: [...new Set(c.holdings.map((h) => h.location))],
    qnl: atQnl(c),
    avail: availableNow(c),
    online: isOnline(c),
  };
}
