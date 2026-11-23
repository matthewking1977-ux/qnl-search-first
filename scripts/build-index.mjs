// Validates sample content before build: unique ids, both languages, sample flag.
import { readFileSync } from 'node:fs';
const files = ['books', 'databases', 'events', 'services', 'heritage', 'pages'];
const ids = new Set(); let n = 0;
for (const f of files) {
  for (const r of JSON.parse(readFileSync(`src/content/${f}.json`, 'utf8'))) {
    n++;
    if (ids.has(r.id)) throw new Error(`duplicate id ${r.id}`);
    ids.add(r.id);
    if (r.sample !== true) throw new Error(`${r.id} missing sample:true`);
    for (const k of ['title', 'summary']) if (!r[k]?.en || !r[k]?.ar) throw new Error(`${r.id} missing ${k} en/ar`);
  }
}
console.log(`content ok: ${n} records`);
