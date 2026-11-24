import MiniSearch, { type SearchResult } from 'minisearch';
import { normalise, processTerm, processText, tokenize } from './normalise';
import {
  GROUP_ORDER,
  TYPE_TO_GROUP,
  type Group,
  type Hit,
  type LibraryRecord,
  type SearchRequest,
  type SearchResponse,
  type TaskAnswer,
} from './types';

export interface TagDef { en: string; ar: string; syn?: string[] }
export interface EngineData {
  records: LibraryRecord[];
  tags: Record<string, TagDef>;
  synonyms: string[][];
  /** index text for catalogue records (authors, subjects, places, ids, format words) */
  catalogueText?: (r: LibraryRecord) => { creators: string; subjects: string; places_cat: string; ids: string; typewords: string };
}

const TYPE_WORDS: Record<string, string> = {
  book: 'book books كتاب كتب',
  database: 'database databases research journals قاعدة بيانات قواعد بحث دوريات',
  event: 'event events whats on فعالية فعاليات',
  service: 'service services help خدمة خدمات',
  heritage: 'heritage rare special collections التراث نادر',
  page: 'page',
};

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export function createEngine(data: EngineData) {
  const { records, tags } = data;
  const byId = new Map(records.map((r) => [r.id, r]));

  // ── Synonym index: processed phrase → set of processed expansion terms
  const synPhrases: { tokens: string[]; group: number }[] = [];
  const groupTerms: string[][] = data.synonyms.map((g, gi) => {
    const terms = new Set<string>();
    for (const phrase of g) {
      const toks = processText(phrase);
      if (!toks.length) continue;
      synPhrases.push({ tokens: toks, group: gi });
      // Only single-word entries become expansion terms: multi-word phrases
      // ("public transport", "book a room") trigger the group but are never
      // split into loose words that would match unrelated records.
      if (toks.length === 1) terms.add(toks[0]);
    }
    return [...terms];
  });

  // ── Task triggers, processed
  const taskTriggers = records
    .filter((r) => r.task)
    .map((r) => ({ record: r, triggers: r.task!.triggers.map((t) => ({ raw: t, toks: processText(t) })).filter((t) => t.toks.length) }));

  const tagText = (keys: string[]) =>
    keys
      .map((k) => tags[k])
      .filter(Boolean)
      .map((t) => [t.en, t.ar, ...(t.syn ?? [])].join(' '))
      .join(' ');

  const ms = new MiniSearch<any>({
    idField: 'id',
    fields: ['title_en', 'title_ar', 'summary_en', 'summary_ar', 'tags', 'triggers', 'typewords', 'place', 'creators', 'subjects', 'places_cat', 'ids'],
    storeFields: [],
    tokenize: (s) => tokenize(s),
    processTerm: (t) => processTerm(t) ?? null,
    searchOptions: {
      boost: { title_en: 3, title_ar: 3, triggers: 2.5, tags: 1.4, summary_en: 1, summary_ar: 1, typewords: 0.6, place: 0.8, creators: 2, subjects: 1.2, places_cat: 0.8, ids: 1.5 },
      // Numbers (ISBNs, years, call numbers) match exactly or as a prefix, never fuzzily:
      // otherwise one ISBN is "two typos" away from every other.
      prefix: (term) => (/\d/.test(term) ? term.length >= 4 : term.length >= 2),
      fuzzy: (term) => (/\d/.test(term) ? false : term.length >= 7 ? 0.25 : term.length >= 4 ? 0.2 : false),
      maxFuzzy: 2,
    },
  });
  ms.addAll(
    records.map((r) => {
      const ct = r.catalogue && data.catalogueText ? data.catalogueText(r) : null;
      // Catalogue items use their format's words ("film", "map", "thesis") rather than
      // the generic "book"; heritage items keep "heritage / rare" as well.
      const typewords = ct ? (r.type === 'book' ? ct.typewords : `${TYPE_WORDS[r.type] ?? ''} ${ct.typewords}`) : TYPE_WORDS[r.type] ?? '';
      return {
        id: r.id,
        title_en: r.title.en,
        title_ar: r.title.ar,
        summary_en: r.summary.en,
        summary_ar: r.summary.ar,
        tags: tagText(r.tags),
        triggers: r.task ? r.task.triggers.join(' ') : '',
        typewords,
        place: r.place ? `${r.place.en} ${r.place.ar}` : '',
        creators: ct?.creators ?? '',
        subjects: ct?.subjects ?? '',
        places_cat: ct?.places_cat ?? '',
        ids: ct?.ids ?? '',
      };
    }),
  );

  function expand(qTokens: string[]): string[] {
    const out = new Set<string>();
    for (const { tokens, group } of synPhrases) {
      // phrase present as a contiguous run in the query?
      for (let i = 0; i + tokens.length <= qTokens.length; i++) {
        if (tokens.every((t, j) => qTokens[i + j] === t)) {
          groupTerms[group].forEach((t) => out.add(t));
          break;
        }
      }
    }
    qTokens.forEach((t) => out.delete(t));
    return [...out];
  }

  function editDistLE1(a: string, b: string) {
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++;
      else if (b.length > a.length) j++;
      else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }

  function findTask(qTokens: string[], expanded: string[]): TaskAnswer | null {
    if (!qTokens.length) return null;
    const pool = new Set([...qTokens, ...expanded]);
    let best: { rec: LibraryRecord; len: number; raw: string; direct: boolean } | null = null;
    for (const { record, triggers } of taskTriggers) {
      for (const tr of triggers) {
        const direct = tr.toks.every((t) => qTokens.some((q) => q === t || (t.length >= 5 && editDistLE1(q, t))));
        const viaSyn = !direct && tr.toks.every((t) => pool.has(t));
        if (!direct && !viaSyn) continue;
        const len = tr.toks.length * 10 + tr.toks.join('').length + (direct ? 100 : 0);
        if (!best || len > best.len) best = { rec: record, len, raw: tr.raw, direct };
      }
    }
    // A bare one-word query that only matched via synonyms is too weak unless the query is short.
    if (best && !best.direct && qTokens.length > 3) return null;
    return best ? { record: best.rec, matched: best.raw } : null;
  }

  function weekBucket(iso?: string): 'week' | 'month' | 'later' | undefined {
    if (!iso) return undefined;
    const d = new Date(iso).getTime();
    const t = Date.now();
    const days = (d - t) / 86400000;
    if (days < 7) return 'week';
    if (days < 31) return 'month';
    return 'later';
  }

  function run(req: SearchRequest): SearchResponse & { groups: Record<Group, Hit[]> } {
    const t0 = now();
    const raw = req.q.trim();
    const qTokens = processText(raw);
    const expanded = expand(qTokens);

    const scores = new Map<string, { score: number; terms: Set<string> }>();
    const add = (res: SearchResult[], w: number) => {
      for (const r of res) {
        const cur = scores.get(r.id as string) ?? { score: 0, terms: new Set<string>() };
        cur.score += r.score * w;
        r.terms.forEach((t) => cur.terms.add(t));
        for (const qt of r.queryTerms) cur.terms.add(qt);
        scores.set(r.id as string, cur);
      }
    };

    if (qTokens.length) {
      const and = ms.search(raw, { combineWith: 'AND' });
      add(and, 1);
      if (and.length < 6 && qTokens.length > 1) add(ms.search(raw, { combineWith: 'OR' }), 0.45);
      if (expanded.length) add(ms.search(expanded.join(' '), { combineWith: 'OR', prefix: false, fuzzy: false }), 0.55);
    }

    const task = findTask(qTokens, expanded);
    let hits: Hit[] = [...scores.entries()]
      .map(([id, v]) => ({ record: byId.get(id)!, score: v.score, terms: [...v.terms] }))
      .filter((h) => h.record);
    // Drop the long fuzzy tail: keep hits within 12% of the best score.
    const best = hits.reduce((m, h) => Math.max(m, h.score), 0);
    hits = hits.filter((h) => h.score >= best * 0.12);
    if (task) {
      // Pin the answered task: it always leads Services and the overall list.
      const existing = hits.find((h) => h.record.id === task.record.id);
      if (existing) existing.score = best + 1;
      else hits.push({ record: task.record, score: best + 1, terms: [] });
    }

    // Facet counts are computed before the facet filters themselves are applied
    // (except the group filter, which is applied first for audience/lang/date counts).
    const f = req.filters ?? {};
    const facets = { group: {} as Record<string, number>, audience: {} as Record<string, number>, language: {} as Record<string, number>, date: {} as Record<string, number> };
    for (const h of hits) {
      const g = TYPE_TO_GROUP[h.record.type];
      facets.group[g] = (facets.group[g] ?? 0) + 1;
    }
    if (f.group && f.group !== 'all') hits = hits.filter((h) => TYPE_TO_GROUP[h.record.type] === f.group);
    for (const h of hits) {
      h.record.audience.forEach((a) => (facets.audience[a] = (facets.audience[a] ?? 0) + 1));
      const langs = h.record.lang === 'both' ? ['en', 'ar'] : [h.record.lang];
      langs.forEach((l) => (facets.language[l] = (facets.language[l] ?? 0) + 1));
      const b = weekBucket(h.record.start);
      if (b) facets.date[b] = (facets.date[b] ?? 0) + 1;
    }
    if (f.audience?.length) hits = hits.filter((h) => h.record.audience.some((a) => f.audience!.includes(a)));
    if (f.language?.length) hits = hits.filter((h) => h.record.lang === 'both' || f.language!.includes(h.record.lang as 'en' | 'ar'));
    if (f.date) hits = hits.filter((h) => weekBucket(h.record.start) === f.date);

    const L = req.lang;
    if (req.sort === 'title') hits.sort((a, b) => a.record.title[L].localeCompare(b.record.title[L], L));
    else if (req.sort === 'date') hits.sort((a, b) => (a.record.start ?? '9999').localeCompare(b.record.start ?? '9999') || b.score - a.score);
    else hits.sort((a, b) => b.score - a.score);

    const groups = Object.fromEntries(GROUP_ORDER.map((g) => [g, [] as Hit[]])) as Record<Group, Hit[]>;
    for (const h of hits) groups[TYPE_TO_GROUP[h.record.type]].push(h);

    // Related topics: tags most common among hits, else tags whose labels fuzzily match.
    const tagCount = new Map<string, number>();
    hits.slice(0, 12).forEach((h) => h.record.tags.forEach((t) => tagCount.set(t, (tagCount.get(t) ?? 0) + 1)));
    let related = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k).filter((k) => tags[k]).slice(0, 5);
    if (!related.length) related = ['research-skills', 'gulf-history', 'children', 'visiting', 'reading'];

    const total = hits.length;
    if (req.limit) hits = hits.slice(0, req.limit);
    return { q: raw, total, hits, task, expanded, related, facets, groups, tookMs: now() - t0 };
  }

  return {
    search: (req: SearchRequest) => run(req),
    suggest: (req: SearchRequest & { perGroup?: number }) => {
      const res = run({ ...req, limit: undefined });
      const per = req.perGroup ?? 3;
      for (const g of GROUP_ORDER) res.groups[g] = res.groups[g].slice(0, per);
      return res;
    },
    record: (id: string) => byId.get(id),
    records,
    tags,
  };
}

export type Engine = ReturnType<typeof createEngine>;

export { highlight, type Seg } from './highlight';
