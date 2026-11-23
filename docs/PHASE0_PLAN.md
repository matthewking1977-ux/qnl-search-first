# QNL Concept G "Search First": phase 0 plan (for approval)

## 1. Build plan

Astro (static) + Tailwind 4 tokens + Preact islands only for: SearchBox, SearchResults (enhances /search), SentenceBuilder, EventFilters, VideoPause, PerfOverlay.
Everything else is zero-JS HTML/CSS. EN at `/`, AR at `/ar/` (dir="rtl"), both pre-rendered.

```
src/
  layouts/Base.astro            skip link, <html lang/dir>, fonts, ?clean=1 / ?perf=1 flags
  components/
    Header.astro                logo · nav (Explore · For you · What's on · Visit · About) · AR/EN · Sign in / Become a member
    Hero.astro                  poster <img> (LCP) + lazy muted <video>, overlay, Newsreader line
      VideoPause.island         visible pause/play, auto-paused under reduced motion
      SearchBox.island          combobox: modes (Library / Ask: Phase 2), chips, type-ahead panel, / and ⌘K
    TodayStrip.astro            open until [TBC] · study spaces [SAMPLE] · next event · Metro (all links)
    ForYou.astro
      SentenceBuilder.island    "I'm a [▾] looking for [▾]" listboxes → 4 task cards (sessionStorage)
    TopTasks.astro              6 cards, label + one line, no icons
    WhatsOn.astro + EventFilters.island   3 event cards, Children · Adults · Research · Heritage
    Collections.astro           1 feature + 3, related-topic tags on hover/focus → /search?q=
    HeritageBand.astro          full-width image, one Newsreader line
    Research.astro              3 links
    Newsletter.astro            email field + app store placeholders
    Footer.astro                About · Services · Help · Policies, accessibility statement, social, contact, Metro, "Concept by Vistas Global"
  pages/
    index.astro, ar/index.astro
    search.astro, ar/search.astro     static fallback: <noscript>/no-JS form posts to pre-rendered facet pages; island hydrates for live ?q=
    styleguide.astro, ar/styleguide.astro
  search/
    SearchProvider.ts           interface { suggest(q, opts), search(q, filters, sort), taskAnswer(q) }
    LocalIndexAdapter.ts        MiniSearch, lazy-loaded index JSON
    DiscoveryApiAdapter.ts      stub: middle-tier request/response shape, not wired
    normalise.ts                Arabic + Latin normaliser, synonyms, shared bilingual tags
    analytics.ts                dataLayer: search_query, search_zero_results, result_click, task_answer_shown
  content/*.json                ~80 bilingual records, sample: true
  i18n/en.json, ar.json, ar_review.csv
scripts/build-index.ts          builds /public/search-index.{en,ar}.json at build time
```

No-JS fallback for /search: Astro on Vercel can't run a static query, so I plan to add one small Vercel serverless route (`/search` SSR, `output: 'hybrid'`) that renders results from the same index. Everything else stays static. Alternative if you want it 100% static: pre-render one page per facet and per popular query, with a plain form fallback. **Recommend: the hybrid route.**

## 2. Search engine: MiniSearch

Figures below are approximate. I'll measure them in phase 2.

- **MiniSearch** (~7 KB gzip library). It has per-term fuzzy matching (edit distance) and prefix search, and it takes a custom `tokenize` and `processTerm`, so the Arabic normaliser plugs in directly. It runs in memory and returns results well under 5 ms for about 80 records. Its serialised index for 80 bilingual records should be about 15–25 KB gzip. It supports boosting and field weights, which handle task answers and grouping.
- **Orama** is also capable (typo tolerance, custom tokenisers) and has a richer facet API. Its core is several times larger, and it adds facet machinery we can do in roughly 20 lines.
- **Pagefind** suits large static sites: a WASM runtime, chunked fragments and a build that crawls the HTML. Its typo tolerance is limited, custom Arabic normalisation is hard to inject, and the WASM plus fetch round-trips make <100 ms type-ahead on the first keystroke harder.

