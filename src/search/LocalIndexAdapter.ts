import type { SearchProvider, SearchRequest } from './types';
import type { Engine } from './engine';

/**
 * Demo adapter: a client-side MiniSearch index over the sample content.
 * The engine and data load as one lazy chunk on first focus/typing (or on
 * hover/idle prefetch), so they never weigh on first paint.
 */
export class LocalIndexAdapter implements SearchProvider {
  readonly name = 'local-index';
  private engine: Engine | null = null;
  private loading: Promise<void> | null = null;

  prepare(): Promise<void> {
    if (this.engine) return Promise.resolve();
    if (!this.loading) {
      this.loading = Promise.all([import('./engine'), import('./data')]).then(([{ createEngine }, { engineData }]) => {
        this.engine = createEngine(engineData);
      });
    }
    return this.loading;
  }

  get ready() { return !!this.engine; }

  async search(req: SearchRequest) {
    await this.prepare();
    return this.engine!.search(req);
  }

  async suggest(req: SearchRequest & { perGroup?: number }) {
    await this.prepare();
    return this.engine!.suggest(req);
  }

  /** Synchronous path once warm, so type-ahead renders in the same frame. */
  suggestSync(req: SearchRequest & { perGroup?: number }) {
    return this.engine ? this.engine.suggest(req) : null;
  }
}
