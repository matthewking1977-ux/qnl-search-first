# Search deep dive: evidence

**Purpose:** evidence for the QNL-RFQ-90 technical proposal. This document records only what was observed or measured. Anything not checked is marked **[NOT CHECKED]** with the reason. No figure here is an estimate.

**When:** 24 November 2026 (UTC). Timestamps in the kept raw data run from 13:04 (first Lighthouse run) to 13:50 (last axe run). A first capture pass from 13:00 was superseded (see the correction below).

**Who and how:**
- Claude (Claude Code), in a cloud sandbox in the US-East region (Cloudflare reported "Ashburn").
- Playwright 1.63.0 with Chromium, headless, default user agent, nothing disguised.
- axe-core 4.14.1 (WCAG 2.0/2.1/2.2 A and AA rules).
- Lighthouse 13.6.0, mobile preset (simulated slow 4G, 4× CPU).

**Viewports:** desktop 1440×900, mobile 390×844 (touch).

**Network conditions:**
- The sandbox reaches the internet through an allow-list proxy that speaks **HTTPS only**.
- Hosts were added to the allow-list as needed. Analytics and tracking hosts stayed blocked: Google Analytics, DoubleClick, Hotjar, Cloudflare Insights, Google Tag Manager.
- Their bytes are therefore **not** in any page-weight figure below, so the real weights are at least as large.
- Plain `http://` links could not be followed from the sandbox; they are marked [NOT CHECKED].

**Raw data (in this repo):**
- `docs/audit/current/qnl-site-search-matrix.json`
- `qnl-journeys.json`
- `qnl-accessibility.json`
- `qnl-lighthouse-mobile.json`
- `concept-g-same-queries.json`
- `concept-g-journeys.json`

**Screens:** `docs/screens/current/` (QNL today) and `docs/screens/concept-g/` (Concept G prototype). Names follow `page-device-lang.png`.

**Correction during testing:** the first capture pass ran before QNL's icon and style CDNs (cdnjs, LibGuides static assets, Bootstrap CDN) were allowed. It made two things look broken that are not:
- the mobile search trigger looked blank;
- LibGuides rendered unstyled.

All screenshots, Lighthouse runs and axe results below come from the **second pass**, with those hosts reachable. Nothing from the first pass is relied on.

---

## 1. Session dump: findings not already in SEARCH_GAP_ANALYSIS.md or the PHASE reports

### 1.1 The catalogue's advanced-search LibGuide
`https://libguides.qnl.qa/advancedsearch/en`, fetched with curl: HTTP 200, 47,191 bytes.

- **Page facts:**
  - Title: "Home - Conduct an Advanced Search in QNL Catalog - All Guides at Qatar National Library".
  - `guide_id` 1286257.
  - "Last Updated: Jul 1, 2025 2:57 PM".
  - Footer: "All copyrights reserved 2020".
- **It confirms two separate search systems, in QNL's own words:** the advanced options "are applicable to the Library's catalog search, but does not apply to the discovery search across the online resources or databases".
  - For articles it says "To search for academic articles, use this link". The link is `https://search-ebscohost-com.eres.qnl.qa/login.aspx?profile=eds&authtype=ip`.
- **Catalogue start URL given:** `https://elibrary.qnl.qa/iii/encore/?lang=eng`.
- **Other links:**
  - Interlending and Document Supply: `https://www.qnl.qa/en/library-services/dds/about`.
  - "Suggest a Book or eResource": `http://qnl-qa.libwizard.com/…`.
  - A–Z Databases: `https://libguides.qnl.qa/az.php`.
  - An Arabic version of the guide.
- **Seven step-by-step screenshots** (hosted on `libapps.s3.amazonaws.com`) show the Encore advanced form independently of the browser-extension session in 1.3:
  - Keyword / Title / Subject / Author;
  - "Add boolean: AND OR NOT";
  - Format, Location, Language and Collection limits with "+";
  - Year from–to;
  - "Search" and "Reset search".
- **Spelling errors in the guide text as served:** "wide rainge", "narrow or spicify it", "this search will be applyed".

### 1.2 The catalogue blocks automated access
- **To curl:** `https://elibrary.qnl.qa/iii/encore/?lang=eng` returned HTTP 403 (5,512 bytes) with the page text "Just a moment... Enable JavaScript and cookies to continue".
- **To headless Chromium:** HTTP 403, title "Just a moment...", text "Performing security verification". This happened on every catalogue URL, including the search hand-off from qnl.qa.
- **I did not try to get past this check.** As a result, every direct measurement of catalogue results (counts, availability, record pages, speed) is **[NOT CHECKED]**.
- **Lighthouse on elibrary.qnl.qa:** all six runs, over two passes, measured the 403 check page:
  - main document status 403;
  - failed requests to `challenges.cloudflare.com`.

  Its scores are therefore **not** catalogue scores, and are listed only for completeness in 2.8.
- **Consequence for the tender:** any automated monitoring, accessibility testing or performance budget on the catalogue will need an allow-listed test identity from QNL.

### 1.3 Catalogue observations from the user's own browser session
**Source:** the user's own browser session (the Claude in Chrome extension), 24 Nov 2026, relayed into this session as text.

**These were not observed by me: [NOT CHECKED] by me**, because the catalogue blocks automated access (1.2). Only items absent from SEARCH_GAP_ANALYSIS.md are listed.

**"Doha" in Encore:** 1,995 results, 25 per page.
- **Found In:** Title 324 · Subject 193 · Author 85.
- **Format:** Book 1,222 · Thesis 295 · 2-d Graphics 251 · eBooks 122 · Digital Films 61 · Manuscripts 21 · Periodicals 15 · Print Maps 5 · Audio Files 2 · Mixed Materials 1.
- **Location:**
  - QNL locations: Main Compact Legal Deposit 245 · Main General Collection (QNL) 219 · Heritage Library (QNL) 296 · QNL Online Collection 114 · Qatar National Library 20 · M.F. Husain 18 · Children Library (QNL) 7 · Main Mshreib Non Fiction 6 · Teens Section (QNL) 5 · House of Wisdom Library 2 · Main Heritage Office General 1 · QNL Book Club 1.
  - Partner: Doha Institute for Graduate Studies 1,216.
- **Language:** Arabic 1,111 · English 820 · French 80 · Malayalam 3 · ten more languages with 1 each (German, Indonesian, Italian, Latin, Nepali, Persian, Russian, Sinhalese, Spanish, Tamil).
- **Doha is split across spellings in two facets:**
  - Place: "Dawḥah" 58 and "Doha" 6, plus single-count "Dawòhah", "Ad Dawdhah", "Ad Dawhah", "Ad Dawḩah".
  - Tag: "dawḥah" 42, "doha" 5, "dawhah" 4.
