/**
 * STUB: shape of the production adapter (not wired up in the concept).
 *
 * In production the browser never calls the Discovery System (catalogue) or
 * the CMS search index directly. It calls one QNL middle-tier endpoint, which
 * fans out to both, merges and normalises the results, and returns the same
 * SearchResponse the UI already renders. Auth, rate limiting, caching and
 * Arabic normalisation live in the middle tier.
 *
 *   GET {base}/v1/search?q=…&lang=en|ar&group=books&audience=…&language=…&date=…&sort=…&limit=…
 *   GET {base}/v1/suggest?q=…&lang=…&perGroup=3            (≤ 100 ms p95 target)
 *
 * Response (JSON): SearchResponse (see ./types.ts), where each hit carries
 *   { record: { id, type, title{en,ar}, summary{en,ar}, url, … }, score, terms[] }
 * and `task` is populated from the CMS "task answers" content type.
 */
import type { Group, Hit, SearchProvider, SearchRequest, SearchResponse } from './types';

export interface DiscoveryApiConfig {
  baseUrl: string;         // e.g. https://api.qnl.qa/search  (middle tier)
  timeoutMs?: number;      // abort slow upstreams; UI shows partial groups
  fetchImpl?: typeof fetch;
}

export class DiscoveryApiAdapter implements SearchProvider {
  readonly name = 'discovery-api';
  constructor(private cfg: DiscoveryApiConfig) {}

  async prepare() {
    // e.g. preconnect + warm the CDN edge for /suggest
  }

  private params(req: SearchRequest, extra: Record<string, string | number | undefined> = {}) {
    const p = new URLSearchParams({ q: req.q, lang: req.lang });
    const f = req.filters ?? {};
    if (f.group && f.group !== 'all') p.set('group', f.group);
    f.audience?.forEach((a) => p.append('audience', a));
    f.language?.forEach((l) => p.append('language', l));
    if (f.date) p.set('date', f.date);
    if (req.sort) p.set('sort', req.sort);
    if (req.limit) p.set('limit', String(req.limit));
    Object.entries(extra).forEach(([k, v]) => v !== undefined && p.set(k, String(v)));
    return p;
  }

  private async get<T>(path: string, p: URLSearchParams): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs ?? 3000);
    try {
      const res = await (this.cfg.fetchImpl ?? fetch)(`${this.cfg.baseUrl}${path}?${p}`, { signal: ctrl.signal, headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(`Discovery API ${res.status}`);
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  search(req: SearchRequest): Promise<SearchResponse> {
    return this.get('/v1/search', this.params(req));
  }

  suggest(req: SearchRequest & { perGroup?: number }): Promise<SearchResponse & { groups: Record<Group, Hit[]> }> {
    return this.get('/v1/suggest', this.params(req, { perGroup: req.perGroup ?? 3 }));
  }
}
