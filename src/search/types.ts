export type Lang = 'en' | 'ar';
export type Bi = { en: string; ar: string };
export type RecordType = 'book' | 'database' | 'event' | 'service' | 'heritage' | 'page';
export type Group = 'books' | 'research' | 'events' | 'services' | 'heritage' | 'pages';

export const TYPE_TO_GROUP: Record<RecordType, Group> = {
  book: 'books',
  database: 'research',
  event: 'events',
  service: 'services',
  heritage: 'heritage',
  page: 'pages',
};
export const GROUP_ORDER: Group[] = ['books', 'research', 'events', 'services', 'heritage', 'pages'];

export interface TaskInfo {
  triggers: string[];
  answer: Bi;
  action: Bi;
}

/** Catalogue holdings (books, media, heritage items). Codes follow QNL's
 *  catalogue; labels live in content/catalogue.json. */
export type HoldingStatus = 'available' | 'on-loan' | 'library-use' | 'on-order' | 'online';
export interface Holding {
  location: string;
  callNo: string | null;
  status: HoldingStatus;
  /** ISO date, when on loan */
  due?: string;
  /** when on order */
  copies?: number;
  ordered?: string;
}
export interface CatalogueInfo {
  format: string;
  /** ISO 639-2 (ara, eng, fre, mul, zxx) */
  language: string;
  authors: (Bi & { role?: string })[];
  publication?: { place?: Bi; publisher?: Bi; year?: number };
  edition?: Bi;
  description: Bi;
  subjects: Bi[];
  /** keys into catalogue.json places (preferred labels + spelling variants) */
  places?: string[];
  /** place names exactly as catalogued, variant spellings included */
  placesAsCatalogued?: string[];
  isbn?: string;
  collection: string;
  holdings: Holding[];
  online?: boolean;
  /** derived labels (attached in search/data.ts) */
  display?: { format: Bi; language: Bi; group: string };
}

export interface LibraryRecord {
  id: string;
  type: RecordType;
  sample: true;
  lang: 'en' | 'ar' | 'both' | 'other';
  audience: string[];
  tags: string[];
  title: Bi;
  summary: Bi;
  year?: number;
  access?: 'remote' | 'onsite';
  category?: string;
  start?: string;
  place?: Bi;
  booking?: 'drop-in' | 'register';
  image?: string;
  task?: TaskInfo;
  catalogue?: CatalogueInfo;
}

export interface Hit {
  record: LibraryRecord;
  score: number;
  /** processed query terms that matched, for highlighting */
  terms: string[];
}

export interface TaskAnswer {
  record: LibraryRecord;
  matched: string;
}

export interface SearchFilters {
  group?: Group | 'all';
  audience?: string[];
  language?: ('en' | 'ar')[];
  date?: 'week' | 'month' | 'later';
}

export type SortKey = 'relevance' | 'date' | 'title';

export interface SearchRequest {
  q: string;
  lang: Lang;
  filters?: SearchFilters;
  sort?: SortKey;
  limit?: number;
}

export interface SearchResponse {
  q: string;
  total: number;
  hits: Hit[];
  task: TaskAnswer | null;
  /** query terms after synonym expansion (for "related" suggestions) */
  expanded: string[];
  /** related topic tags for zero/low results */
  related: string[];
  facets: {
    group: Record<string, number>;
    audience: Record<string, number>;
    language: Record<string, number>;
    date: Record<string, number>;
  };
  /** present when the query used search syntax (phrases, operators, fields) */
  parsed?: import('./query').ParsedQuery;
  tookMs: number;
}

/**
 * The front end only talks to this interface. Today it is backed by a
 * client-side index (LocalIndexAdapter); in production the same calls go to
 * QNL's Discovery System + website search via the middle tier
 * (DiscoveryApiAdapter). Swapping adapters changes no UI code.
 */
export interface SearchProvider {
  readonly name: string;
  /** Warm up (download index, open connections). Safe to call repeatedly. */
  prepare(): Promise<void>;
  search(req: SearchRequest): Promise<SearchResponse>;
  /** Type-ahead: grouped, few per group. */
  suggest(req: SearchRequest & { perGroup?: number }): Promise<SearchResponse & { groups: Record<Group, Hit[]> }>;
}