- **The Advanced Search Location list and the results' Location facet disagree.** The facet shows locations the form does not offer: House of Wisdom Library, M.F. Husain, Main Mshreib Non Fiction, QNL Book Club and QNL Online Collection.
- **Results page notice, verbatim:** "Selecting or deselecting a search filter will reload your page."

**Record example:** "Doha travel guide 2025: a comprehensive handbook… / Zack C. Wooten".
- **Items row:** "Main Compact Legal Deposit · DS247.Q32 W66 2025 · Check User Services Desk · LIBRARY USE ONLY".
- **Copies on order:** "2 copies ordered for Main Compact Legal Deposit on 19-02-2026".
- **Page features:**
  - "Catalog enrichment powered by Syndetics Unbound";
  - "Reader Reviews: Be the First to Write a Review";
  - Browse Shelf;
  - sidebar links "View in classic catalog" and "View MARC display", and "Recently Added".

**Catalogue login page:**
- "Membership No. OR Qatar ID" plus PIN, with an embedded 1:23 video and an English/Arabic toggle.
- Behind the login: [NOT CHECKED] by anyone in this session.

---

## 2. qnl.qa site search: desktop (1440) and mobile (390), English and Arabic

### 2.1 Where the search box is, and how many actions it takes
| | Desktop 1440 (EN and AR) | Mobile 390 (EN and AR) |
|---|---|---|
| **Where** | In the header of every page, top end of the black bar: platform menu ("Catalog" by default), a box with placeholder "Search" / «بحث», and a "Search" / «بحث» button. Box at y = 64 px, visible on load. | Not visible on load. A magnifier-icon button (accessible name "Show search form", `button.search-block-trigger`) sits under the logo (`search-trigger-before-after-mobile-en.png`). Tapping it reveals the same menu and box at y = 131 px. |
| **Actions to results, default "Catalog"** | **3:** click box → type → click Search (or press Enter). | **4:** tap trigger → tap box → type → tap Search. |
| **Actions to results, "Website"** | **4:** click box → choose "Website" in the menu → type → Search. | **5:** trigger → box → menu → type → Search. |
| **Keyboard** | From the top of the page: **26 Tabs** to the platform menu, **27** to the box, **28** to the button (EN and AR). Enter in the box submits. | n/a (touch) |

Screens:
- Homepages: `j1-step0-home-desktop-en.png`, `-ar.png`, `j1-step0-home-mobile-en.png`, `-ar.png`.
- Mobile search open: `j1-step1-search-open-mobile-en.png`, `-ar.png`, and `search-trigger-before-after-mobile-en.png`.

### 2.2 Which system answers, and the hand-offs
The header form (`#qnl-search-form`) POSTs to `/{lang}/qnl-search/search`, which answers with a **302** to the chosen platform. The platform menu defaults to **Catalog**. Captured `Location` headers for "Doha" and «الدوحة»:

| Platform (menu value) | English: 302 → | Arabic: 302 → | What the user gets | Hand-off? |
|---|---|---|---|---|
| **Catalog** (3, default) | `https://elibrary.qnl.qa/iii/encore/search/C__SDoha?lang=eng&suite=def&fromMain=yes` | `…/C__Sالدوحة?lang=ara&suite=def&fromMain=yes` | Encore catalogue. Here: a 403 bot check (1.2). Results [NOT CHECKED]. | **Yes:** to elibrary.qnl.qa |
| **Online Resources** (2) | `https://search-ebscohost-com.eres.qnl.qa/login.aspx?authtype=ip&profile=eds&direct=true&lang=en&bQuery=Doha` | same, `lang=ar&bQuery=الدوحة` | A further 302 to `https://login.eres.qnl.qa/login?qurl=…search.ebscohost.com…` (proxy sign-in, see 4.1). Results [NOT CHECKED]: needs a library account. | **Yes:** to the eres proxy, then EBSCO |
| **Digital Repository** (0) | `http://ediscovery.qnl.qa/islandora/search/Doha?type=dismax` | `http://ediscovery.qnl.qa/ar/islandora/search/الدوحة?type=dismax` | **Plain HTTP link.** Over HTTPS the same URL returns 200: "Qatar National Library Digital Repository (beta version)". "Doha": **1 – 10 of 538**; «الدوحة»: **1 – 10 من 2,061**. | **Yes:** to ediscovery.qnl.qa |
| **Website** (4) | `https://www.qnl.qa/en/search/node?keys=Doha&selected_search_platform=4` | `https://www.qnl.qa/ar/search/node?keys=الدوحة&selected_search_platform=4` | qnl.qa's own results page (2.3). | No |

### 2.3 Results: website search (platform "Website")
Same strings typed into both language interfaces, plus Arabic-script versions in the Arabic interface.

Desktop and mobile returned **identical counts and top 3 for all 20 query/interface pairs**, so one table covers both. Counts come from the results heading ("(N hits)"). Top 3 are the first three result titles.

Desktop and mobile identical: **yes** (checked programmatically for every pair).

