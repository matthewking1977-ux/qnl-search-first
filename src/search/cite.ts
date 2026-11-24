// Citations, export formats and the "what can I do with this item" action for
// catalogue records. Server-side only (results page, record page, export files).
import type { Lang, LibraryRecord } from './types';
import { bestHolding, formatGroup, formatLabel, isQnlLocation, languageLabel } from './catalogue';
import { itemHref } from './links';

export type CiteStyle = 'apa' | 'mla' | 'chicago' | 'harvard';
export const CITE_STYLES: { key: CiteStyle; name: string }[] = [
  { key: 'apa', name: 'APA 7' },
  { key: 'mla', name: 'MLA 9' },
  { key: 'chicago', name: 'Chicago (author-date)' },
  { key: 'harvard', name: 'Harvard' },
];

const ND: Record<Lang, string> = { en: 'n.d.', ar: 'د.ت.' };
const AND: Record<Lang, string> = { en: 'and', ar: 'و' };

function parts(r: LibraryRecord, lang: Lang) {
  const c = r.catalogue!;
  const names = c.authors.filter((a) => !a.role || a.role === 'editor').map((a) => a[lang]);
  const authors = names.length ? names : c.authors.map((a) => a[lang]);
  const year = r.year ?? c.publication?.year;
  // Non-book formats get a bracketed description, e.g. [Digital film].
  const kind = ['BOOK', 'E-BOOK', 'PERIODICAL', 'E-JOURNAL'].includes(c.format) ? '' : formatLabel(c.format, lang);
  return {
    authors,
    year: year ? String(year) : ND[lang],
    title: r.title[lang],
    edition: c.edition?.[lang],
    kind,
    publisher: c.publication?.publisher?.[lang],
    place: c.publication?.place?.[lang],
    editor: c.authors.some((a) => a.role === 'editor'),
  };
}

