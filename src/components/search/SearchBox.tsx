/** @jsxImportSource preact */
import { useEffect, useId, useMemo, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { LocalIndexAdapter } from '../../search/LocalIndexAdapter';
import { highlight } from '../../search/highlight';
import { track } from '../../search/analytics';
import { GROUP_ORDER, TYPE_TO_GROUP, type Group, type Hit, type Lang, type LibraryRecord, type SearchResponse } from '../../search/types';
import { itemHref, searchHref, catalogueHref } from '../../search/links';
import '../../styles/search.css';

type S = Record<string, string>;
type Suggest = SearchResponse & { groups: Record<Group, Hit[]> };
type Opt =
  | { kind: 'task'; record: LibraryRecord; href: string }
  | { kind: 'hit'; hit: Hit; href: string; group: Group; pos: number }
  | { kind: 'all'; group: Group; n: number; href: string }
  | { kind: 'allResults'; n: number; href: string }
  | { kind: 'query'; q: string; section: 'recent' | 'popular' | 'related' }
  | { kind: 'link'; label: string; help: string; href: string; external?: boolean };

interface Props {
  lang: Lang;
  s: S;
  tags: Record<string, { en: string; ar: string }>;
  variant?: 'hero' | 'page';
  initialQuery?: string;
  initialGroup?: Group | 'all';
  autoFocusDesktop?: boolean;
  /** Show the "Search the library / Ask a question" mode switch (results page only). */
  modes?: boolean;
  /** Hero only: "Try" suggestions + Advanced search link under the bar. */
  advancedHref?: string;
  /** Intl locale incl. numbering system, from LOCALE_SETTINGS (i18n/index.ts) */
  locale?: string;
}

const provider = new LocalIndexAdapter();
const fmt = (str: string, v: Record<string, string | number>) => str.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
const SCOPES: (Group | 'all')[] = ['all', 'books', 'research', 'events', 'services', 'heritage'];
const TRY = [4, 5, 1];
const RECENT_KEY = 'qnl.recent';
/** Count label with Arabic plural forms (zero/one/two/few/many). */
export function countLabel(n: number, s: S, lang: Lang) {
  if (n === 0) return s['search.count0'];
  if (n === 1) return s['search.count1'];
  const cat = new Intl.PluralRules(lang === 'ar' ? 'ar' : 'en').select(n);
  if (cat === 'two') return s['search.count2'];
  if (cat === 'few') return fmt(s['search.countFew'], { n });
  return fmt(s['search.count'], { n });
}

function readRecent(): string[] {
  try { return JSON.parse(sessionStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function pushRecent(q: string) {
  const v = q.trim();
  if (!v) return;
  try {
    const list = [v, ...readRecent().filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, 5);
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch { /* storage unavailable: fine */ }
}

function Hl({ text, terms }: { text: string; terms: string[] }) {
  return <>{highlight(text, terms).map((seg, i) => (seg.m ? <mark key={i}>{seg.t}</mark> : seg.t))}</>;
}

function metaLine(r: LibraryRecord, lang: Lang, s: S, loc: string): string {
  if (r.type === 'event' && r.start) {
    const d = new Date(r.start);
    const date = new Intl.DateTimeFormat(loc, { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
    const time = new Intl.DateTimeFormat(loc, { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
    return `${date} · ${time} · ${r.place?.[lang] ?? ''}`;
  }
  const d = r.catalogue?.display;
  if (d) return [d.format[lang], r.year ?? r.catalogue?.publication?.year, r.catalogue!.language !== 'zxx' && d.language[lang]].filter(Boolean).join(' · ');
  if (r.type === 'book') return [r.year, s[`meta.lang.${r.lang}`]].filter(Boolean).join(' · ');
  if (r.type === 'database') return s[r.access === 'onsite' ? 'meta.onsite' : 'meta.remote'];
  return r.summary[lang];
}

export default function SearchBox({ lang, s, tags, variant = 'hero', initialQuery = '', initialGroup = 'all', autoFocusDesktop = false, modes = variant === 'page', advancedHref, locale }: Props) {
  const loc = locale ?? (lang === 'ar' ? 'ar-QA-u-nu-latn' : 'en-GB');
  const uid = `sb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [mode, setMode] = useState<'library' | 'ask'>('library');
  const [q, setQ] = useState(initialQuery);
  const [group, setGroup] = useState<Group | 'all'>(initialGroup);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [res, setRes] = useState<Suggest | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [live, setLive] = useState('');
  const [perf, setPerf] = useState<number[]>([]);
  const [askShown, setAskShown] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const t0 = useRef(0);
  const seq = useRef(0);
  const lastTracked = useRef('');
  const taskTracked = useRef('');
  const idle = useRef<number | undefined>(undefined);

  // ── Data
  const run = (query: string, g: Group | 'all') => {
    const my = ++seq.current;
    const req = { q: query, lang, filters: { group: g }, perGroup: 3 } as const;
    const sync = provider.suggestSync(req);
    if (sync) { setRes(sync); return; }
    setLoading(true);
    provider.suggest(req).then((r) => {
      if (my !== seq.current) return;
      setLoading(false);
      setRes(r);
    });
  };

  const warm = () => { provider.prepare(); };

  // Hover / idle prefetch of the index chunk
  useEffect(() => {
    const ric = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 2500));
    const h = ric(() => provider.prefetch(), { timeout: 4000 });
    setRecent(readRecent());
    // Hydration runs at idle: keep anything typed (or a scope picked) before it.
    const el = inputRef.current;
    const scope = rootRef.current?.querySelector('select') as HTMLSelectElement | null;
    const g0 = ((scope?.value || 'all') as Group | 'all');
    if (scope && g0 !== group) setGroup(g0);
    if (el && el.value && el.value !== q) {
      setQ(el.value);
      if (document.activeElement === el) { setOpen(true); t0.current = performance.now(); run(el.value.trim(), g0); }
    }
    if (autoFocusDesktop && window.matchMedia('(min-width: 64rem) and (pointer: fine)').matches && !location.hash) {
      inputRef.current?.focus({ preventScroll: true });
    }
    if (initialQuery) run(initialQuery, initialGroup);
    return () => (window as any).cancelIdleCallback?.(h);
  }, []);

  // Global shortcut: "/" or ⌘K / Ctrl+K focuses search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const editing = el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
      const isK = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey);
      if ((e.key === '/' && !editing) || isK) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        rootRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        warm();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close on outside click
  useEffect(() => {
    const onDown = (e: PointerEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  // Timing (?perf=1) + analytics + live region, after each rendered result set
  useEffect(() => {
    if (!res || !t0.current) return;
    const ms = performance.now() - t0.current;
    t0.current = 0;
    (window as any).__qnlTypeahead = [...((window as any).__qnlTypeahead ?? []), { q: res.q, ms, engineMs: res.tookMs }];
    if (document.documentElement.hasAttribute('data-perf')) setPerf((p) => [ms, ...p].slice(0, 12));
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => {
      const n = res.total;
      setLive(res.q ? countLabel(n, s, lang) : '');
      if (res.q && res.q !== lastTracked.current) {
        lastTracked.current = res.q;
        track({ event: 'search_query', search_term: res.q, search_mode: mode, search_filter: group, results_count: n, lang, source: 'typeahead' });
        if (n === 0) track({ event: 'search_zero_results', search_term: res.q, search_filter: group, lang });
      }
    }, 450);
    if (res.task && taskTracked.current !== res.q) {
      taskTracked.current = res.q;
      track({ event: 'task_answer_shown', search_term: res.q, task_id: res.task.record.id, lang });
    }
  }, [res]);

  // ── Options model (flat list for ↑/↓; grouped for display)
  const query = q.trim();
  const opts: Opt[] = [];
  const sections: { key: string; label: string; items: number[] }[] = [];
  const pushSection = (key: string, label: string, list: Opt[]) => {
    if (!list.length) return;
    const start = opts.length;
    opts.push(...list);
    sections.push({ key, label, items: list.map((_, i) => start + i) });
  };

  const hasResults = !!res && !!query && res.q === query;
  if (mode === 'library') {
    if (!query) {
      pushSection('recent', s['search.recent'], recent.map((r) => ({ kind: 'query', q: r, section: 'recent' } as Opt)));
      pushSection('popular', s['search.popular'], [1, 2, 3, 4, 5].map((i) => ({ kind: 'query', q: s[`popular.${i}`], section: 'popular' } as Opt)));
    } else if (hasResults && res!.total > 0) {
      if (res!.task) pushSection('answer', s['search.answer'], [{ kind: 'task', record: res!.task.record, href: itemHref(lang, res!.task.record) }]);
      let pos = 0;
      for (const g of GROUP_ORDER) {
        const hits = res!.groups[g].filter((h) => !(res!.task && h.record.id === res!.task.record.id));
        if (!hits.length) continue;
        const n = res!.facets.group[g] ?? hits.length;
        const list: Opt[] = hits.map((h) => ({ kind: 'hit', hit: h, href: itemHref(lang, h.record), group: g, pos: ++pos }));
        if (n > hits.length || n > 1) list.push({ kind: 'all', group: g, n, href: searchHref(lang, query, g) });
        pushSection(g, s[`group.${g}`], list);
      }
      if (res!.total > pos) pushSection('allres', '', [{ kind: 'allResults', n: res!.total, href: searchHref(lang, query, group) }]);
    } else if (hasResults && res!.total === 0) {
      pushSection('related', s['search.zero.related'], res!.related.slice(0, 4).map((k) => ({ kind: 'query', q: tags[k]?.[lang] ?? k, section: 'related' } as Opt)));
      pushSection('help', s['search.suggestions'], [
        { kind: 'link', label: s['search.zero.librarian'], help: s['search.zero.librarianHelp'], href: itemHref(lang, { id: 'sv-ask' }) },
        { kind: 'link', label: s['search.zero.catalogue'], help: s['search.zero.catalogueHelp'], href: catalogueHref(query), external: true },
      ]);
    }
  }

  const expanded = open && (mode === 'ask' ? askShown : opts.length > 0 || loading);
  const activeId = active >= 0 && active < opts.length ? `${uid}-o${active}` : undefined;

  useEffect(() => { setActive(-1); }, [q, group, mode]);
  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  // ── Actions
  const go = (href: string) => { window.location.href = href; };
  const choose = (o: Opt, i: number) => {
    if (o.kind === 'query') {
      setQ(o.q); setOpen(true); t0.current = performance.now(); run(o.q, group); inputRef.current?.focus();
      return;
    }
    if (o.kind === 'hit' || o.kind === 'task') {
      const r = o.kind === 'hit' ? o.hit.record : o.record;
      pushRecent(query);
      track({ event: 'result_click', search_term: query, result_id: r.id, result_type: r.type, result_position: o.kind === 'hit' ? o.pos : 0, group: TYPE_TO_GROUP[r.type], lang, source: 'typeahead' });
    }
    if ('href' in o) {
      if (o.kind !== 'link') pushRecent(query);
      go(o.href);
    }
  };

  const onInput = (e: JSX.TargetedEvent<HTMLInputElement>) => {
    const v = e.currentTarget.value;
    setQ(v);
    setOpen(true);
    if (mode === 'ask') return;
    t0.current = performance.now();
    run(v.trim(), group);
  };

  const onKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setActive((a) => (opts.length ? (a + 1) % opts.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (opts.length ? (a <= 0 ? opts.length - 1 : a - 1) : -1));
    } else if (e.key === 'Home' && open && active >= 0) {
      e.preventDefault(); setActive(0);
    } else if (e.key === 'End' && open && active >= 0) {
      e.preventDefault(); setActive(opts.length - 1);
    } else if (e.key === 'Enter' && open && active >= 0 && opts[active]) {
      e.preventDefault();
      choose(opts[active], active);
    } else if (e.key === 'Escape') {
      if (open) { e.preventDefault(); setOpen(false); setActive(-1); }
      else if (q) { e.preventDefault(); setQ(''); setRes(null); }
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const onSubmit = (e: JSX.TargetedEvent<HTMLFormElement>) => {
    if (mode === 'ask') { e.preventDefault(); setAskShown(true); setOpen(true); return; }
    if (!query) { e.preventDefault(); inputRef.current?.focus(); setOpen(true); return; }
    pushRecent(query);
    track({ event: 'search_query', search_term: query, search_mode: 'library', search_filter: group, results_count: res?.total ?? -1, lang, source: 'submit' });
  };

  const pickGroup = (g: Group | 'all') => {
    setGroup(g);
    if (query) { t0.current = performance.now(); run(query, g); }
  };

  const setModeTo = (m: 'library' | 'ask') => {
    setMode(m);
    setAskShown(m === 'ask' && !!q.trim());
    inputRef.current?.focus();
    if (m === 'library' && query) { t0.current = performance.now(); run(query, group); }
  };

  // ── Render helpers
  const renderOpt = (o: Opt, i: number) => {
    const id = `${uid}-o${i}`;
    const common = {
      id, role: 'option' as const, 'aria-selected': i === active,
      class: `opt opt--${o.kind}${i === active ? ' is-active' : ''}`,
      onMouseDown: (e: MouseEvent) => e.preventDefault(),
      onClick: () => choose(o, i),
      onMouseMove: () => active !== i && setActive(i),
    };
    switch (o.kind) {
      case 'task':
        return (
          <li {...common}>
            <span class="task-q">
              <span class="task-title">{o.record.title[lang]}</span>
              <span class="task-answer">{o.record.task!.answer[lang]}</span>
            </span>
            <span class="task-cta">{o.record.task!.action[lang]} <span class="arrow icon-dir" aria-hidden="true">→</span></span>
          </li>
        );
      case 'hit': {
        const r = o.hit.record;
        return (
          <li {...common}>
            <span class="hit-title"><Hl text={r.title[lang]} terms={o.hit.terms} /></span>
            <span class="hit-meta">{metaLine(r, lang, s, loc)}</span>
          </li>
        );
      }
      case 'all':
        return <li {...common}><span class="see-all">{fmt(s['search.seeAll'], { n: o.n, group: s[`group.${o.group}`] })}</span><span class="arrow icon-dir" aria-hidden="true">→</span></li>;
      case 'allResults':
        return <li {...common}><span class="see-all strong">{fmt(s['search.seeAllResults'], { n: o.n, q: query })}</span><span class="arrow icon-dir" aria-hidden="true">→</span></li>;
      case 'query':
        return (
          <li {...common}>
            <svg class="qicon" viewBox="0 0 20 20" aria-hidden="true">
              {o.section === 'recent'
                ? <path d="M10 4.5a5.5 5.5 0 1 1-5.2 3.7M4.5 4v4h4M10 7.5V10l1.8 1.3" />
                : <path d="M8.5 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm3.9-1.6L17 17" />}
            </svg>
            <span>{o.q}</span>
          </li>
        );
      case 'link':
        return (
          <li {...common}>
            <span class="hit-title">{o.label}</span>
            <span class="hit-meta">{o.help}</span>
          </li>
        );
    }
  };

  const zero = mode === 'library' && hasResults && res!.total === 0;

  return (
    <div class={`sb sb--${variant}`} ref={rootRef} onPointerEnter={warm} data-mode={mode}>
      {modes && <div class="sb-modes" role="radiogroup" aria-label={s['search.modes']}>
        {(['library', 'ask'] as const).map((m) => (
          <button
            type="button"
            role="radio"
            aria-checked={mode === m}
            class={`sb-mode${mode === m ? ' is-on' : ''}`}
            onClick={() => setModeTo(m)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                setModeTo(mode === 'library' ? 'ask' : 'library');
                (rootRef.current?.querySelector('.sb-mode:not(.is-on)') as HTMLElement | null)?.focus();
              }
            }}
            tabIndex={mode === m ? 0 : -1}
          >
            {m === 'library' ? s['search.mode.library'] : <>{s['search.mode.ask']} <span class="phase" lang={lang}>{s['search.phase2']}</span></>}
          </button>
        ))}
      </div>}

      <form class="sb-form" role="search" action={searchHref(lang, '')} method="get" onSubmit={onSubmit} autocomplete="off">
        <label class="sr-only" for={`${uid}-input`}>{mode === 'ask' ? s['search.mode.ask'] : s['search.label']}</label>
        <div class={`sb-field${expanded ? ' is-open' : ''}`}>
          <span class="sb-scope">
            <label class="sr-only" for={`${uid}-scope`}>{s['search.scope']}</label>
            <select id={`${uid}-scope`} name="type" value={group === 'all' ? '' : group}
              onChange={(e) => pickGroup(((e.currentTarget as HTMLSelectElement).value || 'all') as Group | 'all')}>
              {SCOPES.map((g) => <option value={g === 'all' ? '' : g} selected={group === g}>{g === 'all' ? s['filter.all'] : s[`filter.${g}`]}</option>)}
            </select>
            <svg class="sb-chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5l3-3" /></svg>
          </span>
          <svg class="sb-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm4.7-1.8L20 20" /></svg>
          <input
            ref={inputRef}
            id={`${uid}-input`}
            class="sb-input"
            type="search"
            name="q"
            value={q}
            placeholder={mode === 'ask' ? s['search.ask.placeholder'] : s['search.placeholder']}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={`${uid}-list`}
            aria-activedescendant={expanded ? activeId : undefined}
            aria-describedby={`${uid}-hint`}
            enterKeyHint="search"
            spellcheck={false}
            autocapitalize="off"
            onInput={onInput}
            onKeyDown={onKeyDown}
            onFocus={() => { warm(); }}
            onPointerDown={() => setOpen(true)}
          />
          {q && (
            <button type="button" class="sb-clear" aria-label={s['search.clear']} onClick={() => { setQ(''); setRes(null); setAskShown(false); inputRef.current?.focus(); setOpen(true); }}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" /></svg>
            </button>
          )}
          <button class="btn btn--primary sb-submit" type="submit">
            <svg class="sb-submit-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm4.7-1.8L20 20" /></svg>
            <span class="sb-submit-label">{s['search.submit']}</span>
          </button>
        </div>
        <span id={`${uid}-hint`} class="sr-only">{s['search.shortcut']}</span>

        {/* Panel */}
        <div class={`sb-panel${expanded ? ' is-open' : ''}`} hidden={!expanded}>
          {mode === 'ask' ? (
            <div class="ask" role="status">
              <p class="ask-eyebrow"><span class="phase">{s['search.phase2']}</span></p>
              <p class="ask-title">{s['search.ask.title']}</p>
              <p class="ask-body">{s['search.ask.body']}</p>
              <p class="ask-body">{s['search.ask.try']}</p>
              <div class="ask-actions">
                <button type="button" class="btn btn--secondary" onClick={() => setModeTo('library')}>{s['search.ask.switch']}</button>
                <a class="btn btn--ghost" href={itemHref(lang, { id: 'sv-ask' })}>{s['search.zero.librarian']}</a>
              </div>
            </div>
          ) : (
            <>
              {loading && !res && <p class="sb-loading">{s['search.loading']}</p>}
              {zero && (
                <div class="zero">
                  <p class="zero-title">{fmt(s['search.zero.title'], { q: query })}</p>
                  <p class="zero-body">{s['search.zero.body']}</p>
                </div>
              )}
              <ul id={`${uid}-list`} role="listbox" aria-label={s['search.label']} class="sb-list">
                {sections.map((sec) => (
                  <li role="presentation" class={`sec sec--${sec.key}`} key={sec.key}>
                    {sec.label && <span class="sec-label" id={`${uid}-g-${sec.key}`} aria-hidden="true">{sec.label}</span>}
                    <ul role="group" aria-labelledby={sec.label ? `${uid}-g-${sec.key}` : undefined} class="sec-items">
                      {sec.items.map((i) => renderOpt(opts[i], i))}
                    </ul>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </form>

      {advancedHref && (
        <div class="sb-below">
          <p class="sb-try">
            <span class="sb-try-label">{s['search.try']}</span>
            {TRY.map((i) => <a href={searchHref(lang, s[`popular.${i}`])}>{s[`popular.${i}`]}</a>)}
          </p>
          <a class="sb-adv" href={advancedHref}>{s['search.advanced']}</a>
        </div>
      )}

      <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{live}</div>

      {perf.length > 0 && (
        <aside class="perf" aria-label={s['search.perf']} dir="ltr" lang="en">
          <strong>type-ahead</strong>
          <span>last {perf[0].toFixed(1)} ms</span>
          <span>max {Math.max(...perf).toFixed(1)} ms</span>
          <span>avg {(perf.reduce((a, b) => a + b, 0) / perf.length).toFixed(1)} ms</span>
          <span class="perf-bars">{perf.slice().reverse().map((v) => <i style={{ blockSize: `${Math.min(100, v)}%` }} />)}</span>
        </aside>
      )}
    </div>
  );
}
