// Advanced search form ⇄ query string + filters. Shared by the results page
// (which turns a submitted form into a canonical /search URL) and the advanced
// page script (live count, and pre-filling the form from a search).
import { parseQuery, serializeQuery, type Clause, type Field } from './query';
import type { SearchFilters } from './types';

export const ADV_ROWS = 6;
export const ADV_FIELDS: Field[] = ['any', 'title', 'author', 'subject', 'place', 'isbn'];
/** Multi-value catalogue filters carried in the URL. */
export const LIST_PARAMS = { fmt: 'format', loc: 'location', cl: 'clang', col: 'collection' } as const;
export const FLAG_PARAMS = { avail: 'avail', online: 'online', atqnl: 'atQnl' } as const;

const unquote = (s: string) => s.match(/^["“«](.*)["”»]$/)?.[1];
const year = (v: string | null) => {
  const n = parseInt((v ?? '').replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)), 10);
  return n >= 1000 && n <= 2999 ? n : undefined;
};

/** Rows t1..t6 (text), f1..f6 (field), o2..o6 (AND/OR/NOT) + yf/yt → query string. */
export function rowsToQuery(p: URLSearchParams): string | null {
  const clauses: Clause[] = [];
  for (let i = 1; i <= ADV_ROWS; i++) {
    const text = (p.get(`t${i}`) ?? '').trim();
    if (!text) continue;
    const f = p.get(`f${i}`) as Field;
    const field: Field = ADV_FIELDS.includes(f) ? f : 'any';
    const o = p.get(`o${i}`);
    const op = o === 'OR' || o === 'NOT' ? o : 'AND';
    const inner = unquote(text);
    // An "any field" row may itself contain search syntax: keep it as typed.
    if (field === 'any' && !inner && op === 'AND') clauses.push(...parseQuery(text).clauses);
    else clauses.push({ op: clauses.length || op === 'NOT' ? op : 'AND', field, text: inner ?? text, phrase: !!inner });
  }
  let yf = year(p.get('yf')), yt = year(p.get('yt'));
  if (yf && yt && yf > yt) [yf, yt] = [yt, yf];
  if (yf || yt) clauses.push({ op: 'AND', field: 'year', text: '', phrase: false, from: yf, to: yt });
  if (!clauses.length) return null;
  if (clauses[0].op === 'OR') clauses[0] = { ...clauses[0], op: 'AND' };
  return serializeQuery(clauses);
}

export const isAdvancedSubmit = (p: URLSearchParams) =>
  [...Array(ADV_ROWS)].some((_, i) => p.has(`t${i + 1}`)) || p.has('yf') || p.has('yt');

/** Catalogue filters from the URL. */
export function readCatalogueFilters(p: URLSearchParams): Pick<SearchFilters, 'format' | 'location' | 'clang' | 'collection' | 'avail' | 'online' | 'atQnl'> {
  const out: any = {};
  for (const [param, key] of Object.entries(LIST_PARAMS)) {
    const v = p.getAll(param).filter((x) => /^[a-z0-9-]{2,24}$/.test(x));
    if (v.length) out[key] = v;
  }
  for (const [param, key] of Object.entries(FLAG_PARAMS)) if (p.get(param) === '1') out[key] = true;
  return out;
}

/** Canonical results URL for a submitted advanced form (rows → q; filters kept). */
export function canonicalFromAdvanced(base: string, p: URLSearchParams): string {
  const u = new URLSearchParams();
  const q = rowsToQuery(p) ?? (p.get('q') ?? '');
  if (q) u.set('q', q);
  const type = p.get('type');
  if (type) u.set('type', type);
  for (const param of Object.keys(LIST_PARAMS)) p.getAll(param).forEach((v) => u.append(param, v));
  for (const param of Object.keys(FLAG_PARAMS)) if (p.get(param) === '1') u.set(param, '1');
  return `${base}?${u}`;
}

/** Clauses → advanced rows, to pre-fill the form from an existing search. */
export function queryToRows(q: string) {
  const { clauses } = parseQuery(q);
  const rows: { op: string; field: Field; text: string }[] = [];
  let yf: number | undefined, yt: number | undefined;
  for (const c of clauses) {
    if (c.field === 'year') { yf = c.from; yt = c.to; continue; }
    rows.push({ op: c.op, field: c.field, text: c.phrase ? `"${c.text}"` : c.text });
  }
  return { rows: rows.slice(0, ADV_ROWS), yf, yt };
}
