# Search: QNL catalogue vs Concept G (gap analysis and spec)

Source: QNL's Encore catalogue (elibrary.qnl.qa), reviewed in a signed-out browser on 24 Nov 2026. Covers Advanced Search, a "Doha" search (1,995 results), one book record and the login page. My Account was not reviewed because it needs a sign-in. LibGuide: https://libguides.qnl.qa/advancedsearch/en

## 1. What the catalogue offers today

### Advanced Search
- **Search rows:** each row has a field dropdown (Keyword · Title · Subject · Author) and a term box.
  - Row 2 always starts with a fixed "AND".
  - "Add boolean: AND · OR · NOT" adds rows, and each added row has a remove button.
- **Format** (25 values, catalogue codes as shown): ANY · 2-D GRAPHIC · 3-D OBJECT · AUDIO FILE · BLUE RAY · BOOK · CDROM · DATABASE · DIGITAL FILMS · DIGITAL IMAGE · DVDROM · E-BOOK · E-JOURNAL · MANUSCRIPT · MIXED MATERIAL · MS MAP · MUSIC RECORD · No Code · NOTATED MUSIC · PERIODICAL · PRINT MAP · PROGRAM · RESOURCE · Thesis · VIDEO FILES
- **Location** (13 values), which includes partner institutions:
  - Carnegie Mellon University-Qatar · Georgetown University Qatar · Doha Institute for Graduate Studies · Translation and Interpreting Institute · Dar Al-Kutub
  - QNL locations: Children Library · Heritage Library · Main Compact Legal Deposit · Main General Collection · Main General Graphic Novels · Teens Section · Qatar National Library
- **Language:** ANY · Arabic · English · French · German · Italian · Portuguese · Spanish (7 values)
- **Collection:** ANY · CMU-Q · Dar Al-Kutub · Doha Institute · Heritage Collection · Qatar National Library · QNL · Translation and Interpreting Institute
- **Year:** two free-text boxes ("Year: [ ] to [ ]")
- **Buttons:** Search · Reset search

### Results page
- 25 per page, numbered pages.
- **Sort:** Relevance · Date · Title · Author
- **Filters:** every change reloads the page. Each shows 5 values, then "more >" opens a pop-up with checkboxes.
  - **Found in:** Title / Subject / Author
  - **Format**
  - **Location:** 13+ values. Partner holdings dominate: Doha Institute has 1,216 of the 1,995 "Doha" results.
  - **Language:** 14 values, more than the Advanced form offers.
  - **Tag:** about 200 subject tags, collapsed by default.
  - **Publish Date:** "YYYY to YYYY" with "apply".
  - **Place:** many duplicate spellings, e.g. Dawḥah · Doha · Dawhah · Ad Dawhah · Ad Dawḩah · Dawòhah · Ad Dawdhah.
- **Related searches:** established terms plus a long keyword cloud.
- **Each result shows:**
  - a Hold button
  - actions: Add to list · Email · Export to RefWorks · Export to EndNote · Add a Tag
  - availability ("Available at [location] ([call no.])", "+1 more / see all")
  - an items table (Location · Call No. · OPAC MSG · Status) with an "only show available" toggle
  - where they apply: Map it · Summary · Copies on order · cover

### Record page
- **Header:** title and author, format | author | year | edition, availability, and the same actions as on results.
- **Items table:** e.g. Main Compact Legal Deposit · DS247.Q32 W66 2025 · "Check User Services Desk" · LIBRARY USE ONLY.
- **Copies on order** (e.g. "2 copies ordered … on 19-02-2026").
- **Details:** Edition · Description · Publication · Subjects (linked) · Added title · ISBN.
- **Enrichment:** Syndetics summary · reader reviews · Browse Shelf carousel · e-resources banner.
- **Sidebar:** previous/next result · classic catalogue · Explore · MARC view · "Recently added".

### Account (login page only)
- **Login:** Membership No. or Qatar ID, plus PIN. Create account · Forgot PIN · EN/AR switch.
- **Signed out:** "My List" works as a session-only cart. Hold needs a login.
- **Not reviewed:** loans, renewals, holds, saved searches, history and alerts.

### Searched elsewhere
- Articles: EBSCO Discovery Service, a separate login.
- Databases: an A–Z list on LibGuides.

## 2. Problems we can fix

1. **Two search boxes, two logins, two result sets.** Catalogue and articles (EDS) are separate, so users have to know which system holds what.
2. **The filters mix internal codes with plain language.** Format names are catalogue codes ("BLUE RAY", "No Code", "2-D GRAPHIC"), and Location and Collection overlap.
3. **Partner holdings swamp QNL's own.** Results can't be limited to "at QNL" or "available now" except item by item.
4. **Place names are split across spellings.** Arabic place names romanised several ways (Dawḥah / Doha / Ad Dawhah …) each get their own count.
5. **Every filter click reloads the page.** Filters hide behind "more" pop-ups, and Tag has about 200 values.
6. **The Advanced form is rigid.** Row 2 is fixed to AND, Year is free text with no checking, and Language has 7 options while the results show 14.
7. **No citation (APA/MLA/Chicago), permalink/share, RIS or BibTeX.** The saved list only lasts for the session when signed out.
8. **Availability is buried.** "Library use only" and "check desk" sit in a table rather than leading with what the visitor can do next.