| Query | UI | Hits | Top 3 results (type · title) | Content-type filters shown |
|---|---|---|---|---|
| Doha | EN | 454 | 1. page · Libraries Lead Forum: Information for International Participants<br>2. subject-guides · Music > Music Ensembles and Concerts in Doha<br>3. page · About JLF Doha | Libraries (169) · News (130) · Events (87) · Website (35) · Research Institute (16) · Articles (8) · Subject Guides (8) · Online Resources (1) |
| books for toddlers | EN | 1799 | 1. page · Springer Nature Open Access Books<br>2. page · Books on Mental Health<br>3. page · Borrowing/Return/Renewal | Events (884) · News (582) · Website (81) · Subject Guides (73) · Libraries (66) · Online Resources (54) · Articles (27) · Science Book Forum (24) · Research Institute (8) |
| membership | EN | 182 | 1. page · Membership & Circulation Policy<br>2. page · Borrowing/Return/Renewal<br>3. article · Membership renewal and lost cards | Events (124) · News (32) · Website (15) · Articles (9) · Libraries (2) |
| opening hours | EN | 1215 | 1. page · Open Initiative Award<br>2. page · Open Access Program<br>3. page · Libraries Lead Forum 2025 - Agenda | Events (643) · News (272) · Libraries (128) · Website (105) · Subject Guides (29) · Online Resources (17) · Articles (16) · Research Institute (3) · Science Book Forum (2) |
| Arabic title, misspelt: «موسم الهجره الي الشمل» (correct: «موسم الهجرة إلى الشمال») | EN | 11 | 1. page · ABC of Arabic<br>2. eventilla-events · Innovation Station Experience: Learn, Capture, and Create (Teen Photography)<br>3. eventilla-events · On NSD, Walk and Read with Author of (How to Be an Iron Man) | Events (8) · News (1) · Website (1) · Science Book Forum (1) |
| Control: the same title spelt correctly «موسم الهجرة إلى الشمال» | EN | 5 | 1. page · Qalamy Audio Stories<br>2. news · مكتبة قطر الوطنية تمثل الشرق الأوسط في الشبكة العالمية للإتاحة الحرة<br>3. page · Arabic Calligraphy Contest | Events (2) · Website (2) · News (1) |
| Romanised Arabic name: "Al-Mutanabbi" | EN | **0** | – | – |
| Control: the same name in Arabic «المتنبي» | EN | **0** | – | – |
| Doha | AR | 21 | 1. page · test<br>2. page · المجموعات الرقمية بالمكتبة<br>3. page · برنامج فعاليات مهرجان جايبور - الدوحة | Libraries (12) · الأخبار (3) · الموقع (3) · Research Institute (2) · المصادر الإلكترونية (1) |
| books for toddlers | AR | 72 | 1. page · كتب عن الصحة النفسية<br>2. online-databases · قاعدة بيانات "كتب ديجرويتر الإلكترونية"<br>3. eventilla-events · المصدر الإلكتروني "أوفردرايف": دليلك لقراءة الكتب الإلكترونية والاستماع للكتب الصوتية | الفعاليات (53) · المصادر الإلكترونية (10) · الموقع (4) · Libraries (3) · مقالات (2) |
| membership | AR | 12 | 1. eventilla-events · اكتشف ما نوفّره لك! جلسة تعريفية حول مزايا عضوية المكتبة<br>2. eventilla-events · اكتشف ما نوفّره لك! جلسة تعريفية حول مزايا عضوية المكتبة<br>3. eventilla-events · اكتشف ما نوفّره لك! جلسة تعريفية حول مزايا عضوية المكتبة | الفعاليات (12) |
| opening hours | AR | 1 | 1. news · مكتبة قطر الوطنية تفتتح رسميًا المعرض الرقمي لفن ملصقات السينما العربية | الأخبار (1) |
| Arabic title, misspelt: «موسم الهجره الي الشمل» (correct: «موسم الهجرة إلى الشمال») | AR | 2609 | 1. page · الأسئلة الشائعة<br>2. page · برنامج فعاليات مهرجان جايبور - الدوحة<br>3. page · استكشف قسم اليافعين | الفعاليات (1517) · الأخبار (588) · الموقع (175) · Libraries (118) · أدلة الموضوعات (107) · المصادر الإلكترونية (41) · مقالات (39) · Science Book Forum (20) · Research Institute (4) |
| Control: the same title spelt correctly «موسم الهجرة إلى الشمال» | AR | 2620 | 1. page · شروط وأحكام استخدام منصة منارة<br>2. page · الأسئلة الشائعة<br>3. page · منتدى المكتبات في الصدارة 2026 - البرنامج | الفعاليات (1673) · الأخبار (561) · الموقع (162) · أدلة الموضوعات (78) · المصادر الإلكترونية (55) · مقالات (38) · Libraries (25) · Science Book Forum (17) · Research Institute (11) |
| Romanised Arabic name: "Al-Mutanabbi" | AR | **0** | – | – |
| Control: the same name in Arabic «المتنبي» | AR | **0** | – | – |
| «الدوحة» | AR | 447 | 1. subject-guides · الموسيقى > الفرق والحفلات الموسيقية في الدوحة<br>2. page · منتدى المكتبات في الصدارة: معلومات للمشاركين من خارج دولة قطر<br>3. online-databases · معجم الدوحة التاريخي للغة العربية | Libraries (187) · الأخبار (119) · الفعاليات (60) · الموقع (34) · Research Institute (31) · مقالات (8) · أدلة الموضوعات (7) · المصادر الإلكترونية (1) |
| «كتب للأطفال الصغار» | AR | 3544 | 1. page · منتدى المكتبات في الصدارة 2026 - البرنامج<br>2. page · الأسئلة الشائعة<br>3. page · العضوية وسياسة الاستعارة | الفعاليات (2161) · الأخبار (640) · الموقع (267) · Libraries (213) · أدلة الموضوعات (99) · المصادر الإلكترونية (83) · مقالات (58) · Science Book Forum (14) · Research Institute (9) |
| «العضوية» | AR | 98 | 1. page · العضوية وسياسة الاستعارة<br>2. page · الاستعارة والإعادة والتمديد<br>3. page · العضوية | الفعاليات (46) · الأخبار (27) · الموقع (12) · مقالات (8) · أدلة الموضوعات (4) · المصادر الإلكترونية (1) |
| «مواعيد العمل» | AR | 706 | 1. page · ساعات العمل والموقع<br>2. page · مسابقة الخط العربي<br>3. article · معلومات أساسية | الفعاليات (275) · الأخبار (225) · Libraries (74) · الموقع (54) · أدلة الموضوعات (32) · Research Institute (26) · مقالات (12) · Science Book Forum (5) · المصادر الإلكترونية (3) |

**Where the obviously right page actually ranks.** I read result pages in order until the page appeared, up to 100 results:
- **"opening hours" (English):** "Hours and Location" (`/en/library-hours`) is **result 19**, on page 2.
- **"membership" (English):** "Become a Member" (`/en/library-services/become-a-member`) is **not in the first 100 results**.
  - Result 1 is "Membership & Circulation Policy".
- **«العضوية» (Arabic):** the first `become-a-member` URL is result 15, «سجّل عضويتك في سبتمبر!» (`/ar/library-services/become-a-member/sign-up-month`). That's a sign-up-month sub-page, not the Become a Member page.
- **«مواعيد العمل» (Arabic):** «ساعات العمل والموقع» (`/ar/library-hours`) is **result 1**.
- **"books for toddlers" (English):** neither the picture-books page (`/parents-and-educators/children-library/picture-books`) nor any `children-library` URL appears in the first 100 results.

**Catalogue, articles and repository results for these queries:**
- **Catalogue (default platform):** [NOT CHECKED]. Every query is handed to Encore, which returns the 403 check (1.2).
- **Articles:** [NOT CHECKED]. Requires a library account (4.1).
- **Repository:** only "Doha" and «الدوحة» checked (2.2).

### 2.4 What happens with zero results
- **Seen on:** website search, for "Al-Mutanabbi" and «المتنبي».
- **English and Arabic interfaces alike:** a single line, **"No result found for your search, please try another keyword."**, with no suggestions, no spelling help, no alternative platforms and no route to a librarian. Text identical on desktop and mobile.
- **Arabic interface: the message is in English.** The breadcrumb also reads "Search Results" in English (`search-romanised-desktop-ar.png`).
- **Both spellings of al-Mutanabbi (one of the best-known classical Arabic poets) returned 0** on the website search. That's the romanised "Al-Mutanabbi" and the Arabic «المتنبي».
  - Whether the **catalogue** holds his works: **[NOT CHECKED]** (bot check, 1.2).
