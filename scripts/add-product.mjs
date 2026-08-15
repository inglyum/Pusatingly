#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — NUOVO PRODOTTO
   ------------------------------------------------------------
   Crea la voce di seed per una nuova creazione, guidando la
   compilazione e validando ogni riferimento contro i dati reali.

   Non scrive direttamente in data/products.json: aggiunge la riga
   al seed (scripts/seed/catalog-seed.mjs) e rigenera il catalogo,
   così la fonte resta una sola.

   Uso:  npm run add-product
   ============================================================ */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

const categories = read('data/categories.json');
const materials = read('data/materials.json');
const technologies = read('data/technologies.json');
const migration = read('data/migration.json');
const products = read('data/products.json');

const rl = createInterface({ input: stdin, output: stdout });
const ask = (q) => rl.question(q);

const list = (items, key = 'id') => items.map((i) => i[key]).join(' · ');

async function askOne(label, valid) {
  while (true) {
    const v = (await ask(`  ${label}: `)).trim();
    if (!valid || valid.includes(v)) return v;
    console.log(`  ✗ valore non ammesso. Ammessi: ${valid.join(', ')}`);
  }
}

async function askMany(label, valid) {
  while (true) {
    const raw = (await ask(`  ${label} (separati da virgola): `)).trim();
    const vals = raw.split(',').map((s) => s.trim()).filter(Boolean);
    const bad = vals.filter((v) => !valid.includes(v));
    if (!vals.length) { console.log('  ✗ almeno un valore richiesto'); continue; }
    if (bad.length) { console.log(`  ✗ non ammessi: ${bad.join(', ')}`); continue; }
    return vals;
  }
}

console.log('\n  NUOVA CREAZIONE — INGLY DESIGN');
console.log(`  ${'─'.repeat(56)}\n`);

const catId = await askOne(`Categoria\n    (${list(categories)})\n  scegli`, categories.map((c) => c.id));
const cat = categories.find((c) => c.id === catId);

const subId = await askOne(
  `Sottocategoria\n    (${list(cat.subcategories)})\n  scegli`,
  cat.subcategories.map((s) => s.id)
);

let name;
const reserved = migration.reservedNames.list.map((n) => n.toLowerCase());
const takenNames = new Set(products.map((p) => p.name.toLowerCase()));
while (true) {
  name = (await ask('  Nome proprio (es. Trinacria): ')).trim();
  if (!name) continue;
  const low = name.toLowerCase();
  if (takenNames.has(low)) { console.log('  ✗ nome già in uso nel catalogo'); continue; }
  const hit = reserved.find((r) => low === r || low.includes(r));
  if (hit) { console.log(`  ✗ "${hit}" è nomenclatura riservata (docs/MIGRATION-MAP.md §4)`); continue; }
  break;
}

const subtitle = (await ask('  Descrittore funzionale (es. Portamenù A4 ad anelli in betulla): ')).trim();

const mats = await askMany(`Materiali\n    (${list(materials)})\n  scegli`, materials.map((m) => m.id));
const techs = await askMany(`Tecnologie\n    (${list(technologies)})\n  scegli`, technologies.map((t) => t.id));
const uses = await askMany(`Destinazioni d'uso\n    (${list(migration.collections)})\n  scegli`, migration.collections.map((c) => c.id));

const audience = await askOne('Pubblico (b2b / b2c / both)', ['b2b', 'b2c', 'both']);

console.log('\n  Dimensioni — invio vuoto per terminare.');
const dimensions = {};
while (true) {
  const k = (await ask('    chiave (larghezza/altezza/profondita/spessore/diametro…): ')).trim();
  if (!k) break;
  const v = (await ask('    valore (es. 23 cm): ')).trim();
  if (v) dimensions[k] = v;
}

const customization = (await ask('\n  Personalizzazioni (separate da virgola, vuoto = non personalizzabile): '))
  .split(',').map((s) => s.trim()).filter(Boolean);

console.log('\n  Dettaglio — 1-2 frasi concrete su cosa risolve questa creazione.');
console.log('  Testo ORIGINALE INGLY: non copiare da altri cataloghi.');
const detail = (await ask('  > ')).trim();

const featured = (await ask('\n  In evidenza in homepage? (s/N): ')).trim().toLowerCase().startsWith('s');

rl.close();

/* ---- scrittura nel seed ------------------------------------------------ */

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const arr = (a) => `[${a.map((x) => `'${esc(x)}'`).join(', ')}]`;
const dims = `{ ${Object.entries(dimensions).map(([k, v]) => `${k}: '${esc(v)}'`).join(', ')} }`;

const entry = `    ['${esc(name)}', '${esc(subtitle)}', '${esc(subId)}', ${arr(mats)}, ${arr(techs)}, ${dims}, ${arr(uses)}, '${audience}', '${esc(detail)}', ${arr(customization)}${featured ? ', true' : ''}]`;

const seedPath = join(ROOT, 'scripts/seed/catalog-seed.mjs');
let seed = readFileSync(seedPath, 'utf8');

// Si inserisce in coda al blocco della categoria scelta.
const blockRe = new RegExp(`(  '${catId}': \\[)([\\s\\S]*?)(\\n  \\])`);
const match = seed.match(blockRe);
if (!match) {
  console.error(`\n  ✗ Blocco "${catId}" non trovato nel seed. Aggiungi la voce a mano:\n\n${entry}\n`);
  process.exit(1);
}

seed = seed.replace(blockRe, `$1$2,\n${entry}$3`);
writeFileSync(seedPath, seed, 'utf8');

const nextId = `${catId}-${String(products.filter((p) => p.category === catId).length + 1).padStart(3, '0')}`;

console.log(`\n  ✓ Voce aggiunta al seed nella categoria "${catId}"`);
console.log(`\n  Passi successivi:`);
console.log(`    npm run build:catalog     genera il record e l'id`);
console.log(`    npm run placeholders      crea il placeholder`);
console.log(`    npm test                  valida il catalogo`);
console.log(`\n  Quando avrai la foto:`);
console.log(`    cp foto.webp assets/images/products/<id>.webp && npm run sync-images\n`);
