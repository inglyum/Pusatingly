#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — SITEMAP
   Genera sitemap.xml da data/*.json.
   L'elenco degli URL vive in assets/js/sitemap.js, condiviso con
   l'Admin: così la sitemap pubblicata dal pannello e quella
   generata qui non possono divergere.
   Uso:  npm run sitemap
   ============================================================ */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { sitemapXml, sitemapUrls, pubblicati } from '../assets/js/sitemap.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

const data = {
  config: read('data/config.json'),
  products: read('data/products.json'),
  categories: read('data/categories.json'),
  /* Le schede macchina nascono dallo stesso file che disegna la sezione xTool:
     se divergessero, la sitemap dichiarerebbe pagine che non esistono. */
  xtool: read('data/xtool.json'),
  info: read('data/informazioni.json')
};

writeFileSync(join(ROOT, 'sitemap.xml'), sitemapXml(data), 'utf8');

const vivi = pubblicati(data.products);
const archived = data.products.length - vivi.length;
console.log(`\n  Sitemap generata: ${sitemapUrls(data).length} URL`);
console.log(`    pagine fisse   10`);
console.log(`    categorie      ${data.categories.length}`);
console.log(`    prodotti       ${vivi.length}${archived ? ` (${archived} archiviati esclusi)` : ''}\n`);