- **Catalogue, EDS and repository zero-results pages:** [NOT CHECKED].
- **Screens:** `search-romanised-{desktop,mobile}-{en,ar}.png`, `search-romanised-control-{desktop,mobile}-{en,ar}.png`.

### 2.5 Does the language stay the same throughout?
**English interface:** English throughout qnl.qa.

**Arabic interface on qnl.qa:** right-to-left with `lang="ar"`. It mixes in English, though:
- **Zero-results message** in English (2.4).
- **Breadcrumb** "Search Results" in English.
- **Content-type filter labels** partly English: "Libraries", "Research Institute" and "Science Book Forum" appear next to Arabic labels such as «الأخبار» and «الفعاليات» (2.3 table).
- **Hidden labels** on the search controls are English on the Arabic page: "Select a search platform" and "Search Key Words" (2.8). A screen-reader user on the Arabic site hears English labels.

**Arabic-interface quality issues:**
- Its top result for "Doha" is a page titled **"test"** (`/ar/node/13618`).
- Its top three for "membership" are the **same event title three times** («اكتشف ما نوفّره لك! جلسة تعريفية حول مزايا عضوية المكتبة», three different event URLs).

**Hand-offs carry the language** in the URL:
- Encore: `lang=eng` / `lang=ara`.
- EDS: `lang=en` / `lang=ar`.
- Repository: `/ar/`.

**What the user then sees:**
- **Encore:** [NOT CHECKED] (bot check).
- **EDS login:** one bilingual page for both languages, no `lang` attribute (4.1).
- **Repository, Arabic interface:**
  - Arabic headings, but English "Skip to main content" and "Show more";
  - English subject terms on Arabic results;
  - the availability label «متوفر داخل المكنبة» is misspelt (المكنبة for المكتبة).
- **LibGuides Arabic:** a different domain, declaring `lang="en"` (4.2).

### 2.6 Can you filter or sort?
- **Website search:**
  - **Filter:** content type only ("Libraries", "News", "Events", "Website", "Research Institute", "Articles", "Subject Guides", "Online Resources", "Science Book Forum"), shown as links with counts.
  - **Sort:** no control found (searched the page for sort, relevance, newest and «ترتيب»: none).
  - **Pagination:** 10 per page, numbered.
- **Digital repository:**
  - **Sort By:** Title · Language · Date.
  - **Filters:** Subject, Period, Language, Collection.
  - **Advanced Search:** "Add Criteria".
  - The Language filter shows raw codes ("ara", "eng", "fre", "mul", "und") and fragments ("h", "lis").
- **Catalogue:** filters and sort as described in SEARCH_GAP_ANALYSIS.md, from the browser-extension session; not checked by me.

### 2.7 Speed: Lighthouse, mobile preset
Three runs per URL, with only the analytics and tracking hosts listed above blocked. Values are as reported, not averaged.

| Page | Run | Perf | A11y | Best pr. | SEO | FCP | LCP | TBT | CLS | Transfer |
|---|---|---|---|---|---|---|---|---|---|---|
| qnl.qa homepage (EN) | 1 | 57 | 91 | 77 | 83 | 1.7 s | 24.4 s | 330 ms | 0 | 8,234 KB |
|  | 2 | 61 | 91 | 77 | 83 | 1.7 s | 22.5 s | 200 ms | 0 | 8,234 KB |
|  | 3 | 59 | 91 | 77 | 83 | 1.8 s | 22.0 s | 280 ms | 0 | 8,234 KB |
| qnl.qa homepage (AR) | 1 | 58 | 91 | 77 | 92 | 1.7 s | 25.4 s | 300 ms | 0 | 8,237 KB |
|  | 2 | 60 | 91 | 77 | 92 | 1.7 s | 26.1 s | 250 ms | 0 | 8,236 KB |
|  | 3 | 57 | 91 | 77 | 92 | 1.8 s | 21.9 s | 320 ms | 0 | 8,237 KB |
| Website search results: "Doha" (EN) | 1 | 72 | 84 | 77 | 83 | 1.7 s | 3.9 s | 550 ms | 0 | 997 KB |
|  | 2 | 76 | 84 | 77 | 83 | 1.8 s | 3.9 s | 440 ms | 0 | 995 KB |
|  | 3 | 75 | 84 | 77 | 83 | 1.8 s | 3.9 s | 490 ms | 0 | 997 KB |
| Website search results: «الدوحة» (AR) | 1 | 86 | 84 | 77 | 92 | 1.9 s | 1.9 s | 430 ms | 0 | 999 KB |
|  | 2 | 89 | 84 | 77 | 92 | 1.9 s | 1.9 s | 370 ms | 0 | 999 KB |
|  | 3 | 85 | 84 | 77 | 92 | 1.9 s | 1.9 s | 530 ms | 0 | 1,000 KB |
| elibrary.qnl.qa: **403 bot-check page, not the catalogue** | 1 | 57 | 94 | 96 | 40 | 1.0 s | 4.6 s | 1,580 ms | 0.003 | 392 KB |
|  | 2 | 59 | 94 | 96 | 40 | 1.0 s | 4.4 s | 1,490 ms | 0.055 | 385 KB |
|  | 3 | 60 | 94 | 96 | 40 | 1.0 s | 4.4 s | 1,390 ms | 0 | 394 KB |

- **Largest single download on the homepage:** one event image, `/sites/default/files/crm_events/b406e974-….jpg`, at **3,874 KB**. It came from the first pass; the second-pass homepage weight was 8,234–8,237 KB.
- **Homepage LCP element:** the "Become a Member" tile background (`nav#block-tilesmenu > div.tiles > a.tile > div.background`).
- **elibrary.qnl.qa:** as explained in 1.2, Lighthouse measured the 403 check page, not the catalogue. **Catalogue speed: [NOT CHECKED].**

### 2.8 Accessibility of the search
**Search form on qnl.qa, desktop, English and Arabic:**
- **Visible label:** **no.**
  - Both `<label>`s exist ("Select a search platform", "Search Key Words") but are `display: none`.
  - The box shows only the placeholder "Search" / «بحث».
  - The platform menu has **no accessible name** at all: axe `select-name`, critical, "Form element has explicit <label> that is hidden".
  - On the Arabic page both hidden labels are in English.
- **Keyboard:**
  - **Operable:** Tab reaches menu → box → button; Enter submits.
  - **Slow to reach:** 26–28 Tabs from the top of the page.
- **Visible focus:** **no** for the menu and the box, **yes** for the button.
  - Focused by keyboard (`:focus-visible` true), the menu and box have `outline: none` and a transparent box-shadow.
  - A pixel comparison of focused vs unfocused screenshots found **0 changed pixels** for both. The button shows an outline (`auto 5px`).
  - Evidence: `a11y-focus-search-desktop-en.png` shows menu, box and button each focused.
