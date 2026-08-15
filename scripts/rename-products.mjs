#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — NOMENCLATURA DEL CATALOGO
   ------------------------------------------------------------
   I 176 prodotti erano battezzati con toponimi siciliani (Trinacria,
   Kalsa, Aretusa…). Nascevano da un'ipotesi sbagliata sulla sede del
   laboratorio, che è a Cesena, e da un tono evocativo che non è quello
   con cui Giuseppe scrive: "Ti dico prima cosa non funziona".

   Il nome diventa quindi il descrittore funzionale, e il sottotitolo
   porta il dato tecnico:

       Trinacria                              →  Portamenù A4 ad anelli
       Portamenù A4 ad anelli in betulla      →  Compensato di betulla · 23 × 32 cm

   Chi cerca "portamenù A4" trova la pagina. "Trinacria" non lo cercava
   nessuno.

   Agisce sul SEED, che è la fonte del catalogo, e registra i redirect
   dai vecchi slug così nessun indirizzo già condiviso si rompe.

   Uso:  node scripts/rename-products.mjs
   ============================================================ */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SEED } from './seed/catalog-seed.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));
const write = (f, o) => writeFileSync(join(ROOT, f), `${JSON.stringify(o, null, 1)}\n`, 'utf8');

const materials = read('data/materials.json');
const matName = (id) => materials.find((m) => m.id === id)?.name.it || id;

const slugify = (s) => String(s).toLowerCase()
  .replace(/[àáâ]/g, 'a').replace(/[èéê]/g, 'e').replace(/[ìíî]/g, 'i')
  .replace(/[òóô]/g, 'o').replace(/[ùúû]/g, 'u').replace(/₂/g, '2')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** "Portamenù A4 ad anelli in betulla" → "Portamenù A4 ad anelli" */
function toName(subtitle) {
  return subtitle
    .replace(/\s+(in|di)\s+(betulla|compensato|legno|massello|plexiglass|acrilico|alluminio|acciaio|inox|ottone|pelle|cartoncino|metallo|betulla incisa)\b.*$/i, '')
    .replace(/\s+in\s+essenze accostate$/i, '')
    .trim();
}

/** Sottotitolo tecnico: materiale principale più la misura che conta. */
function toSubtitle(mats, dims) {
  const material = mats.length ? matName(mats[0]) : '';
  const d = dims || {};
  let size = '';
  if (d.larghezza && d.altezza) size = `${d.larghezza} × ${d.altezza}`;
  else if (d.diametro) size = `Ø ${d.diametro}`;
  else if (d.lato) size = `lato ${d.lato}`;
  else if (d.larghezza && d.profondita) size = `${d.larghezza} × ${d.profondita}`;
  else if (d.altezza) size = `h ${d.altezza}`;
  else if (d.larghezza) size = d.larghezza;
  else if (d.grammatura) size = d.grammatura;
  else if (d.pezzi) size = `${d.pezzi} pezzi`;

  return [material, size].filter(Boolean).join(' · ');
}

/* ---- calcolo dei nuovi nomi, con disambiguazione ---------------------- */

const seen = new Map();
const renames = [];

for (const [categoryId, entries] of Object.entries(SEED)) {
  for (const e of entries) {
    const [oldName, oldSubtitle, , mats, , dims] = e;
    let name = toName(oldSubtitle);

    // Due creazioni non possono chiamarsi allo stesso modo: si distingue
    // con il materiale, che è il criterio con cui il cliente sceglie.
    const key = name.toLowerCase();
    if (seen.has(key)) {
      const material = mats.length ? matName(mats[0]) : '';
      name = material ? `${name} — ${material.toLowerCase()}` : `${name} ${seen.get(key) + 1}`;
      seen.set(key, seen.get(key) + 1);
    } else {
      seen.set(key, 1);
    }
    // Anche la variante può collidere: si aggiunge un progressivo.
    let k2 = name.toLowerCase(); let n = 1;
    while (seen.has(k2) && seen.get(k2) === 'used') { n++; k2 = `${name} ${n}`.toLowerCase(); }
    if (n > 1) name = `${name} ${n}`;
    seen.set(name.toLowerCase(), 'used');

    renames.push({
      categoryId,
      oldName,
      oldSubtitle,
      name,
      subtitle: toSubtitle(mats, dims),
      oldSlug: slugify(`${oldName} ${oldSubtitle}`),
      newSlug: slugify(name)
    });
  }
}

/* ---- riscrittura del seed --------------------------------------------- */

const seedPath = 'scripts/seed/catalog-seed.mjs';
let src = readFileSync(join(ROOT, seedPath), 'utf8');
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

let applied = 0;
for (const r of renames) {
  // Si sostituisce la coppia [nome, sottotitolo] all'inizio della voce:
  // è l'unico punto in cui compaiono insieme, quindi il match è sicuro.
  const from = `['${esc(r.oldName)}', '${esc(r.oldSubtitle)}',`;
  const to = `['${esc(r.name)}', '${esc(r.subtitle)}',`;
  if (src.includes(from)) { src = src.replace(from, to); applied++; }
  else console.warn(`  ! voce non trovata nel seed: ${r.oldName}`);
}
writeFileSync(join(ROOT, seedPath), src, 'utf8');

/* ---- redirect dai vecchi indirizzi ------------------------------------ */

const migration = read('data/migration.json');
const known = new Set(migration.redirects.map((x) => x.from));
let added = 0;
for (const r of renames) {
  const from = `/creazioni/${r.categoryId}/${r.oldSlug}`;
  if (r.oldSlug === r.newSlug || known.has(from)) continue;
  migration.redirects.push({ from, to: `/creazioni/${r.categoryId}/${r.newSlug}`, type: 301 });
  added++;
}
write('data/migration.json', migration);

/* ---- la nomenclatura riservata non serve più --------------------------- */

console.log(`\n  NOMENCLATURA DEL CATALOGO`);
console.log(`  ${'─'.repeat(56)}`);
console.log(`  Creazioni rinominate   ${applied} / ${renames.length}`);
console.log(`  Redirect aggiunti      ${added}`);
console.log(`\n  Esempi:`);
for (const r of renames.slice(0, 5)) {
  console.log(`    ${r.oldName.padEnd(14)} → ${r.name}`);
  console.log(`    ${''.padEnd(14)}   ${r.subtitle}`);
}
console.log(`\n  Ora esegui:  npm run build && npm test\n`);
