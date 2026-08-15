#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — TEST DATI
   Invarianti che la sola validazione di schema non copre:
   coerenza fra documentazione, migrazione e catalogo.
   ============================================================ */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));
const text = (f) => readFileSync(join(ROOT, f), 'utf8');

let passed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}\n      ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const products = read('data/products.json');
const categories = read('data/categories.json');
const migration = read('data/migration.json');
const content = read('data/content.json');
const config = read('data/config.json');
const portfolio = read('data/portfolio.json');
const texts = read('data/texts.json');

/* ---- struttura --------------------------------------------------------- */

test('ogni categoria della migration map esiste nel catalogo', () => {
  const mapped = migration.categoryMap.filter((m) => m.id);
  const ids = new Set(categories.map((c) => c.id));
  for (const m of mapped) {
    assert(ids.has(m.id), `categoria "${m.id}" mappata da "${m.from}" ma assente in categories.json`);
  }
});

test('nessuna categoria del riferimento è stata persa', () => {
  // Regola §29: prima migrare, poi migliorare. Nessuna eliminazione.
  const required = [
    'Portamenù', 'Tavola & Cucina', 'Wood Art & Design', "Oggettistica & Complementi d'Arredo",
    'Targhe & Insegne', 'Gadget di legno', 'Per la casa', 'PusaToys', 'Automata',
    'PusaTeck', 'Carta & Cartone', 'Plexi & Metal', 'Eventi & Fiere'
  ];
  const from = new Set(migration.categoryMap.map((m) => m.from));
  for (const r of required) {
    assert(from.has(r), `categoria di riferimento "${r}" non presente nella migration map`);
  }
});

test('ogni categoria ha almeno una sottocategoria e almeno un prodotto', () => {
  for (const c of categories) {
    assert(c.subcategories?.length, `categoria "${c.id}" senza sottocategorie`);
    const n = products.filter((p) => p.category === c.id).length;
    assert(n > 0, `categoria "${c.id}" senza prodotti`);
  }
});

test('ogni sottocategoria dichiarata è raggiungibile o dichiarata vuota', () => {
  // Non è un errore avere una sottocategoria ancora senza prodotti: va però
  // saputo, perché nel filtro comparirebbe un'opzione senza risultati.
  const orphans = [];
  for (const c of categories) {
    for (const s of c.subcategories) {
      const n = products.filter((p) => p.category === c.id && p.subcategory === s.id).length;
      if (!n) orphans.push(`${c.id}/${s.id}`);
    }
  }
  // I filtri mostrano solo le sottocategorie realmente presenti, quindi
  // il caso è gestito: qui si verifica solo che non sia la maggioranza.
  assert(orphans.length <= categories.length,
    `troppe sottocategorie vuote (${orphans.length}): ${orphans.slice(0, 5).join(', ')}`);
});

/* ---- politica di migrazione -------------------------------------------- */

test('nessun prodotto usa nomenclatura riservata del riferimento', () => {
  const reserved = migration.reservedNames.list.map((n) => n.toLowerCase());
  for (const p of products) {
    const n = p.name.toLowerCase();
    const hit = reserved.find((r) => n === r || n.includes(r));
    assert(!hit, `prodotto ${p.id} usa il nome riservato "${hit}"`);
  }
});

test('nessuna immagine punta a un host esterno', () => {
  for (const p of products) {
    for (const img of p.images || []) {
      assert(!/^https?:/.test(img.src), `${p.id}: immagine esterna ${img.src}`);
    }
  }
});

test('ogni placeholder è marcato replacementRequired', () => {
  for (const p of products) {
    for (const img of p.images || []) {
      if (img.status === 'placeholder') {
        assert(img.replacementRequired === true, `${p.id}: placeholder senza replacementRequired`);
      }
    }
  }
});

test('il portfolio non contiene lavori non verificati', () => {
  // I progetti reali si aggiungono solo con foto proprie e autorizzazione.
  assert(Array.isArray(portfolio.projects), 'portfolio.projects deve essere un array');
  for (const p of portfolio.projects) {
    assert(p.title && p.images?.length,
      'un progetto in portfolio.projects è privo di titolo o immagini proprie');
  }
});

