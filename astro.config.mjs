// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// Static-first. Every page is pre-rendered except /search and /ar/search,
// which opt out with `export const prerender = false` so they can render
// results server-side for visitors without JavaScript.
export default defineConfig({
  site: 'https://qnl-search-first.vercel.app',
  output: 'static',
  adapter: vercel(),
  integrations: [preact({ compat: false })],
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'always' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  vite: { plugins: [tailwindcss()] },
});
