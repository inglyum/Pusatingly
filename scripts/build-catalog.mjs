#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — GENERATORE CATALOGO
   ------------------------------------------------------------
   scripts/seed/catalog-seed.mjs  →  data/products.json

   Espande il seed nello schema completo documentato in
   docs/PRODUCT-MIGRATION.md §2, aggiungendo:
   - id stabili per categoria (sm-001, tc-014, …)
   - slug SEO gerarchici
   - descrizioni composte
   - meta SEO
   - immagini placeholder con replacementRequired: true
   - campi del sistema di sostituzione (§30)

   IMPORTANTE — idempotenza sui campi editati a mano.
   Se data/products.json esiste già, i campi che possono essere stati
   modificati dopo la generazione (immagini reali, migrationStatus,
   descrizioni riviste) vengono PRESERVATI. Il generatore non distrugge
   il lavoro fatto a valle: è il requisito §32.

   Uso:  npm run build:catalog
   ============================================================ */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SEED, PREFIX } from './seed/catalog-seed.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

const categories = read('data/categories.json');
const materials = read('data/materials.json');
const technologies = read('data/technologies.json');

/* ---- utility ---------------------------------------------------------- */

const ACCENTS = { à: 'a', á: 'a', â: 'a', è: 'e', é: 'e', ê: 'e', ì: 'i', í: 'i', î: 'i', ò: 'o', ó: 'o', ô: 'o', ù: 'u', ú: 'u', û: 'u', ç: 'c', '₂': '2', '°': '', '’': '', "'": '-' };

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[àáâèéêìíîòóôùúûç₂°’']/g, (c) => ACCENTS[c] ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

const pad = (n) => String(n).padStart(3, '0');

function nameOf(list, id, lang = 'it') {
  const item = list.find((x) => x.id === id);
  return item ? item.name[lang] : id;
}

/** Unisce una lista in italiano: "a, b e c" */
function joinIt(list) {
  if (list.length === 0) return '';
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(', ')} e ${list[list.length - 1]}`;
}

/** Taglia al confine di parola senza spezzare a metà. */
function clamp(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[,;:.\s]+$/, '')}…`;
}

/** Prima frase del dettaglio, per la descrizione breve. */
function firstSentence(text) {
  const m = text.match(/^[^.!?]+[.!?]/);
  return (m ? m[0] : text).trim();
}

/* ---- composizione dei testi ------------------------------------------- */

/** Minuscola iniziale: i nomi di tecnologia sono titoli, ma qui stanno dentro una frase. */
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

function buildDescription(detail, mats, techs, custom, i) {
  const matNames = joinIt(mats.map((m) => lowerFirst(nameOf(materials, m))));
  const techNames = joinIt(techs.map((t) => lowerFirst(nameOf(technologies, t))));

  // Due varianti alternate: evita che 176 schede aprano tutte allo stesso modo.
  const spec = i % 2 === 0
    ? `Realizzato in ${matNames}. Lavorazione: ${techNames}.`
    : `Materiali: ${matNames}. Tecnologie impiegate: ${techNames}.`;

  const pers = custom && custom.length
    ? ` Personalizzabile su ${joinIt(custom)}.`
    : '';

  return `${detail}\n\n${spec}${pers}`;
}

function buildSeo(name, subtitle, shortDesc, categoryName) {
  let title = `${name} — ${subtitle}`;
  if (title.length > 60) title = clamp(`${name} — ${subtitle}`, 60);

  // La coda promozionale si aggiunge solo se ci sta per intero: meglio una
  // description più corta che una troncata a metà parola.
  const tail = ` ${categoryName} su misura, INGLY DESIGN.`;
  const description = shortDesc.length + tail.length <= 160
    ? shortDesc + tail
    : clamp(shortDesc, 160);

  return { title, description };
}

/* ---- preservazione del lavoro manuale --------------------------------- */

