# Phase 7: audit report

## Lighthouse 13.6 (mobile, simulated slow 4G + 4× CPU)
Production build served locally with Brotli and long-lived caching for hashed assets (`scripts/serve-static.mjs`), three runs per page. Full HTML reports are in `docs/audit/`.

| Page | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS | Transfer |
|---|---|---|---|---|---|---|---|---|---|
| EN `/` (runs) | 100 / 99 / 100 | 100 | 100 | 100 | 0.80 s | **0.80 s** | 42–144 ms | **0.026** | 207 KB |
| AR `/ar/` (runs) | 99 / 99 / 99 | 100 | 100 | 100 | 0.82 s | **0.82 s** | 125–144 ms | **0.004** | 197 KB |

Targets: Performance ≥ 95 ✓, Accessibility 100 ✓, Best Practices ≥ 95 ✓, SEO 100 ✓, LCP < 2.0 s ✓, CLS < 0.05 ✓.
The LCP element is the hero poster image (`hero-poster-960.avif`, 31 KB), never the video.

### What it took (first run → final)
The first run scored EN 88 / AR 95, with LCP 2.6 s, TBT 350 ms and CLS 0.046.
1. **Arabic fonts subset** to Modern Standard Arabic: 211 KB → 63 KB for four files, and every Arabic character on the site is still covered.
2. **English pages no longer download the Arabic fonts.** A 3 KB micro-font covers the «العربية» language switch.
3. **Metric-matched fallback fonts** for Roboto and Newsreader (size-adjust and ascent/descent overrides computed from the font files), so the font swap doesn't shift layout.
4. **Hero changes:**
   - No backdrop blur over the video (it repainted every frame).
   - The pause button reserves its space before JavaScript runs.
   - The mobile hero has a stable height.
   - **Phones show the poster and a Play button instead of autoplaying 1.2 MB of video.**
5. **Search prefetch at idle now only downloads the chunks.** The index is built on first focus, hover or keystroke.

## Interaction (INP proxy), Pixel 7 emulation, 4× CPU throttling
Measured with the Event Timing API while typing a query, using the What's on filters, the sentence-builder listbox and the pause button.

| Page | Worst interaction | p98 (≈ INP) |
|---|---|---|
| EN | keydown in search 136 ms | **136 ms** (target < 150 ms ✓) |
| AR | filter chip click 88 ms | **88 ms** ✓ |

Type-ahead, keystroke to rendered panel:
- **Desktop:** max 37 ms, p95 20 ms over 50 keystrokes.
- **Throttled phone:** median about 25 ms, average about 30 ms; one keystroke at 108 ms. That was the second letter of the query, when the grouped results panel first renders; the engine took 7 ms of it.
- The ≤ 100 ms target is met on desktop and on all but that one throttled-mobile keystroke.

## Accessibility
- axe-core 4 (WCAG 2.0/2.1/2.2 A + AA, plus best practice): **0 violations** across 14 EN page types (home, search results including zero results and filtered states, items of every type, accessibility statement, newsletter, style guide) and all 18 AR pages and states (Phase 6).
- Keyboard, combobox/listbox patterns, live regions, reduced motion and the pausable video were verified in earlier phases.

## Without JavaScript
- Navigation, every section, all links and the hero poster work.
- Search submits to `/search` (server-rendered on Vercel), with filters and sorting as plain GET forms.
- The newsletter form submits without sending the email address.
- 102 internal links on the two homepages resolve, with none broken.

## Weight
- First-load JS on the homepage is about 18 KB gzip. The search chunk (about 22 KB gzip) loads lazily.
- Fonts are self-hosted and subset. Only Roboto 400 and 500 are preloaded.

## Not run
- **WebPageTest:** it needs the public URL and a WebPageTest account or API key, and the site can't be reached from this environment until it's deployed. I'll run it, or send the URL, once deployed.

## Deployment
Blocked on a one-time permission: the Vercel GitHub integration isn't installed for `matthewking1977-ux/qnl-search-first`. See the summary message for the steps.
