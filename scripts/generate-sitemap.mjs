#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — SITEMAP
   Genera sitemap.xml da data/*.json.
   I prodotti archiviati sono esclusi (docs/PRODUCT-MIGRATION.md §3).
   Uso:  npm run sitemap
   ============================================================ */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

const config = read('data/config.json');
const products = read('data/products.json');
const categories = read('data/categories.json');

const ORIGIN = (config.site?.url || 'https://inglydesign.it').replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/creazioni', priority: '0.9', changefreq: 'weekly' },
  { loc: '/materiali', priority: '0.7', changefreq: 'monthly' },
  { loc: '/tecnologie', priority: '0.7', changefreq: 'monthly' },
  { loc: '/portfolio', priority: '0.6', changefreq: 'monthly' },
  { loc: '/chi-sono', priority: '0.7', changefreq: 'monthly' },
  { loc: '/come-acquistare', priority: '0.7', changefreq: 'monthly' },
  { loc: '/b2b', priority: '0.8', changefreq: 'monthly' },
  { loc: '/contatti', priority: '0.8', changefreq: 'monthly' }
];

for (const c of categories) {
  urls.push({ loc: `/creazioni/${c.id}`, priority: '0.8', changefreq: 'weekly' });
}

const published = products.filter((p) => p.migrationStatus !== 'archived');
for (const p of published) {
  urls.push({ loc: `/creazioni/${p.category}/${p.slug}`, priority: '0.6', changefreq: 'monthly' });
}

const NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="${NS}">
${urls.map((u) => `  <url>
    <loc>${ORIGIN}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

writeFileSync(join(ROOT, 'sitemap.xml'), xml, 'utf8');

const archived = products.length - published.length;
console.log(`\n  Sitemap generata: ${urls.length} URL`);
console.log(`    pagine fisse   9`);
console.log(`    categorie      ${categories.length}`);
console.log(`    prodotti       ${published.length}${archived ? ` (${archived} archiviati esclusi)` : ''}\n`);