- **Mobile trigger:**
  - Has an accessible name ("Show search form", via a visually hidden span).
  - Has **no `aria-expanded` or `aria-controls`**, so a screen reader is not told that the form opened.

**axe-core 4.14.1** (WCAG 2.0/2.1/2.2 A and AA), second pass:

| Page | Rules failed | Nodes | Rules (impact, nodes) | On the search form? |
|---|---|---|---|---|
| `home-desktop-en` | 3 | 7 | aria-roles (critical, 1); link-name (serious, 5); select-name (critical, 1) | select-name: `#edit-selected-search-platform` |
| `home-desktop-ar` | 3 | 7 | aria-roles (critical, 1); link-name (serious, 5); select-name (critical, 1) | select-name: `#edit-selected-search-platform` |
| `home-mobile-en` | 3 | 7 | aria-roles (critical, 1); link-name (serious, 5); select-name (critical, 1) | select-name: `#edit-selected-search-platform` |
| `home-mobile-ar` | 3 | 7 | aria-roles (critical, 1); link-name (serious, 5); select-name (critical, 1) | select-name: `#edit-selected-search-platform` |
| `results-desktop-en` | 4 | 8 | aria-required-children (critical, 1); aria-roles (critical, 1); link-name (serious, 5); select-name (critical, 1) | select-name: `#edit-selected-search-platform` |
| `results-desktop-ar` | 4 | 8 | aria-required-children (critical, 1); aria-roles (critical, 1); link-name (serious, 5); select-name (critical, 1) | select-name: `#edit-selected-search-platform` |
| `results-mobile-en` | 3 | 7 | aria-required-children (critical, 1); aria-roles (critical, 1); link-name (serious, 5) | no |
| `zero-desktop-ar` | 3 | 7 | aria-roles (critical, 1); link-name (serious, 5); select-name (critical, 1) | select-name: `#edit-selected-search-platform` |
| `eres-login-desktop` | 3 | 5 | html-has-lang (serious, 1); label (critical, 2); link-name (serious, 2) | no |
| `libguides-az-desktop-en` | 3 | 12 | link-name (serious, 4); list (serious, 3); target-size (serious, 5) | no |

- The axe run on `results-mobile-en` was made with the mobile search form closed, so `select-name` does not appear there.
- The English and Arabic EDS login is one page; it was checked once (`eres-login-desktop`).
- **Lighthouse accessibility scores** (2.7) were 91 on both homepages and 84 on both results pages. Lighthouse ran on each page as loaded, which on mobile means with the search form closed.

---

## 3. Whole journeys: steps and system hand-offs
**Counting rules:**
- An **action** is a click, a tap, typing a query, or pressing Enter.
- Scrolling is not counted.
- A **hand-off** is a move to a different host or system.

### 3.1 QNL today

**Journey 1: find an available book and where it is.** Route: the header search, platform left on the default "Catalog", query "Doha" (typed the same in both interfaces).

| # | Desktop (EN and AR) | Mobile (EN and AR) | Where |
|---|---|---|---|
| 1 | Click the search box | Tap the search trigger | www.qnl.qa |
| 2 | Type "Doha" | Tap the search box | www.qnl.qa |
| 3 | Click Search → 302 to the catalogue (**hand-off 1**) | Type "Doha" | → elibrary.qnl.qa |
| 4 | – | Tap Search → 302 to the catalogue (**hand-off 1**) | → elibrary.qnl.qa |

- **What came back:** HTTP 403, "Just a moment… Performing security verification", on all four device/language combinations (`j1-step3-catalogue-handoff-desktop-{en,ar}.png`, `j1-step4-catalogue-handoff-mobile-{en,ar}.png`).
- **Counted:** 3 actions (desktop) and 4 (mobile) to reach the catalogue, with 1 hand-off.
- **Choosing an available copy and reading its location: [NOT CHECKED]**, because the catalogue blocks automated access (1.2). The total number of steps for this journey is therefore not known.

**Journey 2: find an e-book you can read online.** Route: the homepage tile "Online Resources" → "Ebooks, Audiobooks and Music" → "OverDrive (Libby)". This is one route among several; the search route ("Online Resources" platform → EDS) needs a library account (4.1).

| # | Action (desktop and mobile, EN and AR) | Where it lands |
|---|---|---|
| 1 | Click the "Online Resources" tile | `www.qnl.qa/{en,ar}/explore/online-resources` |
| 2 | Click "Ebooks, Audiobooks and Music" (**hand-off 1**) | EN: `libguides.qnl.qa/az.php?t=41275`; AR: `qnl.libguides.com/…` (a different domain) |
| 3 | Click "OverDrive (Libby)" (**hand-off 2**) | `libbyapp.com/library/qnl` |

- **Counted:** 3 actions and 2 hand-offs to reach Libby, on both devices and in both languages.
- **After step 3: [NOT CHECKED].** In the sandbox, Libby showed "Libby has encountered a problem… We could not contact our authentication service." This may be caused by the sandbox's network allow-list rather than by Libby, so it is not reported as a fault and the screenshots were not kept. Signing in, choosing a title and opening it were not counted.

**Journey 3: become a member.** Route: the homepage tile "Become a Member" → "18 AND OVER".

| # | Action (desktop and mobile) | Where it lands |
|---|---|---|
| 1 | Click the "Become a Member" tile | `www.qnl.qa/{en,ar}/library-services/become-a-member` (200) |
| 2 | Click "18 AND OVER" / «18 عامًا فأكثر» (**hand-off 1**) | EN: `https://registration.qnl.qa/registration/patron`; AR: `http://registration.qnl.qa/ar/registration/patron` |

- **English:** Cloudflare **520 "Web server is returning an unknown error"** (host `registration.qnl.qa` marked "Error") on every attempt, desktop and mobile:
  - five browser attempts between 13:48:22 and 13:49:27 UTC in the second pass (`qnl-journeys.json`);
  - four browser attempts between 13:16:59 and 13:17:30 UTC and one curl request at 13:21:06 UTC in the first pass (that raw data was overwritten; the times come from the session log).
  - In the same minutes the membership **renewal** form on the same host returned 200 ("Membership Renewal").
  - Screens: `j3-step2-registration-desktop-en.png`, `j3-step2-registration-mobile-en.png`.
- **Arabic:** the link is plain `http://`, which the sandbox cannot open. **[NOT CHECKED].**
- **Counted:** 2 actions and 1 hand-off to reach the registration form. Filling it in: **[NOT CHECKED]** (the form did not load).
- **By search instead:** "membership" on the website search does not return the Become a Member page in the first 100 results (2.3).

### 3.2 Concept G, same three journeys

