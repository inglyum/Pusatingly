#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — RICONCILIAZIONE CATALOGO
   ------------------------------------------------------------
   Confronta il crawl del sito di riferimento con il catalogo INGLY
   e produce un report di copertura: quali tipologie del riferimento
   non hanno ancora un corrispettivo nel nostro catalogo.

   Richiede docs/generated/reference-crawl.json, prodotto da
   scripts/crawl-reference.mjs. Se non c'è, lo dice e si ferma:
   è la condizione normale finché il dominio resta irraggiungibile
   (docs/PUSATERI-SITE-MAP.md §0).

   Uso:  node scripts/reconcile-catalog.mjs
   ============================================================ */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

const CRAWL = 'docs/generated/reference-crawl.json';

if (!existsSync(join(ROOT, CRAWL))) {
  console.log(`\n  Nessun crawl disponibile (${CRAWL}).`);
  console.log(`  Esegui prima:  node scripts/crawl-reference.mjs`);
  console.log(`  Se il dominio è bloccato, vedi docs/PUSATERI-SITE-MAP.md §0.\n`);
  process.exit(0);
}

const crawl = read(CRAWL);
const products = read('data/products.json');
const categories = read('data/categories.json');
const migration = read('data/migration.json');

/* Parole chiave che descrivono una tipologia di prodotto. Il confronto è
   volutamente lessicale e approssimativo: serve a segnalare buchi di
   copertura, non a fare corrispondenze uno-a-uno fra prodotti. */
const stop = new Set(['il', 'lo', 'la', 'i', 'gli', 'le', 'di', 'a', 'da', 'in', 'con',
  'su', 'per', 'tra', 'fra', 'e', 'o', 'un', 'una', 'del', 'della', 'dei', 'delle',
  'al', 'alla', 'nel', 'sul', 'personalizzato', 'personalizzata', 'personalizzabile',
  'legno', 'artigianale', 'lista', 'completa', 'archivi']);

const words = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .split(/[^a-z0-9]+/)
  .filter((w) => w.length > 3 && !stop.has(w));

const ourVocabulary = new Set(
  products.flatMap((p) => [
    ...words(p.subtitle),
    ...words(p.name),
    ...(p.tags || []).flatMap(words)
  ]).concat(
    categories.flatMap((c) => [
      ...words(c.name.it),
      ...(c.subcategories || []).flatMap((s) => words(s.name.it))
    ])
  )
);

const refPages = (crawl.pages || []).filter((p) => p.path !== '/');
const gaps = [];

for (const page of refPages) {
  const terms = [...new Set([...words(page.h1), ...words(page.title)])];
  if (!terms.length) continue;
  const covered = terms.filter((w) => ourVocabulary.has(w));
  const ratio = covered.length / terms.length;
  if (ratio < 0.34) {
    gaps.push({ path: page.path, h1: page.h1 || page.title, terms, ratio });
  }
}

gaps.sort((a, b) => a.ratio - b.ratio);

const covered = refPages.length - gaps.length;
const pct = refPages.length ? Math.round((covered / refPages.length) * 100) : 0;

let md = `# RECONCILE REPORT — copertura del catalogo

> Generato da \`node scripts/reconcile-catalog.mjs\` il ${new Date().toISOString().slice(0, 10)}.
> Crawl di riferimento: ${crawl.base} (${crawl.pageCount} pagine, ${crawl.crawledAt?.slice(0, 10)})

## Sintesi

| | Valore |
| - | ------ |
| Pagine di riferimento analizzate | ${refPages.length} |
| Con corrispondenza nel catalogo INGLY | ${covered} (${pct}%) |
| Senza corrispondenza evidente | ${gaps.length} |
| Prodotti INGLY | ${products.length} |
| Categorie INGLY | ${categories.length} |

Il confronto è **lessicale**: segnala dove il catalogo INGLY non ha vocabolario
sovrapponibile a una pagina del riferimento. Non è una prova di assenza — va
letto come lista di controllo, non come elenco di errori.

## Categorie mappate

| Riferimento | INGLY | Prodotti |
| ----------- | ----- | -------- |
`;

for (const m of migration.categoryMap.filter((x) => x.id)) {
  const n = products.filter((p) => p.category === m.id).length;
  md += `| ${m.from} | ${m.to} | ${n} |\n`;
}

md += `\n## Pagine senza corrispondenza evidente\n\n`;

if (!gaps.length) {
  md += `Nessuna. Ogni pagina del riferimento trova vocabolario corrispondente nel catalogo INGLY.\n`;
} else {
  md += `| Percorso di riferimento | Titolo | Copertura |\n| --- | --- | --- |\n`;
  for (const g of gaps.slice(0, 120)) {
    md += `| \`${g.path}\` | ${(g.h1 || '').slice(0, 70)} | ${Math.round(g.ratio * 100)}% |\n`;
  }
  md += `\n### Cosa farne

Ogni riga è una domanda, non un compito: *questa tipologia serve al catalogo
INGLY?* Se sì, si aggiunge una voce al seed
(\`scripts/seed/catalog-seed.mjs\`) e si rigenera con \`npm run build:catalog\`.
Se no, si ignora — INGLY non deve replicare l'inventario di nessuno, deve
coprire ciò che il laboratorio produce davvero.
`;
}

mkdirSync(join(ROOT, 'docs/generated'), { recursive: true });
writeFileSync(join(ROOT, 'docs/generated/reconcile-report.md'), md, 'utf8');

console.log(`\n  RICONCILIAZIONE`);
console.log(`  ${'─'.repeat(46)}`);
console.log(`  Pagine di riferimento   ${refPages.length}`);
console.log(`  Con corrispondenza      ${covered} (${pct}%)`);
console.log(`  Da valutare             ${gaps.length}`);
console.log(`\n  Report: docs/generated/reconcile-report.md\n`);
