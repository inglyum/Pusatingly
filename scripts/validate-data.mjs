#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — VALIDAZIONE DATI
   ------------------------------------------------------------
   Blocca la build se il catalogo non è integro.
   Controlli documentati in docs/PRODUCT-MIGRATION.md §8.

   Uso:  npm run validate
   ============================================================ */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const products = read('data/products.json');
const categories = read('data/categories.json');
const materials = read('data/materials.json');
const technologies = read('data/technologies.json');
const migration = read('data/migration.json');
const content = read('data/content.json');
const config = read('data/config.json');

const catIds = new Set(categories.map((c) => c.id));
const matIds = new Set(materials.map((m) => m.id));
const techIds = new Set(technologies.map((t) => t.id));
const useIds = new Set((migration.collections || []).map((c) => c.id));
const migStates = new Set((migration.migrationStates || []).map((s) => s.id));
const repStates = new Set((migration.replacementStates || []).map((s) => s.id));

const REQUIRED = ['id', 'slug', 'name', 'subtitle', 'category', 'subcategory', 'description', 'shortDescription', 'images', 'migrationStatus', 'replacementStatus'];

/* ---- 1. unicità -------------------------------------------------------- */

const seenIds = new Set();
const seenSlugs = new Set();
const seenNames = new Set();

for (const p of products) {
  if (seenIds.has(p.id)) err(`id duplicato: ${p.id}`);
  seenIds.add(p.id);

  if (seenSlugs.has(p.slug)) err(`slug duplicato: ${p.slug} (${p.id})`);
  seenSlugs.add(p.slug);

  const key = String(p.name).toLowerCase();
  if (seenNames.has(key)) err(`nome prodotto duplicato: "${p.name}" (${p.id})`);
  seenNames.add(key);
}

/* ---- 2. campi obbligatori e integrità referenziale --------------------- */

for (const p of products) {
  for (const field of REQUIRED) {
    const v = p[field];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) {
      err(`${p.id}: campo obbligatorio mancante o vuoto → ${field}`);
    }
  }

  if (!catIds.has(p.category)) err(`${p.id}: categoria inesistente "${p.category}"`);
  else {
    const cat = categories.find((c) => c.id === p.category);
    const subIds = new Set((cat.subcategories || []).map((s) => s.id));
    if (!subIds.has(p.subcategory)) {
      err(`${p.id}: sottocategoria "${p.subcategory}" non appartiene a "${p.category}"`);
    }
  }

  for (const m of p.materials || []) if (!matIds.has(m)) err(`${p.id}: materiale inesistente "${m}"`);
  for (const x of p.technologies || []) if (!techIds.has(x)) err(`${p.id}: tecnologia inesistente "${x}"`);
  for (const u of p.uses || []) if (!useIds.has(u)) err(`${p.id}: destinazione d'uso inesistente "${u}"`);

  if (!migStates.has(p.migrationStatus)) err(`${p.id}: migrationStatus non ammesso "${p.migrationStatus}"`);
  if (!repStates.has(p.replacementStatus)) err(`${p.id}: replacementStatus non ammesso "${p.replacementStatus}"`);

  if (!['b2b', 'b2c', 'both'].includes(p.audience)) err(`${p.id}: audience non ammesso "${p.audience}"`);

  if (!/^[a-z0-9-]+$/.test(p.slug)) err(`${p.id}: slug non valido "${p.slug}"`);
}

/* ---- 3. accessibilità: ogni immagine deve avere alt -------------------- */

for (const p of products) {
  for (const [i, img] of (p.images || []).entries()) {
    if (!img.alt || !String(img.alt).trim()) err(`${p.id}: images[${i}] senza alt`);
    if (!img.src) err(`${p.id}: images[${i}] senza src`);
    if (/^https?:/.test(img.src || '')) err(`${p.id}: images[${i}] punta a un host esterno — vietato`);
    if (img.status === 'placeholder' && img.replacementRequired !== true) {
      warn(`${p.id}: placeholder senza replacementRequired: true`);
    }
  }
}

/* ---- 4. asset presenti ------------------------------------------------- */

let missingAssets = 0;
for (const p of products) {
  const svg = join(ROOT, 'assets/images/products', `${p.id}.svg`);
  const hasPhoto = ['webp', 'jpg', 'jpeg', 'png', 'avif']
    .some((e) => existsSync(join(ROOT, 'assets/images/products', `${p.id}.${e}`)));
  if (!existsSync(svg) && !hasPhoto) {
    missingAssets++;
    err(`${p.id}: nessun asset (né placeholder né foto). Esegui: npm run placeholders`);
  }
}

/* ---- 5. SEO ------------------------------------------------------------ */

for (const p of products) {
  const title = p.seo?.title || '';
  const desc = p.seo?.description || '';
  if (!title) err(`${p.id}: seo.title mancante`);
  else if (title.length > 65) warn(`${p.id}: seo.title lungo (${title.length} car.)`);
  if (!desc) err(`${p.id}: seo.description mancante`);
  else if (desc.length > 160) warn(`${p.id}: seo.description lunga (${desc.length} car.)`);
}

for (const c of categories) {
  if (!c.seo?.title) err(`categoria ${c.id}: seo.title mancante`);
  if (!c.seo?.description) err(`categoria ${c.id}: seo.description mancante`);
}

/* ---- 6. nomi riservati del sito di riferimento ------------------------- */

const reserved = (migration.reservedNames?.list || []).map((n) => n.toLowerCase());
for (const p of products) {
  const name = String(p.name).toLowerCase();
  const hit = reserved.find((r) => name === r || name.includes(r));
  if (hit) err(`${p.id}: il nome "${p.name}" collide con la nomenclatura riservata "${hit}" — vedi docs/MIGRATION-MAP.md §4`);
}

/* ---- 7. copertura della tassonomia ------------------------------------ */

for (const c of categories) {
  const count = products.filter((p) => p.category === c.id).length;
  if (!count) warn(`categoria "${c.id}" senza prodotti`);
}

/* ---- 8. coerenza dei contenuti ---------------------------------------- */

if (!config.contact?.email) warn('config.contact.email non valorizzata');
if (!config.contact?.whatsapp) warn('config.contact.whatsapp non valorizzata: il pulsante WhatsApp resta nascosto');
if (!content.chiSono?.biografia?.it) warn('content.chiSono.biografia vuota: da completare con il percorso reale di Giuseppe');

const stats = config.stats || {};
for (const [k, v] of Object.entries(stats)) {
  if (k === 'note') continue;
  if (v === null) warn(`config.stats.${k} è null: il contatore non verrà mostrato (comportamento voluto)`);
}

/* ---- report ------------------------------------------------------------ */

const line = '─'.repeat(52);
console.log(`\n  VALIDAZIONE DATI — INGLY DESIGN\n  ${line}`);
console.log(`  Prodotti      ${products.length}`);
console.log(`  Categorie     ${categories.length}`);
console.log(`  Materiali     ${materials.length}`);
console.log(`  Tecnologie    ${technologies.length}`);
console.log(`  Collezioni    ${useIds.size}`);
console.log(`  ${line}`);

if (warnings.length) {
  console.log(`\n  AVVISI (${warnings.length}) — non bloccanti`);
  for (const w of warnings) console.log(`    · ${w}`);
}

if (errors.length) {
  console.log(`\n  ERRORI (${errors.length})`);
  for (const e of errors) console.log(`    ✗ ${e}`);
  console.log('');
  process.exit(1);
}

console.log(`\n  ✓ Nessun errore. Catalogo integro.\n`);