Measured on the prototype (commit `ba1ab26`, run locally) at 13:22–13:24 UTC, on desktop 1440 and mobile 390, English and Arabic. Concept G uses sample records, so these are behaviour measurements, not catalogue results.

| Journey | Actions (desktop = mobile, EN = AR) | Hand-offs | What the user does | Ends on |
|---|---|---|---|---|
| Book and location | **3** | 0 | Click box → type "Gulf maritime history" / «التاريخ البحري للخليج» → Search | Results card already shows "Available · Main General Collection · DS326 .S26 2019 · All copies (2)" (`concept-g/j1-book-results-{desktop,mobile}-{en,ar}.png`) |
| E-book online | **5** | 0 | Click box → type "ebook" → Search → "Online" toggle → "Read online" / «اقرأ إلكترونيًا» | The record's access panel, `/item/ct-02#access` (`concept-g/j2-ebook-results-…`, `j2-ebook-online-toggle-…`, `j2-ebook-end-…`). *Reading itself is not built: there is no e-book platform behind the prototype.* |
| Membership | **4** | 0 | Click box → type "membership" / «العضوية» → Search → "Register now →" / «سجّل الآن →» on the answer card | "Become a member" / «انضم عضوًا» page (`concept-g/j3-membership-results-…`, `j3-membership-end-…`). *A registration form is not built.* |

### 3.3 Side by side

| Journey | QNL desktop | QNL mobile | QNL hand-offs | Concept G (both devices) |
|---|---|---|---|---|
| Book and location | 3 actions to the catalogue; rest **[NOT CHECKED]** | 4; rest **[NOT CHECKED]** | 1 so far | 3 actions, 0 hand-offs |
| E-book online | 3 actions to Libby; rest **[NOT CHECKED]** | 3; rest **[NOT CHECKED]** | 2 so far | 5 actions, 0 hand-offs |
| Membership | 2 actions to the form (EN: 520 error) | 2 (EN: 520 error) | 1 so far | 4 actions, 0 hand-offs |

The QNL numbers stop where the journey could not be followed, so they are **lower bounds, not totals**, and must not be presented as complete journey lengths.

---

## 4. Articles (EBSCO EDS) and LibGuides

### 4.1 Articles search (EBSCO Discovery Service)
- **How users reach it from qnl.qa:** choose "Online Resources" in the header platform menu and search.
  - That's 4 actions on desktop (box, menu, type, Search) and 5 on mobile (plus the search trigger).
  - qnl.qa answers with a 302 to `search-ebscohost-com.eres.qnl.qa/login.aspx?authtype=ip&profile=eds&direct=true&lang=…&bQuery=…`.
  - That URL answers with a 302 to `https://login.eres.qnl.qa/login?qurl=https://search.ebscohost.com/login.aspx?…`.
- **Separate login:** yes. The page title is "Qatar National Library", with one bilingual form:
  - "Barcode or Qatari ID: / رقم الباركود أو رقم البطاقة القطرية";
  - "PIN: / كلمة المرور";
  - a "Login/دخول" button;
  - links "Create an account | Forget Your PIN? | Home" in both languages.
  - The fields' labels are not tied to them in code. axe reports `label` (critical) on 2 fields, `html-has-lang` (serious) and `link-name` (serious) on 2 links.
  - The form asks for "Barcode or Qatari ID", whereas the catalogue login (1.3) asks for "Membership No. OR Qatar ID". Two different wordings for what may be the same credential.
- **Language:**
  - qnl.qa passes `lang=en` or `lang=ar` to EDS.
  - The login page is **identical** for both, with no `lang` attribute on `<html>`, rendered left-to-right.
  - What EDS shows after sign-in: **[NOT CHECKED]** (no account was used).
- **Screens:** `eres-login-desktop-en.png`, `eres-login-desktop-ar.png`, `eres-login-mobile-en.png`.

### 4.2 LibGuides
- **How users reach it from qnl.qa:**
  - Homepage tiles: "Children's Online Resources", "Young Adults' Online Resources" and "How-Do-I Guides".
  - The Online Resources page (`/en/explore/online-resources`) links: "Ebooks, Audiobooks and Music" → `libguides.qnl.qa/az.php?t=41275`, "Newspapers and Magazines" → `?t=41291`, and "All Our Online Resources" → `az.php`.
  - Header menu entries ("Resource Guides", "How-Do-I Guides", "Online Resources").
- **Separate login:** none to browse. Opening a database goes through the eres proxy (`*.eres.qnl.qa`), e.g. Economist, PressReader and SAGE Campus. Or it goes to a third-party app (OverDrive/Libby at `libbyapp.com/library/qnl`).
- **Language:**
  - English LibGuides is on `libguides.qnl.qa`.
  - **Arabic LibGuides is on a different domain, `qnl.libguides.com`**: the Arabic homepage tiles and the Arabic Online Resources page link there.
  - The Arabic A–Z page is laid out right-to-left with an Arabic search label («بحث في قواعد البيانات»), but declares `<html lang="en">`.
  - Database names stay in English on both, e.g. "OverDrive (Libby)" and "PressReader".
  - The type filter on the e-books list reads "eBooks, Audiobooks, Music (36)".
- **Screens:** `j2-step2-libguides-ebooks-desktop-en.png`, `…-ar.png`, plus the mobile versions.
- **Accessibility:** axe on the English A–Z e-books list (`libguides.qnl.qa/az.php?t=41275`, desktop): 3 rules failed, 12 nodes: `link-name` (serious, 4), `list` (serious, 3), `target-size` (serious, 5). Arabic LibGuides (`qnl.libguides.com`) and mobile: **[NOT CHECKED]** with axe; they were not included in the run.

---

## 5. Screenshot index (`docs/screens/current/`)
72 files.

**Website search results (2.3–2.6)** (40)
- `search-ar-doha-desktop-ar.png`
- `search-ar-doha-mobile-ar.png`
- `search-ar-hours-desktop-ar.png`
- `search-ar-hours-mobile-ar.png`
- `search-ar-membership-desktop-ar.png`
- `search-ar-membership-mobile-ar.png`
- `search-ar-toddlers-desktop-ar.png`
- `search-ar-toddlers-mobile-ar.png`
- `search-ar-typo-control-desktop-ar.png`
- `search-ar-typo-control-desktop-en.png`
- `search-ar-typo-control-mobile-ar.png`
- `search-ar-typo-control-mobile-en.png`
- `search-ar-typo-desktop-ar.png`
- `search-ar-typo-desktop-en.png`
- `search-ar-typo-mobile-ar.png`
- `search-ar-typo-mobile-en.png`
- `search-doha-desktop-ar.png`
- `search-doha-desktop-en.png`
- `search-doha-mobile-ar.png`
- `search-doha-mobile-en.png`
- `search-hours-desktop-ar.png`
- `search-hours-desktop-en.png`
- `search-hours-mobile-ar.png`
- `search-hours-mobile-en.png`
- `search-membership-desktop-ar.png`
- `search-membership-desktop-en.png`
- `search-membership-mobile-ar.png`
- `search-membership-mobile-en.png`
- `search-romanised-control-desktop-ar.png`
- `search-romanised-control-desktop-en.png`
- `search-romanised-control-mobile-ar.png`
- `search-romanised-control-mobile-en.png`
- `search-romanised-desktop-ar.png`
- `search-romanised-desktop-en.png`
- `search-romanised-mobile-ar.png`
- `search-romanised-mobile-en.png`
- `search-toddlers-desktop-ar.png`
- `search-toddlers-desktop-en.png`
- `search-toddlers-mobile-ar.png`
- `search-toddlers-mobile-en.png`