const PRESERVE = [
  'images', 'gallery', 'migrationStatus', 'replacementStatus',
  'legacyReference', 'currentProduct', 'sourceUrl', 'originalName',
  'featured', 'description', 'seo'
];

const existing = new Map();
if (existsSync(join(ROOT, 'data/products.json'))) {
  for (const p of read('data/products.json')) existing.set(p.id, p);
}
// Campi rigenerati solo se il precedente valore era ancora quello generato.
const generatedBefore = new Map();
for (const [id, p] of existing) {
  generatedBefore.set(id, p.__generated === true);
}

/* ---- generazione ------------------------------------------------------ */

const products = [];
let globalIndex = 0;

for (const category of categories) {
  const seed = SEED[category.id];
  if (!seed) {
    console.warn(`[catalogo] nessun seed per la categoria "${category.id}" — saltata`);
    continue;
  }

  seed.forEach((entry, n) => {
    const [name, subtitle, subcategory, rawMats, rawTechs, dimensions, uses, audience, detail, customization = [], featured = false] = entry;

    // La rimappatura degli id può far convergere due voci sulla stessa:
    // l'elenco si deduplica qui, non a valle.
    const mats = [...new Set(rawMats)];
    const techs = [...new Set(rawTechs)];

    const id = `${PREFIX[category.id]}-${pad(n + 1)}`;
    const slug = slugify(`${name} ${subtitle}`);
    const shortDescription = clamp(firstSentence(detail), 150);
    const description = buildDescription(detail, mats, techs, customization, globalIndex);
    const categoryName = category.name.it;

    const generated = {
      id,
      slug,
      name,
      subtitle,
      originalName: null,
      category: category.id,
      subcategory,
      description,
      shortDescription,
      images: [{
        src: `assets/images/products/${id}.svg`,
        alt: `${subtitle} — modello ${name}, INGLY DESIGN`,
        source: 'ingly-placeholder',
        status: 'placeholder',
        replacementRequired: true
      }],
      gallery: [],
      materials: mats,
      technologies: techs,
      dimensions,
      customizable: customization.length > 0,
      customization,
      uses,
      tags: [...new Set([category.id, subcategory, ...mats, ...techs, ...uses])],
      audience,
      sourceUrl: null,
      migrationStatus: 'imported',
      replacementStatus: 'pending',
      legacyReference: null,
      currentProduct: null,
      seo: buildSeo(name, subtitle, shortDescription, categoryName),
      featured,
      order: n + 1,
      __generated: true
    };

    // Merge conservativo: ciò che è stato editato a mano resta.
    const prev = existing.get(id);
    if (prev && generatedBefore.get(id) === false) {
      for (const key of PRESERVE) {
        if (prev[key] !== undefined) generated[key] = prev[key];
      }
      generated.__generated = false;
    }

    products.push(generated);
    globalIndex++;
  });
}

writeFileSync(join(ROOT, 'data/products.json'), `${JSON.stringify(products, null, 1)}\n`, 'utf8');

/* ---- riepilogo -------------------------------------------------------- */

const byCategory = {};
for (const p of products) byCategory[p.category] = (byCategory[p.category] || 0) + 1;

console.log('\n  CATALOGO INGLY DESIGN — generato');
console.log('  ─────────────────────────────────');
for (const c of categories) {
  const count = byCategory[c.id] || 0;
  console.log(`  ${c.name.it.padEnd(30)} ${String(count).padStart(3)}`);
}
console.log('  ─────────────────────────────────');
console.log(`  ${'TOTALE'.padEnd(30)} ${String(products.length).padStart(3)}\n`);

// Aggiorna la versione dei dati per il cache-busting.
writeFileSync(
  join(ROOT, 'data/version.json'),
  `${JSON.stringify({ v: Date.now(), products: products.length, updated: new Date().toISOString().slice(0, 10) }, null, 2)}\n`,
  'utf8'
);