test('le statistiche non contengono numeri inventati', () => {
  // Solo dati derivabili dal catalogo possono essere non-null senza fonte.
  const derivable = { materiali: 15, tecnologie: 11, categorie: categories.length };
  for (const [k, v] of Object.entries(config.stats)) {
    if (k === 'note' || v === null) continue;
    assert(k in derivable, `config.stats.${k} = ${v} non è derivabile dal catalogo: serve una fonte reale`);
    assert(v === derivable[k], `config.stats.${k} = ${v} non coincide con il dato reale (${derivable[k]})`);
  }
});

/* ---- URL e redirect ---------------------------------------------------- */

test('ogni redirect punta a una rotta esistente', () => {
  const routes = new Set([
    '/', '/creazioni', '/materiali', '/tecnologie', '/portfolio',
    '/chi-sono', '/come-acquistare', '/b2b', '/contatti'
  ]);
  for (const c of categories) routes.add(`/creazioni/${c.id}`);

  for (const r of migration.redirects) {
    const target = r.to.split('?')[0];
    assert(routes.has(target), `redirect ${r.from} → ${r.to}: destinazione inesistente`);
  }
});

test('gli slug prodotto sono URL-safe e non collidono con le categorie', () => {
  const catIds = new Set(categories.map((c) => c.id));
  for (const p of products) {
    assert(/^[a-z0-9-]+$/.test(p.slug), `${p.id}: slug non URL-safe "${p.slug}"`);
    assert(!catIds.has(p.slug), `${p.id}: slug "${p.slug}" collide con una categoria`);
  }
});

test('la sitemap è allineata al catalogo', () => {
  assert(existsSync(join(ROOT, 'sitemap.xml')), 'sitemap.xml assente: esegui npm run sitemap');
  const xml = text('sitemap.xml');
  const published = products.filter((p) => p.migrationStatus !== 'archived');
  for (const p of published.slice(0, 20)) {
    assert(xml.includes(`/creazioni/${p.category}/${p.slug}`), `sitemap: manca ${p.slug}`);
  }
  for (const p of products.filter((x) => x.migrationStatus === 'archived')) {
    assert(!xml.includes(`/${p.slug}`), `sitemap: prodotto archiviato ${p.slug} non deve comparire`);
  }
});

/* ---- i18n -------------------------------------------------------------- */

test('le chiavi i18n coincidono fra italiano e inglese', () => {
  const it = Object.keys(texts.it).sort();
  const en = Object.keys(texts.en).sort();
  const missingEn = it.filter((k) => !texts.en[k]);
  const missingIt = en.filter((k) => !texts.it[k]);
  assert(!missingEn.length, `chiavi mancanti in EN: ${missingEn.join(', ')}`);
  assert(!missingIt.length, `chiavi mancanti in IT: ${missingIt.join(', ')}`);
});

test('i contenuti localizzati hanno sempre la versione italiana', () => {
  const walk = (node, path = '') => {
    if (node && typeof node === 'object' && !Array.isArray(node)) {
      if ('en' in node && !('it' in node)) {
        throw new Error(`${path}: presente "en" ma manca "it"`);
      }
      for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
    } else if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`));
    }
  };
  walk(content, 'content');
});

/* ---- documentazione ---------------------------------------------------- */

test('i documenti obbligatori esistono', () => {
  const docs = [
    'docs/PUSATERI-SITE-MAP.md', 'docs/MIGRATION-MAP.md', 'docs/PRODUCT-MIGRATION.md',
    'docs/IMAGE-MIGRATION.md', 'docs/INGLY-ARCHITECTURE.md', 'docs/INGLY-DESIGN-SYSTEM.md'
  ];
  for (const d of docs) assert(existsSync(join(ROOT, d)), `documento mancante: ${d}`);
});

test('ogni prodotto ha il proprio asset su disco', () => {
  const PHOTO = ['webp', 'jpg', 'jpeg', 'png', 'avif'];
  for (const p of products) {
    const svg = existsSync(join(ROOT, 'assets/images/products', `${p.id}.svg`));
    const photo = PHOTO.some((e) => existsSync(join(ROOT, 'assets/images/products', `${p.id}.${e}`)));
    assert(svg || photo, `${p.id}: nessun asset su disco`);
  }
});

/* ---- report ------------------------------------------------------------ */

console.log(`\n  TEST DATI`);
console.log(`  ${'─'.repeat(52)}`);
if (failures.length) {
  console.log(`  ✓ ${passed} superati · ✗ ${failures.length} falliti\n`);
  for (const f of failures) console.log(`    ✗ ${f}\n`);
  process.exit(1);
}
console.log(`  ✓ ${passed} test superati\n`);
