// Validates sample content before build: unique ids, both languages, sample flag,
// and catalogue blocks against content/catalogue.json (codes, places, ISBN checksums).
import { readFileSync } from 'node:fs';
const files = ['books', 'databases', 'events', 'services', 'heritage', 'pages'];
const ref = JSON.parse(readFileSync('src/content/catalogue.json', 'utf8'));
const ids = new Set(); let n = 0, cat = 0;
const fail = (id, msg) => { throw new Error(`${id}: ${msg}`); };
const bi = (id, k, v) => { if (!v?.en || !v?.ar) fail(id, `${k} needs en and ar`); };
const isbnOk = (s) => {
  const d = s.replace(/-/g, '');
  if (!/^\d{13}$/.test(d)) return false;
  const sum = [...d.slice(0, 12)].reduce((a, c, i) => a + (i % 2 ? 3 : 1) * +c, 0);
  return (10 - (sum % 10)) % 10 === +d[12];
};
for (const f of files) {
  for (const r of JSON.parse(readFileSync(`src/content/${f}.json`, 'utf8'))) {
    n++;
    if (ids.has(r.id)) fail(r.id, 'duplicate id');
    ids.add(r.id);
    if (r.sample !== true) fail(r.id, 'missing sample:true');
    for (const k of ['title', 'summary']) bi(r.id, k, r[k]);
    const c = r.catalogue;
    if (!c) continue;
    cat++;
    if (!ref.formats[c.format]) fail(r.id, `unknown format ${c.format}`);
    if (!ref.languages[c.language]) fail(r.id, `unknown language ${c.language}`);
    if (!ref.collections[c.collection]) fail(r.id, `unknown collection ${c.collection}`);
    if (!c.authors?.length) fail(r.id, 'no authors');
    c.authors.forEach((a) => bi(r.id, 'author', a));
    bi(r.id, 'description', c.description);
    if (!c.subjects?.length) fail(r.id, 'no subjects');
    c.subjects.forEach((s) => bi(r.id, 'subject', s));
    for (const p of c.places ?? []) if (!ref.places[p]) fail(r.id, `unknown place ${p}`);
    if (c.isbn && !isbnOk(c.isbn)) fail(r.id, `bad ISBN check digit ${c.isbn}`);
    if (!c.holdings?.length) fail(r.id, 'no holdings');
    for (const h of c.holdings) {
      if (!ref.locations[h.location]) fail(r.id, `unknown location ${h.location}`);
      if (!ref.status[h.status]) fail(r.id, `unknown status ${h.status}`);
      if (h.status === 'on-loan' && !/^\d{4}-\d\d-\d\d$/.test(h.due ?? '')) fail(r.id, 'on-loan needs due date');
      if (h.status !== 'online' && !h.callNo) fail(r.id, 'physical holding needs a call number');
    }
    if (c.online && !c.holdings.some((h) => h.status === 'online')) fail(r.id, 'online flag without an online holding');
  }
}
console.log(`content ok: ${n} records (${cat} with catalogue data)`);
