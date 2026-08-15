#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — GENERATORE PLACEHOLDER
   ------------------------------------------------------------
   Crea un SVG per ogni prodotto e per ogni categoria.

   Perché SVG e non bitmap (docs/IMAGE-MIGRATION.md §4):
   - ~1 KB per file: il catalogo completo pesa quanto una foto
   - nitidi a qualsiasi densità di schermo
   - deterministici: stesso prodotto = stesso placeholder
   - 4:3 fisso, come le foto reali → nessun layout shift alla sostituzione

   NON sovrascrive un placeholder se esiste già la foto reale
   (assets/images/products/<id>.webp|jpg|png).

   Uso:  npm run placeholders
   ============================================================ */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

const products = read('data/products.json');
const categories = read('data/categories.json');

const W = 800;
const H = 600;

/* Tinta per categoria: variazione di luminosità sull'antracite del brand,
   così la griglia non è una parete piatta di rettangoli identici. */
const TINTS = {
  'soluzioni-menu': ['#1F2328', '#2A2F36'],
  'tavola-cucina': ['#20262B', '#2C333A'],
  'wood-art-design': ['#232227', '#2F2E35'],
  'oggettistica': ['#1E2226', '#292E34'],
  'targhe-insegne': ['#1D2126', '#282D33'],
  'gadget': ['#212529', '#2D3238'],
  'casa': ['#222429', '#2E3137'],
  'kids': ['#1F2429', '#2B3138'],
  'arte-movimento': ['#1E2125', '#2A2E34'],
  'tech': ['#1C2126', '#272E35'],
  'carta-packaging': ['#212429', '#2C3036'],
  'plexi-metallo': ['#1D2025', '#282C33'],
  'eventi': ['#20232A', '#2B2F37']
};

const ACCENT = '#00E6D2';

/** Escape per testo dentro XML. */
const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** Manda a capo su più righe rispettando una larghezza in caratteri. */
function wrap(text, maxChars, maxLines) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (!line) { line = w; continue; }
    if ((`${line} ${w}`).length <= maxChars) line += ` ${w}`;
    else { lines.push(line); line = w; }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[,;:.\s]+$/, '')}…`;
  }
  return lines;
}

function svg({ eyebrow, title, tint, mark }) {
  const [c1, c2] = tint;
  const lines = wrap(title, 24, 3);
  const startY = 330 - (lines.length - 1) * 24;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="#ffffff" stroke-opacity=".035" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="#ffffff" stroke-opacity=".07"/>
  <line x1="40" y1="${startY - 62}" x2="104" y2="${startY - 62}" stroke="${ACCENT}" stroke-width="2"/>
  <text x="40" y="${startY - 84}" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="17" font-weight="600" letter-spacing="3.4" fill="#8A9099">${esc(eyebrow.toUpperCase())}</text>
  ${lines.map((l, i) => `<text x="40" y="${startY + i * 48}" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="40" font-weight="600" fill="#FFFFFF">${esc(l)}</text>`).join('\n  ')}
  <text x="40" y="${H - 52}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="15" letter-spacing="1.6" fill="#767C85">${esc(mark)}</text>
  <text x="${W - 40}" y="${H - 52}" text-anchor="end" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="15" font-weight="600" letter-spacing="2.4" fill="#5E646C">INGLY DESIGN</text>
</svg>
`;
}

/* ---- generazione ------------------------------------------------------ */

const dirs = ['assets/images/products', 'assets/images/categories'];
for (const d of dirs) mkdirSync(join(ROOT, d), { recursive: true });

const PHOTO_EXT = ['webp', 'jpg', 'jpeg', 'png', 'avif'];
const hasRealPhoto = (dir, id) =>
  PHOTO_EXT.some((ext) => existsSync(join(ROOT, dir, `${id}.${ext}`)));

let written = 0;
let skipped = 0;

for (const p of products) {
  if (hasRealPhoto('assets/images/products', p.id)) { skipped++; continue; }
  const cat = categories.find((c) => c.id === p.category);
  writeFileSync(
    join(ROOT, 'assets/images/products', `${p.id}.svg`),
    svg({
      eyebrow: cat ? cat.name.it : p.category,
      title: p.name,
      tint: TINTS[p.category] || TINTS['soluzioni-menu'],
      mark: `${p.id.toUpperCase()} · DA SOSTITUIRE`
    }),
    'utf8'
  );
  written++;
}

for (const c of categories) {
  if (hasRealPhoto('assets/images/categories', c.id)) { skipped++; continue; }
  writeFileSync(
    join(ROOT, 'assets/images/categories', `${c.id}.svg`),
    svg({
      eyebrow: 'Catalogo creazioni',
      title: c.name.it,
      tint: TINTS[c.id] || TINTS['soluzioni-menu'],
      mark: `${c.id.toUpperCase()} · DA SOSTITUIRE`
    }),
    'utf8'
  );
  written++;
}

console.log(`\n  Placeholder generati: ${written}`);
if (skipped) console.log(`  Saltati (foto reale già presente): ${skipped}`);
console.log('');