**Journey 1: homepage, mobile search open, catalogue hand-off** (10)
- `j1-step0-home-desktop-ar.png`
- `j1-step0-home-desktop-en.png`
- `j1-step0-home-mobile-ar.png`
- `j1-step0-home-mobile-en.png`
- `j1-step1-search-open-mobile-ar.png`
- `j1-step1-search-open-mobile-en.png`
- `j1-step3-catalogue-handoff-desktop-ar.png`
- `j1-step3-catalogue-handoff-desktop-en.png`
- `j1-step4-catalogue-handoff-mobile-ar.png`
- `j1-step4-catalogue-handoff-mobile-en.png`

**Journey 2: Online Resources, LibGuides e-books list** (8)
- `j2-step1-online-resources-desktop-ar.png`
- `j2-step1-online-resources-desktop-en.png`
- `j2-step1-online-resources-mobile-ar.png`
- `j2-step1-online-resources-mobile-en.png`
- `j2-step2-libguides-ebooks-desktop-ar.png`
- `j2-step2-libguides-ebooks-desktop-en.png`
- `j2-step2-libguides-ebooks-mobile-ar.png`
- `j2-step2-libguides-ebooks-mobile-en.png`

**Journey 3: Become a Member, registration (520)** (6)
- `j3-step1-become-a-member-desktop-ar.png`
- `j3-step1-become-a-member-desktop-en.png`
- `j3-step1-become-a-member-mobile-ar.png`
- `j3-step1-become-a-member-mobile-en.png`
- `j3-step2-registration-desktop-en.png`
- `j3-step2-registration-mobile-en.png`

**Digital repository (2.2, 2.6)** (2)
- `repository-doha-desktop-ar.png`
- `repository-doha-desktop-en.png`

**EDS proxy login (4.1)** (3)
- `eres-login-desktop-ar.png`
- `eres-login-desktop-en.png`
- `eres-login-mobile-en.png`

**Accessibility and mobile trigger (2.1, 2.8)** (2)
- `a11y-focus-search-desktop-en.png`
- `search-trigger-before-after-mobile-en.png`

**elibrary bot check as measured by Lighthouse (1.2)** (1)
- `elibrary-botcheck-lighthouse-mobile-en.png`

**Not kept: [NOT CHECKED]**
- Libby (journey 2, step 3): the sandbox showed an error that may come from its own network limits (3.1).
- Arabic registration (journey 3, step 2): plain `http://` link, not reachable from the sandbox.

**Concept G** (`docs/screens/concept-g/`, 58 files): same names for the same queries (`search-<query>-<device>-<lang>.png`) plus `j1-book-results-*`, `j2-ebook-*` and `j3-membership-*` for 3.2.

---

## 6. Highlights: what QNL's current search does well, and what we should keep
1. **A short, direct search on desktop: 3 actions to results.** The search box is in the header of every page, visible on load. Click, type, Search (or Enter), measured in both languages.
   - Our technical-proposal deck attributes this to the Benchmark Report ("The 3-step direct search flow … never lengthen it").
   - The Benchmark Report itself was **[NOT CHECKED]**: it's not in this repo or the Drive I could search. **Keep it:** Concept G also takes 3 actions, on desktop *and* mobile.
2. **An explicit choice of what to search.** Catalog / Online Resources / Digital Repository / Website, with Catalog as default. Expert users can go straight to the right system. **Keep the idea** as Concept G's in-bar scope menu, with plain-language options.
3. **Language travels with the user** into every hand-off (`lang=eng|ara`, `lang=en|ar`, `/ar/`), and the Arabic placeholder and button read «بحث». **Keep and extend** to the systems that don't yet honour it.
4. **Arabic service queries land well.** «مواعيد العمل» → «ساعات العمل والموقع» at **#1**; «العضوية» → «العضوية وسياسة الاستعارة» at #1. In English, "membership" → "Membership & Circulation Policy" at #1. **Keep:** this content is the raw material for Concept G's quick-answer cards.
5. **An honest results header with filters by content type.** "Search results for "Doha" (454 hits)" plus counted type filters ("Libraries (169) · News (130) · Events (87) …") and numbered pages. **Keep:** counted filters are the pattern Concept G extends to format, location, language and year.
6. **The same results on every device.** All 20 query/interface pairs returned identical counts and top 3 on desktop and mobile. **Keep:** one index, one behaviour.
7. **The digital repository's results tools.** Sort by Title, Language or Date; Subject, Period, Language and Collection filters; and an Advanced Search with "Add Criteria", in both languages. **Keep these capabilities** when the repository is folded into one search.
8. **A stable results page.** Lighthouse mobile CLS **0** on every results-page run, and LCP **1.9 s** on the Arabic results page. **Keep** the server-rendered results page approach (Concept G does the same).

---

## 7. Before and after: problem → Concept G fix → SOW section

**About the SOW column [NOT CHECKED]:**
- The SOW itself is not in this repository or in the Drive I could search, so its wording for 5.8, 5.9.1, 5.12 and 5.19.4 was **not checked**.
- The column uses the four section numbers given in the brief. The subjects in brackets are how our technical-proposal deck (Bid Desk deck for QNL-RFQ-90) uses the parent sections:
  - **5.7–5.8:** "CMS, events, unified search front end";
  - **5.9:** "Middle tier, integrations, SSO, Discovery";
  - **5.19:** "Azure, DevOps, security, performance".
- **5.12** appears in the deck only in an acceptance list next to 5.19.9, 5.19.12 and 5.20.5, so its subject is **unconfirmed**. Rows mapped to 5.12 are marked "(provisional)".
- **Every mapping must be checked against the SOW text before submission.**

