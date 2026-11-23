# Phase 2: search core report

## What's built
- **Content:** 80 bilingual sample records in `src/content/`: 18 books, 12 databases, 14 events, 18 services/tasks, 10 heritage items, 8 pages. All `sample: true`, with no real titles, people or dates. Shared bilingual tags (`tags.json`) and synonym groups (`synonyms.json`). Facts we don't know are `[TBC]`.
- **Engine:** MiniSearch with a custom tokeniser and term processor (`src/search/normalise.ts`).
  - Arabic: alef forms أ إ آ ٱ → ا, ة → ه, ى → ي (plus ؤ → و, ئ → ي); harakat and tatweel removed; Arabic-Indic digits → 0–9; light prefix and suffix stemming (ال، وال، بال، لل…).
  - Latin: lowercase, accents removed, light plural and -ing stemming.
  - Typo tolerance: fuzzy matching for terms of 4+ letters, plus prefix matching while typing.
  - Synonyms: expanded at query time. Multi-word phrases trigger a synonym group but are never split into loose words.
  - Cross-language matching: every record is indexed with its tag labels and synonyms in both languages.
  - Task answers: matched on trigger phrases (direct, one-edit typo, or via a synonym) and pinned to the top.
  - The long fuzzy tail is cut at 12% of the best score.
- **Architecture:** `SearchProvider` interface (`types.ts`), `LocalIndexAdapter` (lazy chunk, used now) and a `DiscoveryApiAdapter` stub documenting the middle-tier API shape.
- **Type-ahead island** (`components/search/SearchBox.tsx`):
  - two modes: Library, and Ask, which shows a "coming in Phase 2" explanation and never an invented answer;
  - follows the ARIA combobox/listbox pattern with grouped options (↑ ↓ Home End Enter Esc Tab);
  - highlights matched words;
  - groups results as Books · Research · Events · Services · Heritage · Pages, up to 3 each, with "See all";
  - shows recent searches (kept for the session) and "Popular right now" before typing;
  - zero results offers related topics, Ask a librarian and the catalogue;
  - filter chips; `/` and ⌘K/Ctrl+K open search; autofocus on desktop only;
  - a live region announces the result count, with correct Arabic plural forms;
  - `?perf=1` shows a timing overlay.
- **`/search` and `/ar/search`:** rendered on the server (the only non-static routes).
  - filters: type, audience, content language, event date; sorting by relevance, date or title;
  - every state is a shareable URL (plus a copy-link button) and pages are numbered;
  - fully usable without JS, with filters applied automatically when JS is on.
- **`/item/[id]`** (EN and AR) for all 80 records, so no result is a dead end.
- **Analytics:** `search_query`, `search_zero_results`, `result_click` and `task_answer_shown` are pushed to `window.dataLayer` from both the type-ahead and the results page.

## Type-ahead speed (measured)
Production build, desktop Chromium, typed one key at a time with Playwright. Time runs from each keystroke to the updated panel being rendered:

| Query | Keystrokes | Max | Avg | Engine only (max) |
|---|---|---|---|---|
| libary | 6 | 32.5 ms (first key) | 9.9 ms | 2.9 ms |
| opening times | 13 | 14.7 ms | 7.0 ms | 0.9 ms |
| renew | 5 | 7.4 ms | 4.1 ms | 0.6 ms |
| parking | 7 | 7.1 ms | 4.2 ms | 0.5 ms |
| gulf maritime | 13 | 15.4 ms | 8.5 ms | 1.2 ms |
| xyzzy (zero) | 6 | 13.1 ms | 8.6 ms | 0.2 ms |
| **All 50 keystrokes** | | **max 32.5 ms, p95 14.7 ms** | | |

Target was ≤ 100 ms. These are desktop numbers; throttled-mobile figures come in Phase 7.

## Weight (gzip)
- First-load JS on the homepage: ~18 KB (Preact runtime, island, hydration). Budget is 80 KB.
- Search chunk, loaded lazily on focus, typing, hover or idle: engine with MiniSearch 7.7 KB + data 14.5 KB = **22 KB**. Budget is 60 KB.

## Accessibility (axe-core 4, WCAG 2.2 AA + best practice)
Zero violations on: home with the panel closed, home with the panel open (EN and AR), `/search` and `/ar/search`.

## Checks without JS
- Submitting the homepage form goes to `/search?q=pearl` (3 results).
- A facet form submit returns the filtered results (2).
- `/search?q=renewal` shows the task answer card.
- `/search?q=xyzzy` shows the zero-results page with 7 links.
- Sorting by date orders events chronologically.

## Engine spot checks
| Query | Top result | Task answer |
|---|---|---|
| libary | Library policies (+16) | none |
| opening times / hours / مواعيد العمل | Opening hours | Opening hours |
| renew / تجديد | Renew your loans | Renew your loans |
| study room | Book a study space | Book a study space |
| اللؤلو (typed without hamza) | three pearl records | none |
| مكتبه قطر الرقميه (ه for ة) | Qatar Digital Library | none |
| شعر in the EN UI / maps in the AR UI | poetry / maps records (cross-language) | none |
