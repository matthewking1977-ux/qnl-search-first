// Local audit server for the built static output, approximating Vercel's CDN:
// Brotli/gzip compression and immutable caching for hashed assets.
// Usage: node scripts/serve-static.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';

const ROOT = '.vercel/output/static';
const PORT = Number(process.argv[2] || 4321);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain', '.xml': 'application/xml',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt', '.xml']);
const cache = new Map();

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    path = normalize(path).replace(/^(\.\.[/\\])+/, '');
    let file = join(ROOT, path);
    let s = await stat(file).catch(() => null);
    if (s?.isDirectory()) { file = join(file, 'index.html'); s = await stat(file).catch(() => null); }
    if (!s && !extname(file)) { file = file + '.html'; s = await stat(file).catch(() => null); }
    if (!s) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('Not found'); }
    const ext = extname(file);
    const headers = {
      'content-type': TYPES[ext] || 'application/octet-stream',
      'cache-control': file.includes('/_astro/') || file.includes('/fonts/') ? 'public, max-age=31536000, immutable' : ext === '.html' ? 'public, max-age=0, must-revalidate' : 'public, max-age=86400',
      'x-content-type-options': 'nosniff',
    };
    let body = await readFile(file);
    const ae = String(req.headers['accept-encoding'] || '');
    if (COMPRESSIBLE.has(ext)) {
      const key = file + (ae.includes('br') ? ':br' : ae.includes('gzip') ? ':gz' : '');
      if (!cache.has(key)) cache.set(key, ae.includes('br') ? brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }) : ae.includes('gzip') ? gzipSync(body, { level: 9 }) : body);
      body = cache.get(key);
      if (ae.includes('br')) headers['content-encoding'] = 'br'; else if (ae.includes('gzip')) headers['content-encoding'] = 'gzip';
      headers['vary'] = 'accept-encoding';
    }
    // Range support for video
    const range = req.headers.range;
    if (range && (ext === '.mp4' || ext === '.webm')) {
      const [a, b] = range.replace('bytes=', '').split('-');
      const start = Number(a), end = b ? Number(b) : body.length - 1;
      res.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${body.length}`, 'accept-ranges': 'bytes', 'content-length': end - start + 1 });
      return res.end(body.subarray(start, end + 1));
    }
    res.writeHead(200, { ...headers, 'content-length': body.length, 'accept-ranges': 'bytes' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (e) {
    res.writeHead(500); res.end(String(e));
  }
}).listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT}`));
