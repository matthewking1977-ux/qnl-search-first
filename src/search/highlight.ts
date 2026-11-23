import { normalise, processTerm } from './normalise';

// ── Highlighting ────────────────────────────────────────────────
export type Seg = { t: string; m: boolean };
/** Split display text into segments, marking words whose processed form matches a hit term. */
export function highlight(text: string, terms: string[]): Seg[] {
  if (!terms.length) return [{ t: text, m: false }];
  const set = terms.filter((t) => t.length >= 2);
  const out: Seg[] = [];
  const re = /([\p{L}\p{N}]+)|([^\p{L}\p{N}]+)/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const word = m[1];
    if (word) {
      const p = processTerm(word) ?? normalise(word);
      const hit = set.some((t) => p === t || (t.length >= 3 && p.startsWith(t)) || (p.length >= 4 && t.startsWith(p)));
      out.push({ t: word, m: hit });
    } else out.push({ t: m[2], m: false });
  }
  // merge neighbours for cleaner markup
  return out.reduce<Seg[]>((acc, s) => {
    const last = acc[acc.length - 1];
    if (last && last.m === s.m) last.t += s.t;
    else acc.push({ ...s });
    return acc;
  }, []);
}
