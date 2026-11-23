/** @jsxImportSource preact */
// "I'm [persona ▾] looking for [need ▾]" with a live row of four task cards.
// Each choice is an APG select-only combobox (role=combobox + role=listbox).
import { useEffect, useId, useMemo, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import '../../styles/foryou.css';

type Lang = 'en' | 'ar';
type Need = { id: string; en: string; ar: string; cards: string[] };
type Persona = { id: string; en: string; ar: string; needs: Need[] };
type Card = { href: string; en: [string, string]; ar: [string, string] };
interface Props {
  lang: Lang;
  sentence: { before: string; middle: string };
  personas: Persona[];
  cards: Record<string, Card>;
  s: { live: string; cards: string; note: string };
}

const KEY = 'qnl.forYou';

function Select({ id, labelId, options, value, onChange, lang }: {
  id: string; labelId: string; lang: Lang;
  options: { id: string; label: string }[]; value: string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const typed = useRef({ buf: '', t: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  const idx = Math.max(0, options.findIndex((o) => o.id === value));
  const current = options[idx];

  useEffect(() => { if (open) setActive(idx); }, [open]);
  useEffect(() => {
    if (open) document.getElementById(`${id}-o${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const commit = (i: number) => { onChange(options[i].id); setOpen(false); };
  const typeahead = (ch: string) => {
    const now = Date.now();
    typed.current.buf = now - typed.current.t > 600 ? ch : typed.current.buf + ch;
    typed.current.t = now;
    const q = typed.current.buf.toLocaleLowerCase(lang);
    const strip = (s: string) => s.toLocaleLowerCase(lang).replace(/^(a |an |the |ال)/, '');
    const start = open ? active + 1 : idx + 1;
    const order = [...options.keys()].map((k) => (k + start) % options.length);
    const hit = order.find((k) => strip(options[k].label).startsWith(q) || options[k].label.toLocaleLowerCase(lang).startsWith(q));
    if (hit !== undefined) { if (!open) setOpen(true); setActive(hit); }
  };

  const onKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLDivElement>) => {
    const last = options.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
        setActive(e.key === 'Home' ? 0 : e.key === 'End' ? last : idx);
        return;
      }
    } else {
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); if (e.altKey) return; setActive((a) => Math.min(last, a + 1)); return;
        case 'ArrowUp': e.preventDefault(); if (e.altKey) { commit(active); return; } setActive((a) => Math.max(0, a - 1)); return;
        case 'Home': e.preventDefault(); setActive(0); return;
        case 'End': e.preventDefault(); setActive(last); return;
        case 'PageDown': e.preventDefault(); setActive((a) => Math.min(last, a + 5)); return;
        case 'PageUp': e.preventDefault(); setActive((a) => Math.max(0, a - 5)); return;
        case 'Enter': case ' ': e.preventDefault(); commit(active); return;
        case 'Escape': e.preventDefault(); setOpen(false); return;
        case 'Tab': commit(active); return;
      }
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ') typeahead(e.key);
  };

  return (
    <span class="sel">
      <div
        ref={boxRef}
        id={id}
        class={`sel-box${open ? ' is-open' : ''}`}
        role="combobox"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${labelId} ${id}`}
        aria-activedescendant={open ? `${id}-o${active}` : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        onBlur={(e) => { if (!(e.relatedTarget as Node | null) || !boxRef.current?.parentElement?.contains(e.relatedTarget as Node)) setOpen(false); }}
      >
        <span class="sel-value">{current.label}</span>
        <svg class="sel-chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 7.5 10 12.5 15 7.5" /></svg>
      </div>
      <ul id={`${id}-list`} role="listbox" aria-labelledby={labelId} class="sel-list" hidden={!open} tabIndex={-1}>
        {options.map((o, i) => (
          <li
            id={`${id}-o${i}`}
            role="option"
            aria-selected={o.id === value}
            class={`sel-opt${i === active ? ' is-active' : ''}${o.id === value ? ' is-selected' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onMouseMove={() => active !== i && setActive(i)}
            onClick={() => commit(i)}
          >
            <span>{o.label}</span>
            {o.id === value && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 10.5 8 14l7.5-8" /></svg>}
          </li>
        ))}
      </ul>
    </span>
  );
}

export default function SentenceBuilder({ lang, sentence, personas, cards, s }: Props) {
  const [pid, setPid] = useState(personas[0].id);
  const [nid, setNid] = useState(personas[0].needs[0].id);
  const [live, setLive] = useState('');
  const [anim, setAnim] = useState(0);
  // Skip side effects (save, announce, analytics) for the mount render and a silent session restore.
  const skip = useRef(1);
  const uid = `fy${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const persona = personas.find((p) => p.id === pid) ?? personas[0];
  const need = persona.needs.find((n) => n.id === nid) ?? persona.needs[0];

  // Restore the session choice.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      const p = saved && personas.find((x) => x.id === saved.p);
      if (p) {
        const n = p.needs.find((x) => x.id === saved.n)?.id ?? p.needs[0].id;
        if (p.id !== pid || n !== nid) { skip.current++; setPid(p.id); setNid(n); }
      }
    } catch { /* storage unavailable */ }
  }, []);

  useEffect(() => {
    if (skip.current > 0) { skip.current--; return; }
    try { sessionStorage.setItem(KEY, JSON.stringify({ p: persona.id, n: need.id })); } catch { /* ignore */ }
    setLive(s.live.replace('{persona}', persona[lang]).replace('{need}', need[lang]));
    setAnim((a) => a + 1);
    const w = window as unknown as { dataLayer?: unknown[] };
    (w.dataLayer = w.dataLayer || []).push({ event: 'for_you_change', persona: persona.id, need: need.id, lang, ts: Date.now() });
  }, [persona.id, need.id]);

  const changePersona = (id: string) => {
    const p = personas.find((x) => x.id === id)!;
    setPid(id);
    if (!p.needs.some((n) => n.id === nid)) setNid(p.needs[0].id);
  };

  const prefix = lang === 'ar' ? '/ar' : '';
  const href = (h: string) => (h.startsWith('/') ? prefix + h : h);

  return (
    <div class="fy">
      <div class="fy-sentence" lang={lang}>
        <span id={`${uid}-l1`}>{sentence.before}</span>{' '}
        <Select id={`${uid}-p`} labelId={`${uid}-l1`} lang={lang} value={persona.id} onChange={changePersona}
          options={personas.map((p) => ({ id: p.id, label: p[lang] }))} />{' '}
        <span id={`${uid}-l2`}>{sentence.middle}</span>{' '}
        <Select id={`${uid}-n`} labelId={`${uid}-l2`} lang={lang} value={need.id} onChange={setNid}
          options={persona.needs.map((n) => ({ id: n.id, label: n[lang] }))} />
      </div>
      <p class="fy-note">{s.note}</p>

      <ul class="fy-cards" aria-label={s.cards} key={anim} data-anim={anim > 0 ? '' : undefined}>
        {need.cards.map((cid, i) => {
          const c = cards[cid];
          return (
            <li style={{ '--i': i } as any}>
              <a class="task" href={href(c.href)}>
                <span class="task__label">{c[lang][0]}</span>
                <span class="task__go"><span class="task__help">{c[lang][1]}</span><span class="arrow icon-dir" aria-hidden="true">→</span></span>
              </a>
            </li>
          );
        })}
      </ul>
      <div class="sr-only" role="status" aria-live="polite">{live}</div>
    </div>
  );
}
