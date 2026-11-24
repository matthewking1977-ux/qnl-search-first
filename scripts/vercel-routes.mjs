// Post-processes the Vercel Build Output config written by @astrojs/vercel:
//  1. Cache + security headers for static assets (the adapter only caches /_astro/*).
//  2. Unknown URLs get the static, branded 404 (EN or AR by path) with status 404,
//     instead of a serverless function rendering Astro's default page.
// Runs as the npm `postbuild` script, after the adapter has written .vercel/output.
import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const security = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'SAMEORIGIN',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
};
const YEAR = 'public, max-age=31536000, immutable';
// Media file names are not content-hashed: cache for 30 days, revalidate in the background.
const MONTH = 'public, max-age=2592000, stale-while-revalidate=86400';

const logger = { info: (m) => console.log('[vercel-routes] ' + m), warn: (m) => console.warn('[vercel-routes] ' + m) };
const root = new URL('../.vercel/output/', import.meta.url);

const cfgPath = fileURLToPath(new URL('config.json', root));
try { await access(cfgPath); } catch { logger.warn('no .vercel/output/config.json, skipped'); process.exit(0); }
const cfg = JSON.parse(await readFile(cfgPath, 'utf8'));
const routes = cfg.routes ?? [];
if (routes.some((r) => r.headers?.['x-content-type-options'])) process.exit(0); // already applied

const headerRoutes = [
  { src: '^/(.*)$', headers: security, continue: true },
  { src: '^/fonts/(.*)$', headers: { 'cache-control': YEAR }, continue: true },
  { src: '^/(?:images|video|logo)/(.*)$', headers: { 'cache-control': MONTH }, continue: true },
  { src: '^/(?:favicon\\.png|apple-touch-icon\\.png)$', headers: { 'cache-control': MONTH }, continue: true },
  // Citation exports download as files with the right type.
  { src: '^/(?:ar/)?item/[^/]+\\.ris$', headers: { 'content-type': 'application/x-research-info-systems; charset=utf-8', 'content-disposition': 'attachment' }, continue: true },
  { src: '^/(?:ar/)?item/[^/]+\\.bib$', headers: { 'content-type': 'application/x-bibtex; charset=utf-8', 'content-disposition': 'attachment' }, continue: true },
];
const fs = routes.findIndex((r) => r.handle === 'filesystem');
routes.splice(fs < 0 ? 0 : fs, 0, ...headerRoutes);

// Replace the SSR catch-all (and the server-rendered /404) with the static pages.
const out = (p) => fileURLToPath(new URL(`static/${p}`, root));
const exists = async (p) => access(out(p)).then(() => true, () => false);
const en = (await exists('404.html')) ? '/404.html' : null;
const ar = (await exists('ar/404/index.html')) ? '/ar/404/index.html' : (await exists('ar/404.html')) ? '/ar/404.html' : null;
if (en) {
  // Drop every existing catch-all (SSR or the adapter's own /404.html one) so the AR rule can go first.
  const kept = routes.filter((r) => !(r.src === '^/.*$' || (r.dest === '_render' && r.src === '^/404/?$')));
  if (ar) kept.push({ src: '^/ar(?:/.*)?$', dest: ar, status: 404 });
  kept.push({ src: '^/.*$', dest: en, status: 404 });
  cfg.routes = kept;
} else {
  cfg.routes = routes;
  logger.warn('404.html not found; kept the server catch-all');
}
await writeFile(cfgPath, JSON.stringify(cfg, null, '\t'));
logger.info(`headers + static 404 routes written (${en ?? '-'}, ${ar ?? '-'})`);
