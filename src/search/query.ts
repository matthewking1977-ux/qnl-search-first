// Query syntax for power users. Plain queries pass straight through to the
// ranked keyword search; anything below makes the query "structured".
//
//   "exact phrase"  «عبارة»  “phrase”      phrase (words in this order)
//   AND  OR  NOT   (English, upper case)    أو = OR · بدون = NOT
//   -word                                   NOT word
//   title: author: subject: place: isbn: year:
//   عنوان: مؤلف: موضوع: مكان: ردمك: سنة:
//   year:2015   year:2010-2020   year:>2018   year:<2000
//   978-1-0000-0001-6                       a pasted ISBN is recognised on its own
//
// Precedence: AND binds tighter than OR ("a OR b c" = a, or b and c). NOT
// clauses exclude from the whole result.

export type Field = 'any' | 'title' | 'author' | 'subject' | 'place' | 'isbn' | 'year';
export type Op = 'AND' | 'OR' | 'NOT';
export interface Clause {
  op: Op;
  field: Field;
  text: string;
  phrase: boolean;
  /** year ranges */
  from?: number;
  to?: number;
}
export interface ParsedQuery {
  clauses: Clause[];
  /** true when the query uses any syntax beyond plain words */
  structured: boolean;
}

const FIELD_ALIASES: Record<string, Field> = {
  title: 'title', ti: 'title', 'عنوان': 'title', 'العنوان': 'title',
  author: 'author', au: 'author', by: 'author', 'مؤلف': 'author', 'المؤلف': 'author',
  subject: 'subject', su: 'subject', 'موضوع': 'subject', 'الموضوع': 'subject',
  place: 'place', 'مكان': 'place', 'المكان': 'place',
  isbn: 'isbn', 'ردمك': 'isbn',
  year: 'year', yr: 'year', 'سنة': 'year', 'السنة': 'year',
};
const OPS: Record<string, Op> = { AND: 'AND', OR: 'OR', NOT: 'NOT', 'أو': 'OR', 'او': 'OR', 'بدون': 'NOT', 'و': 'AND' };
const QUOTES: Record<string, string> = { '"': '"', '“': '”', '«': '»', '„': '“' };
const ISBN_RE = /^(?:97[89][-\s]?)?(?:\d[-\s]?){9}[\dXx]$/;

function parseYear(v: string): { from?: number; to?: number } | null {
  const s = v.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).trim();
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d{4})$/))) return { from: +m[1], to: +m[1] };
  if ((m = s.match(/^(\d{4})?\s*(?:-|–|\.\.)\s*(\d{4})?$/)) && (m[1] || m[2])) return { from: m[1] ? +m[1] : undefined, to: m[2] ? +m[2] : undefined };
  if ((m = s.match(/^([<>])(=?)(\d{4})$/))) {
    const y = +m[3], incl = m[2] === '=';
    return m[1] === '>' ? { from: incl ? y : y + 1 } : { to: incl ? y : y - 1 };
  }
  return null;
}

/** Read one value: a quoted phrase, or a run of non-space characters. */
function readValue(q: string, i: number): { text: string; phrase: boolean; end: number } {
  const close = QUOTES[q[i]];
  if (close) {
    const j = q.indexOf(close, i + 1);
    const end = j < 0 ? q.length : j + 1;
    return { text: q.slice(i + 1, j < 0 ? q.length : j).trim(), phrase: true, end };
  }
  let j = i;
  while (j < q.length && !/\s/.test(q[j])) j++;
  return { text: q.slice(i, j), phrase: false, end: j };
}

export function parseQuery(input: string): ParsedQuery {
  // Invisible direction marks (used to keep numbers in order in Arabic text) are ignored.
  const q = input.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '').trim();
  const clauses: Clause[] = [];
  let pending: Op = 'AND';
  let structured = false;
  let i = 0;
  while (i < q.length) {
    if (/\s/.test(q[i])) { i++; continue; }
    // field:value
    const fm = q.slice(i).match(/^([\p{L}]+):(?=\S)/u);
    if (fm && FIELD_ALIASES[fm[1].toLowerCase()]) {
      const field = FIELD_ALIASES[fm[1].toLowerCase()];
      const v = readValue(q, i + fm[0].length);
      i = v.end;
      if (!v.text) continue;
      const c: Clause = { op: pending, field, text: v.text, phrase: v.phrase };
      if (field === 'year') {
        const y = parseYear(v.text);
        if (!y) { c.field = 'any'; } else Object.assign(c, y);
      }
      clauses.push(c); structured = true; pending = 'AND';
      continue;
    }
    // quoted phrase
    if (QUOTES[q[i]]) {
      const v = readValue(q, i);
      i = v.end;
      if (v.text) { clauses.push({ op: pending, field: 'any', text: v.text, phrase: true }); structured = true; }
      pending = 'AND';
      continue;
    }
    const v = readValue(q, i);
    i = v.end;
    const word = v.text;
    if (OPS[word] && (word === word.toUpperCase() || /[؀-ۿ]/.test(word))) {
      // Arabic "و" on its own is just "and" (the default); others change the next clause.
      if (OPS[word] !== 'AND') { pending = OPS[word]; structured = true; }
      continue;
    }
    if (word.length > 1 && word[0] === '-' && /[\p{L}"“«]/u.test(word[1])) {
      const inner = QUOTES[word[1]] ? readValue(q, i - word.length + 1) : { text: word.slice(1), phrase: false, end: i };
      i = Math.max(i, inner.end);
      if (inner.text) { clauses.push({ op: 'NOT', field: 'any', text: inner.text, phrase: inner.phrase }); structured = true; }
      continue;
    }
    // A pasted ISBN (with or without hyphens) is an ISBN search.
    if (ISBN_RE.test(word) && word.replace(/\D/g, '').length >= 10) {
      clauses.push({ op: pending, field: 'isbn', text: word, phrase: false }); structured = true; pending = 'AND';
      continue;
    }
    // Plain word: merge consecutive plain AND words into one clause so ranking stays natural.
    const last = clauses[clauses.length - 1];
    if (last && last.field === 'any' && !last.phrase && pending === 'AND' && last.op !== 'NOT') last.text += ' ' + word;
    else clauses.push({ op: pending, field: 'any', text: word, phrase: false });
    pending = 'AND';
  }
  return { clauses, structured };
}

const quote = (s: string) => (/[\s:]/.test(s) || !s ? `"${s}"` : s);
/** Back to a query string (used to remove one clause from the results page). */
export function serializeQuery(clauses: Clause[]): string {
  return clauses
    .map((c, i) => {
      const op = c.op === 'NOT' ? 'NOT ' : c.op === 'OR' && i > 0 ? 'OR ' : '';
      const val = c.field === 'year' && (c.from || c.to)
        ? (c.from && c.to && c.from === c.to ? String(c.from) : `${c.from ?? ''}-${c.to ?? ''}`)
        : c.phrase ? `"${c.text}"` : c.field === 'any' ? c.text : quote(c.text);
      return `${op}${c.field === 'any' ? '' : c.field + ':'}${val}`;
    })
    .join(' ')
    .trim();
}
