// Text normalisation shared by indexing, querying and highlighting.
// Arabic: unify alef forms, taa marbuta/haa, alef maqsura/yaa; strip harakat
// and tatweel; light prefix stemming (ال، وال، بال، كال، فال، لل).
// Latin: lowercase, strip accents. Digits: Arabic-Indic → Western.

const HARAKAT = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;
const ARABIC_INDIC = /[٠-٩]/g;
const EXT_ARABIC_INDIC = /[۰-۹]/g;

export function normaliseArabic(s: string): string {
  return s
    .replace(HARAKAT, '')
    .replace(TATWEEL, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
}

export function normalise(s: string): string {
  return normaliseArabic(
    s
      .replace(ARABIC_INDIC, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(EXT_ARABIC_INDIC, (d) => String(d.charCodeAt(0) - 0x06f0))
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '') // Latin combining accents (Arabic marks handled above)
      .toLowerCase()
      .replace(/[’'`]/g, ''),
  );
}

const ARABIC_RE = /[؀-ۿ]/;
export const isArabic = (s: string) => ARABIC_RE.test(s);

// Longest first. Only strip when a meaningful stem (≥3 letters) remains.
const AR_PREFIXES = ['وبال', 'وال', 'بال', 'كال', 'فال', 'لل', 'ال'];
const AR_SUFFIXES = ['ات', 'ون', 'ين', 'ها', 'هم'];

export function stemArabic(t: string): string {
  let w = t;
  for (const p of AR_PREFIXES) {
    if (w.startsWith(p) && w.length - p.length >= 3) { w = w.slice(p.length); break; }
  }
  for (const s of AR_SUFFIXES) {
    if (w.endsWith(s) && w.length - s.length >= 3) { w = w.slice(0, -s.length); break; }
  }
  return w;
}

// Very light English stemming: plural and common verb endings, so
// "databases"→"database", "renewing"→"renew", "events"→"event".
export function stemLatin(t: string): string {
  if (t.length <= 3) return t;
  if (t.endsWith('ies') && t.length > 4) return t.slice(0, -3) + 'y';
  if (t.endsWith('ing') && t.length > 5) return t.slice(0, -3);
  if (t.endsWith('es') && /(s|x|z|ch|sh)es$/.test(t)) return t.slice(0, -2);
  if (t.endsWith('s') && !t.endsWith('ss') && !t.endsWith('us')) return t.slice(0, -1);
  return t;
}

const STOP = new Set([
  'a', 'an', 'the', 'of', 'and', 'or', 'for', 'in', 'on', 'to', 'at', 'by', 'with', 'my', 'your', 'how', 'do', 'does',
  'i', 'is', 'are', 'can', 'what', 'where', 'when', 'which', 'me', 'it', 'this', 'that', 'sample',
  // Arabic (normalised forms)
  'في', 'من', 'الي', 'علي', 'عن', 'ما', 'هل', 'كيف', 'او', 'و', 'مع', 'هذا', 'هذه', 'نموذج', 'ان', 'لا',
]);

export const TOKEN_SPLIT = /[^\p{L}\p{N}]+/u;

export function tokenize(s: string): string[] {
  return s.split(TOKEN_SPLIT).filter(Boolean);
}

/** Index/query term processor: normalise → drop stop words → stem. */
export function processTerm(term: string): string | null {
  const n = normalise(term);
  if (!n || STOP.has(n)) return null;
  return isArabic(n) ? stemArabic(n) : stemLatin(n);
}

export function processText(s: string): string[] {
  return tokenize(s).map(processTerm).filter((x): x is string => !!x);
}