## 3. Concept G: what exists and what's needed

| Capability | Catalogue | Concept G now | Plan |
|---|---|---|---|
| Keyword search, type-ahead | Keyword only | ✓ grouped type-ahead, synonyms, typo tolerance, Arabic normalisation | Keep |
| Search a field (Title, Author, Subject) | ✓ | ✗ | Advanced builder + `title:` `author:` `subject:` `isbn:` syntax |
| AND / OR / NOT, "exact phrase" | ✓ (rows) | ✗ (implicit AND, falls back to OR) | Builder + inline syntax, parsed into removable tags |
| Format | 25 codes | Type groups (6) | ~10 plain-language groups mapped from the codes (below) |
| Location / Collection | 13 + 8, overlapping | ✗ | One "Where": QNL locations, then partner libraries |
| "At QNL only" / "Available now" / "Online" | ✗ (items table only) | ✗ | Three toggles above the results |
| Language | 7 (form) / 14 (facet) | ✓ EN/AR | Built from the data, with counts |
| Year range | Free text | Events date filter only | Range with validation, plus a small results-by-year chart |
| Found in | ✓ | ✗ | Becomes field search |
| Subjects / Place | Tag ~200, Place with duplicate spellings | Tags (curated) | Top 8 + type-to-filter; spelling variants grouped (see §4) |
| Sort | Relevance · Date · Title · Author | Relevance · Newest · A–Z | Add Oldest · Author |
| Instant filters, no reload | ✗ | ✓ (and plain links without JS) | Keep |
| Articles in the same search | ✗ (separate EDS) | ✗ | "Everything" view: catalogue, articles, website and events side by side, each with "see all" |
| Hold | ✓ | Link only | Main action on the card when signed in (needs the catalogue's API) |
| Save / list | Session list | ✗ | Save (local; synced when signed in) |
| Cite | ✗ | ✗ | APA · MLA · Chicago · Harvard, copy with one click |
| Export | RefWorks · EndNote | ✗ | RIS · BibTeX · EndNote · RefWorks |
| Share / permalink | ✗ | URLs are shareable | Copy-link on each record |
| Availability | Items table | Sample status | Status first ("Available · Main General Collection · shelf DS247…") + Map it |
| Copies on order, summary, cover, shelf browse | ✓ (Syndetics) | Partial (summary) | Phase 2 enrichment |
| Saved searches / alerts | Not seen | ✗ | Phase 2 (needs account) |
| Bilingual interface | EN/AR switch | ✓ full RTL | Keep; add romanised ↔ Arabic matching |

### Proposed Format groups (from catalogue codes)
- Books ← BOOK
- eBooks ← E-BOOK
- Journals & magazines ← PERIODICAL, E-JOURNAL
- Theses ← Thesis
- Images & photographs ← 2-D GRAPHIC, DIGITAL IMAGE
- Film & video ← DIGITAL FILMS, VIDEO FILES, DVDROM, BLUE RAY
- Music & audio ← AUDIO FILE, MUSIC RECORD, NOTATED MUSIC
- Maps ← PRINT MAP, MS MAP
- Manuscripts & archives ← MANUSCRIPT, MIXED MATERIAL
- Objects ← 3-D OBJECT
- Databases & software ← DATABASE, CDROM, PROGRAM, RESOURCE

"No Code" is hidden from the filter.

## 4. Search quality: Arabic and romanised names
- Fold romanisation marks before matching (ḥ→h, ḩ→h, ò→o, ʻ/ʼ dropped), and strip a leading "Ad "/"Al-" for place matching. "Dawḥah", "Ad Dawhah" and "Dawhah" then become one term.
- Cross-script equivalents in the synonym table: Doha ↔ Dawḥah ↔ الدوحة · Qatar ↔ قطر.
- Filters show one preferred label, e.g. "Doha (الدوحة)", with the combined count.

## 5. Build plan (prototype, using clearly marked sample records)
1. **Sample catalogue data:** about 40 records with format code, location, collection, language, year, call number, item status and ISBN, all labelled SAMPLE.
2. **Query parser:** quoted phrases, AND/OR/NOT (plus Arabic و / أو / ليس), and the `title:` `author:` `subject:` `isbn:` `year:` prefixes. The parsed query shows as removable tags.
3. **`/search/advanced` and `/ar/search/advanced`:**
   - rows with a field dropdown and term, an AND/OR/NOT toggle between rows, "+ Add row"
   - Format, Where, Language and Collection as checkbox groups
   - a year range
   - scope: Everything / Catalogue / Articles / Website
   - a live result count
   - it builds a normal `/search?...` URL, so it works without JavaScript
4. **Results page:**
   - the three toggles (At QNL · Available now · Online)
   - the filters from §3 with counts; Year as a range with a small chart
   - an "Edit advanced search" link
5. **Result card and record page:**
   - status first, with a main action that depends on the item (Place hold / Read online / Library use only + Map it)
   - Save · Cite · Export · Share
   - holdings table with "only available"
6. **Production hookup:** `DiscoveryApiAdapter` connects to the catalogue's API and to the EDS API, and the interface stays the same. QNL IT to confirm which catalogue API is available.
