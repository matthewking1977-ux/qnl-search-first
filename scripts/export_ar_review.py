#!/usr/bin/env python3
"""Export every Arabic string (UI + sample content) to src/i18n/ar_review.csv
for the senior Arabic copywriter. Columns: key, English, Arabic, notes.
Run from the repo root:  python3 scripts/export_ar_review.py
"""
import csv, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
en = json.loads((ROOT / 'src/i18n/en.json').read_text('utf-8'))
ar = json.loads((ROOT / 'src/i18n/ar.json').read_text('utf-8'))

NOTES = {
    'meta.title': "Official name. Use consistently: «مكتبة قطر الوطنية».",
    'hero.line': "Display line (Noto Naskh Arabic). Free rendering of 'final paper' as «بحثك الأخير» (your last piece of research), not a literal «ورقتك النهائية».",
    'heritage.line': "Display line (Noto Naskh Arabic).",
    'nav.forYou': "Expanded from the terse «لك» to «مقترحات لك» for clarity in navigation.",
    'search.phase2': "Refers to QNL's project Phase 2 (future feature), not a site section.",
    'search.ask.title': "'Phase 2' = future project phase.",
    'search.count': "Used for 11+ results (singular tamyiz). 3–10 uses search.countFew, 2 uses search.count2.",
    'search.countFew': "Arabic plural for 3–10.",
    'search.count2': "Dual form.",
    'search.seeAll': "{group} is a plural noun with the article, e.g. «عرض جميع الكتب (5)».",
    'search.seeAllResults': "«لعبارة» used instead of «لـ» before quoted query to avoid «لـ «…»».",
    'search.zero.title': "As above: «لعبارة «…»».",
    'forYou.live': "Screen-reader announcement. {persona} is a plural group noun (e.g. الطلاب), so «لفئة «{persona}»» avoids «لـالطلاب».",
    'forYou.note': "Privacy reassurance; keep the 'nothing stored on our servers' meaning.",
    'label.sample': "Discreet label shown on sample content; hidden with ?clean=1.",
    'label.tbc': "Placeholder for values QNL must confirm.",
    'today.openValue': "Placeholder until wired to live opening hours.",
    'today.studyValue': "Placeholder until wired to live space availability.",
    'footer.credit': "Removable agency credit. Brand name kept in Latin script.",
    'app.ios': "Store name kept in Latin script (trademark).",
    'app.android': "Store name kept in Latin script (trademark).",
    'footer.address': "Confirmed by client (23 Nov 2026).",
    'footer.metro': "Confirmed by client (23 Nov 2026). Official station name in Arabic.",
    'today.metroValue': "Confirmed by client (23 Nov 2026).",
    'a11y.intro': "WCAG name kept as an English acronym with Arabic expansion.",
    'results.sort.title': "Alphabetical sort by title.",
    'lang.other': "Language switch label: always shown in the other language.",
}

rows = []
for k, v_en in en.items():
    if k == 'lang.otherCode':
        continue
    v_ar = ar.get(k, '')
    note = NOTES.get(k, '')
    if k.startswith('sg.'):
        note = (note + ' ' if note else '') + 'Design-system page only (internal).'
    if '[يُحدَّد لاحقًا]' in v_ar or '[TBC]' in v_en:
        note = (note + ' ' if note else '') + 'Contains [TBC] placeholder.'
    if not v_ar:
        note = 'MISSING ARABIC'
    rows.append((k, v_en, v_ar, note.strip()))

# Sample content
for f in ['books', 'databases', 'events', 'services', 'heritage', 'pages']:
    for r in json.loads((ROOT / f'src/content/{f}.json').read_text('utf-8')):
        base = f'content.{f}.{r["id"]}'
        n = 'SAMPLE record (fictional).' if '(sample)' in r['title']['en'] else 'Service/page copy (sample).'
        rows.append((f'{base}.title', r['title']['en'], r['title']['ar'], n + ' «(نموذج)» suffix marks sample titles.' if '(sample)' in r['title']['en'] else n))
        rows.append((f'{base}.summary', r['summary']['en'], r['summary']['ar'], ''))
        if r.get('place'):
            rows.append((f'{base}.place', r['place']['en'], r['place']['ar'], 'Venue name inside the library; confirm official room names.'))
        if r.get('task'):
            t = r['task']
            rows.append((f'{base}.task.answer', t['answer']['en'], t['answer']['ar'], 'Quick-answer card shown in search. Contains [TBC] placeholders.' if '[TBC]' in t['answer']['en'] else 'Quick-answer card shown in search.'))
            rows.append((f'{base}.task.action', t['action']['en'], t['action']['ar'], 'Button label (imperative).'))

tags = json.loads((ROOT / 'src/content/tags.json').read_text('utf-8'))
for k, v in tags.items():
    if k == '_note':
        continue
    rows.append((f'tags.{k}', v['en'], v['ar'], 'Related-topic tag; also a search term.'))

p = json.loads((ROOT / 'src/content/personas.json').read_text('utf-8'))
rows.append(('personas.sentence.before', p['sentence']['en']['before'], p['sentence']['ar']['before'],
             "Sentence builder: «أنا من [فئة] وأبحث عن [حاجة]». Group-noun construction keeps the sentence gender-neutral (avoids «طالب/طالبة»)."))
rows.append(('personas.sentence.middle', p['sentence']['en']['middle'], p['sentence']['ar']['middle'], ''))
for per in p['personas']:
    rows.append((f'personas.{per["id"]}', per['en'], per['ar'], 'Plural group noun after «أنا من».'))
    for need in per['needs']:
        rows.append((f'personas.{per["id"]}.{need["id"]}', need['en'], need['ar'], 'Follows «وأبحث عن».'))
for cid, c in p['cards'].items():
    rows.append((f'cards.{cid}.label', c['en'][0], c['ar'][0], 'Task card label.'))
    rows.append((f'cards.{cid}.help', c['en'][1], c['ar'][1], 'Task card help line.' + (' Contains [TBC].' if '[TBC]' in c['en'][1] else '')))

out = ROOT / 'src/i18n/ar_review.csv'
with out.open('w', encoding='utf-8-sig', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['DRAFT: requires human review before submission', '', '', 'Generated from src/i18n/*.json and src/content/*.json. Western digits (0–9) by design; Gregorian calendar with Arabic month names.'])
    w.writerow(['key', 'English', 'Arabic', 'notes'])
    w.writerows(rows)
print(f'wrote {out.relative_to(ROOT)} with {len(rows)} rows')
