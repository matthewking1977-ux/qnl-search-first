// Grades and resizes the curated QNL photos into /public/images.
// Grade: slightly muted (saturation 0.86) with lifted blacks (linear a=0.9, b=+14),
// a touch of warmth removed so the maroon accent stays the only warm note.
// Usage: npm run media
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'assets/photos/originals';
const OUT = 'public/images';

// key → { file, widths, crops? }  Crops are chosen per breakpoint (see Picture.astro).
export const PHOTOS = {
  // Hero poster = first frame of the trimmed hero video, already graded in ffmpeg (grade: false)
  'hero-poster':    { file: '../../video/hero-poster.png', widths: [480, 640, 960, 1280], grade: false },
  'hall-columns':   { file: 'QNL 0024.jpg', widths: [640, 960, 1440, 1920, 2560] }, // still-photo fallback
  'hall-wide':      { file: 'QNL 0013.jpg', widths: [640, 960, 1440] },
  'hall-skylight':  { file: 'QNL 0023.jpg', widths: [480, 800, 1200] },             // portrait
  'terraces':       { file: 'QNL 0027.jpg', widths: [640, 960, 1440, 1920] },
  'terraces-rail':  { file: 'QNL 0029.jpg', widths: [640, 960, 1440] },
  'heritage-walls': { file: 'QNL 0042.jpg', widths: [640, 960, 1440, 1920, 2560] },
  'heritage-cases': { file: 'QNL 0045.jpg', widths: [640, 960, 1440] },
  'stair-light':    { file: 'QNL 0049.jpg', widths: [480, 800, 1200] },             // portrait
  'stacks-rows':    { file: 'QNL 0050.jpg', widths: [480, 800, 1200] },
  'shelf-top':      { file: 'QNL 0053.jpg', widths: [480, 800, 1200] },
  'catalogue-pcs':  { file: 'QNL 0054.jpg', widths: [480, 800, 1200] },
  'reader-stairs':  { file: 'QNL 0055.jpg', widths: [480, 800, 1200] },
  'study-stair':    { file: 'QNL 0034.jpg', widths: [480, 800, 1200, 1600] },
  'study-tables':   { file: 'QNL 0025.jpg', widths: [480, 800] },
  'gallery-ramp':   { file: 'QNL 0040.jpg', widths: [480, 800, 1200] },
  'stair-wayfind':  { file: 'QNL 0037.jpg', widths: [480, 800, 1200] },
  'exterior-dusk':  { file: 'QNL 0001.jpg', widths: [640, 960, 1440, 1920] },
  'exterior-corner':{ file: 'QNL 0009.jpg', widths: [480, 800, 1200] },
  'exterior-parking':{ file: 'QNL 0011.jpg', widths: [480, 800] },
  'family-hall':    { file: 'QNL 0047.jpg', widths: [480, 800, 1200] },
  'children-hall':  { file: 'QNL 0017.jpg', widths: [480, 800, 1200] },
  'talk-seating':   { file: 'QNL 0020.jpg', widths: [480, 800] },
  // What's on card photos (supplied 26 Nov 2026), 3:2 crops
  'event-storytime':{ file: '../events/storytime.jpg', widths: [480, 800, 1200] },
  'event-workshop': { file: '../events/workshop-clay.jpg', widths: [480, 800, 1200] },
  'event-books':    { file: '../events/books-open.jpg', widths: [480, 800, 1200] },
};

const grade = (img) =>
  img
    .modulate({ saturation: 0.86, brightness: 1.0 })
    .linear(0.9, 14)        // lift blacks, compress highlights slightly
    .gamma(1.04);

async function exists(p) { try { await stat(p); return true; } catch { return false; } }

await mkdir(OUT, { recursive: true });
const manifest = {};
for (const [key, { file, widths, grade: doGrade = true }] of Object.entries(PHOTOS)) {
  const g = doGrade ? grade : (img) => img;
  const src = path.join(SRC, file);
  const meta = await sharp(src).metadata();
  manifest[key] = { src: file, w: meta.width, h: meta.height, widths: [] };
  for (const w of widths) {
    if (w > meta.width && key !== 'hero-poster') continue;
    manifest[key].widths.push(w);
    for (const [fmt, opts] of [['avif', { quality: 52, effort: 5 }], ['webp', { quality: 72 }], ['jpg', { quality: 74, mozjpeg: true }]]) {
      const out = path.join(OUT, `${key}-${w}.${fmt}`);
      if (await exists(out)) continue;
      // Resize and sharpen first, then grade the result. Grading in the same pipeline as
      // sharpen let dark edge pixels overflow into blue/yellow speckles.
      const sized = await sharp(src).rotate().resize({ width: w, kernel: 'lanczos3' }).sharpen(w > meta.width ? { sigma: 0.6 } : undefined).png().toBuffer();
      await g(sharp(sized)).toFormat(fmt === 'jpg' ? 'jpeg' : fmt, opts).toFile(out);
    }
  }
  // tiny blurred placeholder (inline base64) for card backgrounds
  const lqip = await g(sharp(src).resize({ width: 24 })).blur(1.2).webp({ quality: 40 }).toBuffer();
  manifest[key].lqip = `data:image/webp;base64,${lqip.toString('base64')}`;
  if (!manifest[key].widths.length) manifest[key].widths.push(meta.width);
  console.log('✓', key, manifest[key].widths.join(','));
}
const { writeFile } = await import('node:fs/promises');
await writeFile('src/lib/images.json', JSON.stringify(manifest, null, 2));
console.log('wrote src/lib/images.json');