**About the "after" column:**
- It was measured on the Concept G prototype (commit `ba1ab26`, run locally from the same code deployed at https://qnl-search-first.vercel.app).
- Concept G searches **98 sample records**, not QNL's catalogue or website, so its result counts are not comparable with QNL's.
- What *is* comparable is behaviour: steps, language, zero-results handling, filters, labels, focus, and where the answer appears.

| # | Problem today (evidence) | Concept G fix (where it's shown) | SOW |
|---|---|---|---|
| 1 | **Search is split across four systems behind a menu.** The default ("Catalog") hands every query to elibrary.qnl.qa; articles, repository and website each answer separately (2.2). | One box searching everything, with results grouped by type on one page: `src/components/search/SearchBox.tsx`, `src/components/SearchResults.astro`. Screens: `concept-g/search-doha-desktop-en.png`, `…-ar.png`. *Integration with the real catalogue and EDS is designed (`src/search/DiscoveryApiAdapter.ts`) but **not built**: prototype data only.* | 5.8 (unified search front end) |
| 2 | **Six-plus hand-offs to other hosts**, each with its own look and sign-in: elibrary.qnl.qa, login.eres.qnl.qa, libbyapp.com, libguides.qnl.qa / qnl.libguides.com, registration.qnl.qa, library.qnl.qa (3, 4). | Measured journeys stay in one interface with **0 hand-offs**: book 3 actions, e-book 5, membership 4 (3, table). Actions sit on the record: `src/components/RecordActions.astro`. *Single sign-on and live hand-over to Sierra, EDS and Libby are **not built**.* | 5.9.1 (integrations / SSO / Discovery) |
| 3 | **Mobile search is hidden** behind a trigger: 4 actions (Catalog) or 5 (Website) to results; the trigger has no `aria-expanded` (2.1, 2.8). | Search bar visible on load on mobile; **3 actions** on both devices, EN and AR (`docs/audit/current/concept-g-same-queries.json`, "steps" rows). Screens: `docs/screens/hero-v2/en-phone.jpg`, `concept-g/j1-book-results-mobile-en.png`. | 5.8 |
| 4 | **Service pages rank poorly on the website search.** "opening hours" → hours page at #19; "membership" → Become a Member not in top 100; "books for toddlers" → no children's page in top 100 (2.3). | **Fixed for the first two:** quick-answer cards pin "Opening hours" and "Become a member" above the results, in EN and AR (`concept-g/search-hours-desktop-en.png`, `search-membership-desktop-ar.png`). **Not fixed for "books for toddlers":** Concept G's top 3 were "Book a study space", "Arabic Book Club (sample)" and "Early Arabic printed books (sample)" (`concept-g/search-toddlers-desktop-en.png`). Needs work in content tagging and ranking. | 5.8 |
| 5 | **Zero results is a dead end:** one English line, even on the Arabic site (2.4). | Zero-results page in the page's language, with "Ask a librarian" and "Search the full catalogue": «لا توجد نتائج مطابقة لعبارة «Al-Mutanabbi»» with «اسأل أمين المكتبة» and «ابحث في الفهرس الكامل» (`concept-g/search-romanised-desktop-ar.png`). | 5.8 |
| 6 | **Arabic pages mix in English:** filter labels, breadcrumb, zero results and form labels (2.5). LibGuides Arabic declares `lang="en"`; the EDS login has no `lang` (4). | All interface text in Concept G is localised: Arabic filter legends «النوع، الشكل، الموقع، اللغة، المجموعة، الفئة», with `lang="ar"` and `dir="rtl"` set (`concept-g-same-queries.json`; `concept-g/search-ar-doha-desktop-ar.png`). *Third-party systems not covered.* | 5.8; 5.12 (provisional) |
| 7 | **Search controls fail accessibility basics:** hidden labels, a platform menu with no accessible name (axe critical), 0-pixel focus change, 26–28 Tabs to reach the box (2.8). | Visible label ("Search the library" / «ابحث في المكتبة») and scope label ("Search in" / «البحث في»). **3,318 px (EN) / 3,296 px (AR)** change on focus, measured the same way as for QNL. **12 Tabs** to the box. axe 0 violations (PHASE7_REPORT.md and step reports). | 5.12 (provisional) |
| 8 | **Slow homepage on mobile:** Lighthouse performance 57–61, LCP 21.9–26.1 s, 8,234–8,237 KB transferred (2.7); one image is 3,874 KB. | Lighthouse mobile performance 98–99, LCP 1.7–1.8 s after the hero revision (PHASE7_REPORT.md, 2 runs per page). Page weight after that revision: **[NOT CHECKED]** (the 197–207 KB in PHASE7_REPORT.md was measured before it). *Measured on a local build, not on QNL hosting, and with different content.* | 5.19.4 (provisional: performance) |
| 9 | **No sort, and content-type is the only filter** on the website search (2.6). | Sort: Relevance, Newest, Oldest, Title A–Z, Author A–Z (plus Date for events). Filters with counts: Type, Format, Location, Language, Collection, Audience, Year. "Show only" toggles: At QNL, Available now, Online (`concept-g/search-doha-desktop-en.png`; `src/components/SearchResults.astro`). | 5.8 |
| 10 | **No tolerance for Arabic misspelling or transliteration** on the website search: "Al-Mutanabbi" and «المتنبي» both 0. In the Arabic interface the misspelt title returned 2,609 hits and the correct spelling 2,620; neither top 3 is about the novel (2.3). | Arabic normalisation and romanisation folding (`src/search/normalise.ts`; places with spelling variants in `src/content/catalogue.json`; `src/content/synonyms.json`). Measured: "Dawhah" → 12 results led by the Doha items; misspelt sample title «غواصو اللولو علي الساحل القطري» → the exact item (1 result). *Al-Mutanabbi also returns 0 in Concept G, because no such record is in the sample data.* | 5.8; 5.9.1 |
| 11 | **Test and duplicate content in the index:** Arabic "Doha" top result titled "test"; the same event title three times for Arabic "membership" (2.5). | Build-time content checks reject bad records (`scripts/build-index.mjs`); results are grouped by type. *Duplicate-suppression rules are **not built**.* | 5.8 |
| 12 | **Insecure or broken links in the journeys:** repository linked over `http://`; Arabic "18 and over" sign-up linked over `http://`; English sign-up form returned Cloudflare **520** on every attempt, desktop and mobile (ten attempts between 13:16 and 13:49 UTC), while the renewal form returned 200 (3). | Not a front-end fix. Proposed: HTTPS-only links, and link and uptime monitoring in CI. *Not demonstrated in Concept G.* | 5.19.4 (provisional: security) |
| 13 | **Two different sign-up routes and credential wordings:** Online Resources "register now" → `library.qnl.qa/selfreg~S1`, Become a Member → `registration.qnl.qa`. "Barcode or Qatari ID" (eres) vs "Membership No. OR Qatar ID" (catalogue) (3, 4.1). | Concept G uses one membership answer card and one record page (`concept-g/j3-membership-end-desktop-en.png`). *Account system consolidation is **not built**.* | 5.9.1 |
