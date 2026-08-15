#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — REPORT DI MIGRAZIONE
   ------------------------------------------------------------
   Produce:
     docs/generated/catalog-report.md
     docs/generated/image-report.md

   Sono gli strumenti con cui si pianifica il lavoro residuo:
   quali prodotti vanno ancora sostituiti, quali categorie
   conviene fotografare per prime.

   Uso:  npm run report
   ============================================================ */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

const products = read('data/products.json');
const categories = read('data/categories.json');
const materials = read('data/materials.json');
const technologies = read('data/technologies.json');

mkdirSync(join(ROOT, 'docs/generated'), { recursive: true });

const today = new Date().toISOString().slice(0, 10);
const PHOTO_EXT = ['webp', 'jpg', 'jpeg', 'png', 'avif'];

const hasRealPhoto = (id) =>
  PHOTO_EXT.some((e) => existsSync(join(ROOT, 'assets/images/products', `${id}.${e}`)));

/** Barra di avanzamento testuale a 10 blocchi. */
function bar(done, total, width = 10) {
  const filled = total ? Math.round((done / total) * width) : 0;
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

/* ---- report catalogo --------------------------------------------------- */

const byStatus = {};
for (const p of products) byStatus[p.migrationStatus] = (byStatus[p.migrationStatus] || 0) + 1;

const active = products.filter((p) => p.migrationStatus === 'active').length;

let cat = `# CATALOG REPORT — INGLY DESIGN

> Generato automaticamente da \`npm run report\` il ${today}.
> Non modificare a mano: le modifiche vengono sovrascritte.

## Avanzamento della migrazione

Prodotti totali: **${products.length}** · definitivi INGLY: **${active}** (${pct(active, products.length)}%)

| Stato | Prodotti | Quota |
| ----- | -------- | ----- |
`;

for (const [state, n] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) {
  cat += `| \`${state}\` | ${n} | ${pct(n, products.length)}% |\n`;
}

cat += `
## Per categoria

| Categoria | Prodotti | Definitivi | Avanzamento |
| --------- | -------- | ---------- | ----------- |
`;

for (const c of categories.slice().sort((a, b) => (a.order || 0) - (b.order || 0))) {
  const list = products.filter((p) => p.category === c.id);
  const done = list.filter((p) => p.migrationStatus === 'active').length;
  cat += `| ${c.name.it} | ${list.length} | ${done} | \`${bar(done, list.length)}\` ${pct(done, list.length)}% |\n`;
}

cat += `
## Copertura materiali

| Materiale | Prodotti |
| --------- | -------- |
`;
for (const m of materials) {
  const n = products.filter((p) => (p.materials || []).includes(m.id)).length;
  cat += `| ${m.name.it} | ${n} |\n`;
}

cat += `
## Copertura tecnologie

| Tecnologia | Prodotti |
| ---------- | -------- |
`;
for (const tch of technologies) {
  const n = products.filter((p) => (p.technologies || []).includes(tch.id)).length;
  cat += `| ${tch.name.it} | ${n} |\n`;
}

cat += `
## Prossimo passo

I prodotti in stato \`imported\` hanno struttura, materiali, tecnologie e SEO
definitivi; restano da sostituire fotografie e, dove serve, la descrizione.
La procedura è in \`docs/PRODUCT-MIGRATION.md §4\` e non richiede modifiche al codice.
`;

writeFileSync(join(ROOT, 'docs/generated/catalog-report.md'), cat, 'utf8');

/* ---- report immagini --------------------------------------------------- */

const withPhoto = products.filter((p) => hasRealPhoto(p.id));
const toReplace = products.length - withPhoto.length;

let img = `# IMAGE REPORT — INGLY DESIGN

> Generato automaticamente da \`npm run report\` il ${today}.

## Copertura fotografica

| | Prodotti | Quota |
| - | -------- | ----- |
| Totali | ${products.length} | 100% |
| Con fotografia reale | ${withPhoto.length} | ${pct(withPhoto.length, products.length)}% |
| Con placeholder | ${toReplace} | ${pct(toReplace, products.length)}% |

**Da sostituire: ${toReplace}**

## Per categoria

Ordine consigliato per la sessione fotografica: partire dalle categorie con più
prodotti scoperti dà il massimo effetto visibile a parità di scatti.

| Categoria | Con foto | Totali | Avanzamento |
| --------- | -------- | ------ | ----------- |
`;

const rows = categories.map((c) => {
  const list = products.filter((p) => p.category === c.id);
  const done = list.filter((p) => hasRealPhoto(p.id)).length;
  return { name: c.name.it, done, total: list.length, missing: list.length - done };
}).sort((a, b) => b.missing - a.missing);

for (const r of rows) {
  img += `| ${r.name} | ${r.done} | ${r.total} | \`${bar(r.done, r.total)}\` ${pct(r.done, r.total)}% |\n`;
}

img += `
## Come sostituire una immagine

\`\`\`bash
cp foto-reale.webp assets/images/products/<id>.webp
npm test
\`\`\`

Il front-end usa la foto reale appena esiste: nessuna modifica ai dati è
necessaria per vederla online. L'allineamento dei campi \`status\` e
\`replacementRequired\` serve a mantenere veritiero questo report.

Specifiche degli scatti e checklist di pubblicazione: \`docs/IMAGE-MIGRATION.md §5\` e §8.
`;

writeFileSync(join(ROOT, 'docs/generated/image-report.md'), img, 'utf8');

console.log(`\n  Report generati in docs/generated/`);
console.log(`    catalog-report.md — ${products.length} prodotti, ${active} definitivi`);
console.log(`    image-report.md   — ${withPhoto.length}/${products.length} con foto reale\n`);
