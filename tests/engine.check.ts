import { createEngine, highlight } from '../src/search/engine';
import { engineData } from '../src/search/data';
const e = createEngine(engineData);
const cases: [string, 'en'|'ar'][] = [
  ['libary', 'en'], ['opening times', 'en'], ['renew', 'en'], ['membership', 'en'], ['parking', 'en'], ['hours', 'en'], ['study room', 'en'],
  ['pearl', 'en'], ['gulf maritme histroy', 'en'], ['databse', 'en'], ['metro', 'en'], ['xyzzy qqq', 'en'],
  ['مواعيد العمل', 'ar'], ['اللؤلؤ', 'ar'], ['اللؤلو', 'ar'], ['الخرائط', 'ar'], ['مكتبه قطر الرقميه', 'ar'], ['تجديد', 'ar'], ['مواقف', 'ar'], ['الشعر', 'ar'], ['اطفال', 'ar'], ['شعر', 'en'],
  ['maps', 'ar'], ['قاعدة بيانات', 'en'],
];
for (const [q, lang] of cases) {
  const r = e.suggest({ q, lang, perGroup: 3 });
  const top = r.hits.slice(0, 4).map(h => `${h.record.id}:${h.record.title[lang].slice(0, 34)}`).join(' | ');
  console.log(`${q.padEnd(22)} ${r.tookMs.toFixed(2)}ms total=${String(r.total).padStart(2)} task=${r.task?.record.id ?? '-'} :: ${top}`);
}
const r = e.search({ q: 'gulf maritme', lang: 'en' });
console.log(JSON.stringify(highlight(r.hits[0].record.title.en, r.hits[0].terms)));
