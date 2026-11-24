// Sample content bundle. Imported lazily by the client (its own chunk) and
// directly by the server-rendered /search page.
import books from '../content/books.json';
import databases from '../content/databases.json';
import events from '../content/events.json';
import services from '../content/services.json';
import heritage from '../content/heritage.json';
import pages from '../content/pages.json';
import tagsRaw from '../content/tags.json';
import synonyms from '../content/synonyms.json';
import type { LibraryRecord } from './types';
import type { EngineData, TagDef } from './engine';
import { attachDisplay, catalogueIndexText } from './catalogue';

const { _note, ...tags } = tagsRaw as Record<string, unknown>;

export const records = [...books, ...databases, ...events, ...services, ...heritage, ...pages] as LibraryRecord[];
records.forEach(attachDisplay);
export const engineData: EngineData = {
  records,
  tags: tags as Record<string, TagDef>,
  synonyms: synonyms.groups,
  catalogueText: catalogueIndexText,
};
