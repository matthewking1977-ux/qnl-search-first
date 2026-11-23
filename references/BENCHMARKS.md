# Benchmarks: patterns adopted

Captured 23 Nov 2026 with Playwright (1440×900 desktop fold + one scroll, 390×844 mobile fold) into `references/benchmarks/<site>/`.
We adopt **patterns only**: no layouts, copy, imagery or branding are copied.

| Site | Captured | Pattern adopted for Concept G | Where it lands |
|---|---|---|---|
| **British Library** (bl.uk) | ✓ | Short, flat top nav (Collection · What's on · Visit · Stories) and the **"Everything for…" audience hubs** (Research / Business / Schools). Calm, content-first restraint; free-entry line under the welcome. | Our five-item nav; the sentence builder's audience list; restrained hero copy. |
| **National Library of Scotland** (nls.uk) | ✓ | Serif display line over a single strong colour field; "Tools for research" sitting in the main nav next to visitor items, so **first-timers and experts share one header** without either being demoted. | "Research and learning" band kept on the homepage, not hidden in a submenu. |
| **National Library of Ireland** (nli.ie) | ✓ | **One search across catalogue and site** directly under the title, with a single Search button. Events listed as image cards with date, time and place in a fixed order. | Hero search bar (one box, chips under it); What's on card anatomy (date → title → place). |
| **National Library of Australia** (library.gov.au) | ✓ | "What can we help you find?" with a **Website / Catalogue scope switch** and a quiet "Not sure where to start? Ask a librarian" line under the box. | Two search modes + the zero-results "Ask a librarian" escape hatch; helper line under the bar. |
| **State Library Victoria** (slv.vic.gov.au) | ✓ (fold shows the full-screen Acknowledgement of Country intro; below-fold content didn't render in headless capture) | Editorial collection storytelling alongside services; a respectful, unhurried first screen. | "From the collections" feature + three items, each with a one-line story. |
| **National Gallery, London** (nationalgallery.org.uk), parent of *Imaginarium* | ✓ (homepage; the Imaginarium microsite was not reachable as a standalone URL) | Image-first institution with a single yellow "Plan your visit" call to action, a **visible pause control on hero media**, and opening hours shown right at the fold. | Hero pause control placement; Today strip (open until…) at the fold. |
| **National Gallery of Art** (nga.gov) | ✗ 403 bot-protection page; not bypassed | Not captured. From the brief: image-led editorial layout, confident type hierarchy. | Section headline scale (Newsreader 32–52). |
| **Getty** (getty.edu), parent of *Tracing Art* | ✓ (homepage; hero video renders black in headless capture) | "What we do" three-column links, each with one line of help and a plain text link. Motion only where it serves content. | "Research and learning" as three links with one line each. |
| **London Museum** (londonmuseum.org.uk) | ✓ | Big confident statement + clear location/opening cards; storytelling tone. Reference for **AI-linked objects/stories** (brief) → our related-topic tags and the Phase 2 "Ask" state. | Related-topic tags on collection cards; Ask-mode explanatory panel. |
| **Mathaf Encyclopedia** | – | Removed from scope at the client's request. | – |

## Patterns we will *not* adopt
- Full-screen intros or scroll-to-continue gates (SLV, London Museum): they conflict with "search first".
- Auto-advancing carousels (National Gallery's exhibitions slider): excluded by the brief.
- Large saturated colour fields as brand (NLS navy, London Museum mint): we stay with QNL's traced palette.