**Choice:** MiniSearch is the smallest of the three, has real typo tolerance and gives first-class hooks for Arabic normalisation. It fits easily inside the 60 KB lazy budget and the 100 ms target.

## 3. Colour tokens extracted from qnl.qa

Source: https://www.qnl.qa/en → `/themes/qnltheme/css/style.css` → `@import style_basic.css, style_extra.css, blogs.css` (copies in `docs/qnl-css-evidence/`).
Bootstrap 3 defaults in the same CSS (#337ab7, alert colours etc.) were excluded: they're framework leftovers, not QNL brand.

### Found in use

| Hex | Count | Where |
|---|---|---|
| `#901235` | 51 | QNL maroon: h1, links, `h2.block-title`, `.btn-brandedmaroon`, `.main-container a`, breadcrumb hover |
| `#000` / `#000000` | 84 | header `#navbar` background, `.footer` background, `.btn-brandedblack` |
| `#090909` | 6 | inverse navbar near-black |
| `#242323` | 4 | search form block background (`section.qnl-search-form`) |
| `#333333` | 27 | `body` text colour |
| `#7f7e7e` | 12 | `.btn-brandeddarkgrey`, left-menu body text |
| `#c4c4c4` | 8 | search form title and underline (on dark) |
| `#efefef` | 13 | nav dropdown background |
| `#f4f5f4` | 17 | `.btn-brandedlightgrey`, news and snapshot panels |
| `#fad164` | 13 | gold: open/hover nav items on dark, sidebar focus |
| `#f9a44a` | 3 | orange: language switcher hover, "Did you know" subtitle |
| `#bb1437` | 2 | "promote" links in dropdown |
| `#00a3e4` | 1 | events block title underline (one-off, not used) |

### Proposed tokens

| Token | Hex | Source | Use |
|---|---|---|---|
| `--ink` | `#090909` | navbar | header/footer/hero surfaces |
| `--text` | `#242323` | search form | body text (15.7:1 on white) |
| `--paper` | `#ffffff` | body | main background |
| `--paper-2` | `#f4f5f4` | light-grey panels | alternating section bands |
| `--grey-100` | `#efefef` | dropdown | hairlines on paper |
| `--grey-300` | `#c4c4c4` | search form | text and lines **on dark** only (11.4:1 on ink) |
| `--grey-600` | `#6b6a6a` | **adjusted** from `#7f7e7e` | secondary text (5.4:1 on white, 4.9:1 on paper-2) |
| `--grey-800` | `#333333` | body text | strong secondary text |
| `--accent` | `#901235` | QNL maroon | links, focus ring and active state on light, eyebrows (9.0:1 white, 8.3:1 paper-2) |
| `--accent-hover` | `#bb1437` | promote link | link hover on light (6.4:1) |
| `--accent-on-dark` | `#fad164` | nav hover gold | focus ring and active state **on ink/hero** (13.6:1). Maroon on black is only 2.2:1, so it can't serve there |
| `--tag` (optional) | `#f9a44a` | lang switcher | event/category tag fill with `--ink` text (9.9:1) |

### What I changed and why
1. **`#7f7e7e` → `#6b6a6a`** for text: the original is 4.05:1 on white and 3.70:1 on `#f4f5f4`, which fails 4.5:1. Same hue, darkened only.
2. **Focus ring on dark surfaces uses gold `#fad164`, not maroon:** maroon on `#090909` is 2.2:1, below the 3:1 UI minimum. Gold is QNL's own on-dark hover colour.
3. **No "warm paper" exists on qnl.qa.** Its lightest panel `#f4f5f4` is neutral. I've kept it rather than invent a warm tint; say if you'd like a warm tint as a deliberate, flagged departure.
4. Gold, orange and `#c4c4c4` are **never** used as text on white (1.5:1, 1.7:1).
