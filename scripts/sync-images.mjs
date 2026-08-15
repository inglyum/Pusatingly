#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — SINCRONIZZAZIONE IMMAGINI
   ------------------------------------------------------------
   Allinea data/products.json a ciò che c'è realmente su disco.

   Per ogni prodotto cerca, in ordine di preferenza:
       assets/images/products/<id>.webp | .avif | .jpg | .jpeg | .png
   e, se la trova, la promuove a immagine del prodotto:
       src                 → percorso della foto
       source              → ingly-original
       status              → final
       replacementRequired → false
       migrationStatus     → active   (se era imported/review/redesign)
       replacementStatus   → done

   Se la foto viene rimossa, il prodotto torna al placeholder senza
   rompersi: nessuno stato resta orfano.

   Le immagini aggiuntive <id>-2.webp, <id>-3.webp… diventano gallery.

   Uso:  npm run sync-images
   ============================================================ */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = 'assets/images/products';
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

const products = read('data/products.json');

// Preferenza per formato: il primo trovato vince.
const EXT = ['webp', 'avif', 'jpg', 'jpeg', 'png'];

const onDisk = new Set(
  existsSync(join(ROOT, DIR)) ? readdirSync(join(ROOT, DIR)) : []
);

const findPhoto = (id) => {
  for (const e of EXT) if (onDisk.has(`${id}.${e}`)) return `${DIR}/${id}.${e}`;
  return null;
};

const findGallery = (id) => {
  const out = [];
  for (let n = 2; n <= 12; n++) {
    for (const e of EXT) {
      if (onDisk.has(`${id}-${n}.${e}`)) { out.push(`${DIR}/${id}-${n}.${e}`); break; }
    }
  }
  return out;
};

const PROMOTABLE = new Set(['imported', 'review', 'redesign']);

let promoted = 0;
let demoted = 0;
let galleries = 0;

for (const p of products) {
  const photo = findPhoto(p.id);
  const current = p.images?.[0] || {};
  const alt = current.alt || `${p.subtitle} — modello ${p.name}, INGLY DESIGN`;

  if (photo) {
    if (current.status !== 'final' || current.src !== photo) promoted++;
    p.images = [{
      src: photo,
      alt,
      source: 'ingly-original',
      status: 'final',
      replacementRequired: false
    }];
    if (PROMOTABLE.has(p.migrationStatus)) p.migrationStatus = 'active';
    p.replacementStatus = 'done';
    if (!p.legacyReference) p.legacyReference = `${p.id}-placeholder`;
    p.currentProduct = p.id;
    p.__generated = false; // protegge il record da build-catalog

    const gallery = findGallery(p.id);
    if (gallery.length) {
      galleries++;
      p.gallery = gallery.map((src, i) => ({
        src,
        alt: `${alt} — vista ${i + 2}`,
        source: 'ingly-original',
        status: 'final',
        replacementRequired: false
      }));
    }
  } else if (current.status === 'final') {
    // La foto non c'è più: si torna al placeholder invece di lasciare un 404.
    demoted++;
    p.images = [{
      src: `${DIR}/${p.id}.svg`,
      alt,
      source: 'ingly-placeholder',
      status: 'placeholder',
      replacementRequired: true
    }];
    p.gallery = [];
    if (p.migrationStatus === 'active') p.migrationStatus = 'review';
    p.replacementStatus = 'pending';
  }
}

writeFileSync(join(ROOT, 'data/products.json'), `${JSON.stringify(products, null, 1)}\n`, 'utf8');

const withPhoto = products.filter((p) => p.images?.[0]?.status === 'final').length;

console.log(`\n  SINCRONIZZAZIONE IMMAGINI`);
console.log(`  ${'─'.repeat(46)}`);
console.log(`  Promossi a foto reale     ${promoted}`);
if (demoted) console.log(`  Riportati a placeholder   ${demoted}`);
if (galleries) console.log(`  Con gallery               ${galleries}`);
console.log(`  ${'─'.repeat(46)}`);
console.log(`  Copertura fotografica     ${withPhoto}/${products.length}\n`);