const list = (xs: string[], lang: Lang) =>
  xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(lang === 'ar' ? '، ' : ', ')} ${lang === 'ar' ? AND.ar : '&'} ${xs[xs.length - 1]}`;
const end = (s: string) => (/[.?!]$/.test(s) ? s : s + '.');

/** A citation with *italic* markers (render with citationHtml, copy with citationText). */
export function citation(r: LibraryRecord, style: CiteStyle, lang: Lang): string {
  const p = parts(r, lang);
  const ed = p.editor ? (lang === 'ar' ? ' (محرر)' : ' (Ed.)') : '';
  const who = list(p.authors, lang) + ed;
  const title = `*${p.title}*`;
  const edition = p.edition ? ` (${p.edition})` : '';
  const kind = p.kind ? ` [${p.kind}]` : '';
  const pub = [p.place, p.publisher].filter(Boolean).join(': ');
  switch (style) {
    case 'apa':
      return `${end(who)} (${p.year}). ${title}${edition}${kind}.${p.publisher ? ` ${end(p.publisher)}` : ''}`;
    case 'mla':
      return `${end(who)} ${title}. ${[p.kind, p.edition, p.publisher, p.year].filter(Boolean).join(lang === 'ar' ? '، ' : ', ')}.`;
    case 'chicago':
      return `${end(who)} ${p.year}. ${title}${kind}.${pub ? ` ${end(pub)}` : ''}`;
    case 'harvard':
      return `${who} (${p.year}) ${title}${kind}.${p.edition ? ` ${end(p.edition)}` : ''}${pub ? ` ${end(pub)}` : ''}`;
  }
}
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const citationHtml = (s: string) => esc(s).replace(/\*(.+?)\*/g, '<i>$1</i>');
export const citationText = (s: string) => s.replace(/\*(.+?)\*/g, '$1');

// ── Export files
const RIS_TYPE: Record<string, string> = {
  BOOK: 'BOOK', 'E-BOOK': 'EBOOK', THESIS: 'THES', PERIODICAL: 'JFULL', 'E-JOURNAL': 'JFULL',
  'DIGITAL FILMS': 'VIDEO', 'VIDEO FILES': 'VIDEO', DVDROM: 'VIDEO', 'BLUE RAY': 'VIDEO',
  'AUDIO FILE': 'SOUND', 'MUSIC RECORD': 'SOUND', 'NOTATED MUSIC': 'MUSIC',
  'PRINT MAP': 'MAP', 'MS MAP': 'MAP', MANUSCRIPT: 'MANSCPT', '2-D GRAPHIC': 'ART', 'DIGITAL IMAGE': 'ART', DATABASE: 'DBASE',
};
const SAMPLE_NOTE: Record<Lang, string> = {
  en: 'Sample record created for the Qatar National Library concept; it does not describe a real item.',
  ar: 'سجل نموذجي أُعدّ لتصوّر مكتبة قطر الوطنية، ولا يصف مادة حقيقية.',
};

export function toRIS(r: LibraryRecord, lang: Lang, site: URL | undefined): string {
  const c = r.catalogue!;
  const p = parts(r, lang);
  const L: string[] = [`TY  - ${RIS_TYPE[c.format] ?? 'GEN'}`, `TI  - ${p.title}`];
  c.authors.forEach((a) => L.push(`${a.role === 'editor' ? 'A2' : 'AU'}  - ${a[lang]}`));
  if (p.year !== ND[lang]) L.push(`PY  - ${p.year}`);
  if (p.publisher) L.push(`PB  - ${p.publisher}`);
  if (p.place) L.push(`CY  - ${p.place}`);
  if (p.edition) L.push(`ET  - ${p.edition}`);
  if (c.isbn) L.push(`SN  - ${c.isbn}`);
  L.push(`LA  - ${languageLabel(c.language, 'en')}`);
  c.subjects.forEach((s) => L.push(`KW  - ${s[lang]}`));
  const best = bestHolding(c);
  if (best.callNo) L.push(`CN  - ${best.callNo}`);
  if (site) L.push(`UR  - ${new URL(itemHref(lang, r), site).href}`);
  L.push(`N1  - ${SAMPLE_NOTE[lang]}`, 'ER  - ', '');
  return L.join('\r\n');
}

const bib = (s: string) => s.replace(/([&%$#_])/g, '\\$1').replace(/[{}]/g, '');
export function toBibTeX(r: LibraryRecord, lang: Lang, site: URL | undefined): string {
  const c = r.catalogue!;
  const p = parts(r, lang);
  const type = ['BOOK', 'E-BOOK'].includes(c.format) ? 'book' : c.format === 'THESIS' ? 'phdthesis' : 'misc';
  const f: [string, string | undefined][] = [
    ['title', p.title],
    [c.authors.some((a) => a.role === 'editor') ? 'editor' : 'author', c.authors.map((a) => a[lang]).join(' and ')],
    ['year', p.year !== ND[lang] ? p.year : undefined],
    ['publisher', p.publisher],
    ['address', p.place],
    ['edition', p.edition],
    ['isbn', c.isbn],
    ['howpublished', type === 'misc' ? formatLabel(c.format, 'en') : undefined],
    ['language', languageLabel(c.language, 'en')],
    ['url', site ? new URL(itemHref(lang, r), site).href : undefined],
    ['note', SAMPLE_NOTE[lang]],
  ];
  const body = f.filter(([, v]) => v).map(([k, v]) => `  ${k} = {${bib(v!)}}`).join(',\n');
  return `@${type}{qnl-${r.id},\n${body}\n}\n`;
}

// ── Main action: what the visitor can do next with this item
export type ActionKind = 'online' | 'hold' | 'use' | 'partner';
export function primaryAction(r: LibraryRecord): { kind: ActionKind; labelKey: string; anchor: string } {
  const c = r.catalogue!;
  const best = bestHolding(c);
  if (best.status === 'online') {
    const g = formatGroup(c.format);
    return { kind: 'online', labelKey: g === 'film' ? 'act.watchOnline' : g === 'audio' ? 'act.listenOnline' : g === 'images' ? 'act.viewOnline' : 'act.readOnline', anchor: 'access' };
  }
  const qnlLendable = c.holdings.some((h) => isQnlLocation(h.location) && ['available', 'on-loan', 'on-order'].includes(h.status));
  if (qnlLendable) return { kind: 'hold', labelKey: 'act.placeHold', anchor: 'hold' };
  if (c.holdings.some((h) => !isQnlLocation(h.location) && h.status === 'available')) return { kind: 'partner', labelKey: 'act.requestPartner', anchor: 'hold' };
  return { kind: 'use', labelKey: 'act.findIt', anchor: 'holdings' };
}
