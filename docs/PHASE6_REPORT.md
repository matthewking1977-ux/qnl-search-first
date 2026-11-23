# Phase 6: Arabic pass report

## Deliverable for the copywriter
`src/i18n/ar_review.csv` has 575 rows in four columns (key · English · Arabic · notes). The first row is marked **DRAFT: requires human review before submission**. It is UTF-8 with a BOM, so Excel shows the Arabic correctly.
- 255 interface strings (EN and AR key sets are identical; nothing is missing).
- All 80 sample records: title, summary, venue, task answer and action.
- 28 topic tags, plus the sentence-builder phrases (5 personas, 17 needs) and the 34 task cards.
- Notes flag placeholders, display lines, trademarks kept in Latin script, grammar decisions and confirmed facts.
- Regenerate with `python3 scripts/export_ar_review.py`.

## Changes made in this pass
| Where | Before | After | Why |
|---|---|---|---|
| nav.forYou / forYou.eyebrow | لك | مقترحات لك | Too terse as a navigation label |
| nav.visit | زيارتك | الزيارة | Neutral section name |
| a11y.skip | انتقل إلى المحتوى | الانتقال إلى المحتوى الرئيسي | Standard skip-link phrasing |
| search.seeAll | عرض الكل ({n}) في {group} | عرض جميع {group} ({n}) | More natural |
| search.seeAllResults / zero.title | لـ «{q}» | لعبارة «{q}» | Avoids «لـ «…»» before a quoted query |
| forYou.live | لـ{persona} | لفئة «{persona}» | «لـالطلاب» was ungrammatical |
| research.title | أدوات للعمل الجاد | أدوات للعمل البحثي الجاد | Clearer meaning |
| app.placeholder | عنصر نائب | رابط مؤقت | Less technical |
| news.line | مرة كل شهر | مرة واحدة شهريًا | Smoother MSA |
| bk-17 summary | …لصانعي المحتوى الصغار | …للمبتكرين الصغار | "Makers", not "content creators" |
| ev-04 summary | جولة بقيادة… | عرض يقدّمه أمين المجموعة… | It's a talk, not a tour |
| ev-06 title | عيادة SPSS | جلسات استشارية حول SPSS | Avoids a literal "clinic" |
| ev-13 venue | المسرح | قاعة المحاضرات الكبرى | "Auditorium", not "theatre" |
| hr-04 title | ديوان شعر بخط من… | ديوان شعر مخطوط من… | Clearer |
| sv-renew answer | حسابي | «حسابي» | Section name quoted |
| Metro / address | [AR – verify] | (removed) | Confirmed by client |

## Numbers and dates: one setting
`LOCALE_SETTINGS.numerals` in `src/i18n/index.ts` is `'latn'`, so both languages use Western digits 0–9. Setting it to `'arab'` switches every date and time to Arabic-Indic digits, on server-rendered pages and in the search island, which now receives the locale from this setting. Digits typed inside translation strings (e.g. «من 3 إلى 5 سنوات») are literal and stay Western. The calendar is Gregorian, with Arabic month names in AR (يناير، فبراير…).

## RTL QA (automated, every page and state)
Checks on each view:
- `dir="rtl"` and `lang="ar"` are set;
- no horizontal overflow;
- axe-core (WCAG 2.2 AA + best practice) reports zero violations;
- no Arabic text node has letter-spacing, uppercase, italics, or a non-Arabic font.

Views checked:
- AR home, desktop and mobile;
- mobile menu open;
- search results (Arabic query, Latin query, zero results, facets with sort);
- item pages (event, service, heritage);
- accessibility statement, newsletter and style guide;
- type-ahead (task answer, Latin query, zero results);
- sentence builder with a listbox open.

**Result: all clean.** The one issue found was Arabic captions in Roboto Mono on the style guide; it's fixed.

Visual bidi fixes:
- Phone and email in the footer now render left to right inside Arabic: «+974 1234 5678».
- Any element with a `dir` attribute is now bidi-isolated across the site.

The Arabic display face is Noto Naskh Arabic, as approved, on the hero, section headlines and the heritage band.

Screenshots are in `docs/screens/ar/`.
