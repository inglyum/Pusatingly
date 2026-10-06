#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — TEST DELL'ADMIN
   ------------------------------------------------------------
   L'Admin scrive sul repository. Un errore qui non sporca una
   pagina: cancella lavoro. Si verifica quindi la parte che
   decide COSA finisce nel commit, che è scritta in funzioni
   pure apposta per poter essere letta da qui.
   ============================================================ */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

/* admin-github.js tocca localStorage e fetch appena viene importato:
   qui bastano due oggetti inerti perché il modulo si carichi. */
const store = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};
globalThis.localStorage = store();
globalThis.sessionStorage = store();
globalThis.location = { hostname: 'localhost', pathname: '/' };

const GH = await import('../assets/js/admin-github.js');
const SM = await import('../assets/js/sitemap.js');

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; }
  catch (e) { failures.push(`${name}\n      ${e.message}`); }
}
const assert = (c, m) => { if (!c) throw new Error(m); };

const data = {
  config: read('data/config.json'),
  products: read('data/products.json'),
  categories: read('data/categories.json'),
  xtool: read('data/xtool.json'),
  info: read('data/informazioni.json')
};

/* ---- sitemap condivisa -------------------------------------------------- */

test('la sitemap dell’Admin e quella dello script sono lo stesso file', () => {
  const generata = SM.sitemapXml(data, readFileSync(join(ROOT, 'sitemap.xml'), 'utf8')
    .match(/<lastmod>([\d-]+)<\/lastmod>/)?.[1]);
  const su_disco = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
  assert(generata === su_disco,
    'sitemap.xml sul disco diverge da quella che l’Admin pubblicherebbe: esegui npm run sitemap');
});

test('le creazioni archiviate non entrano nella sitemap', () => {
  const con = SM.sitemapUrls(data).length;
  const senza = SM.sitemapUrls({
    ...data,
    products: data.products.map((p, i) => (i === 0 ? { ...p, migrationStatus: 'archived' } : p))
  }).length;
  assert(senza === con - 1, `archiviare una creazione deve togliere un URL (${con} → ${senza})`);
});

/* ---- il pacchetto di pubblicazione -------------------------------------- */

const pacco = GH.pacchetto({ ...data, versione: 1234, oggi: '2026-10-06' });

test('il pacchetto contiene products, version e sitemap', () => {
  for (const f of ['data/products.json', 'data/version.json', 'sitemap.xml']) {
    assert(pacco[f], `file mancante nel pacchetto: ${f}`);
  }
});

test('version.json dichiara la versione e il numero di creazioni pubbliche', () => {
  const v = JSON.parse(pacco['data/version.json'].text);
  assert(v.v === 1234, 'versione non riportata');
  assert(v.products === SM.pubblicati(data.products).length,
    'il conteggio deve escludere le archiviate');
});

test('products.json pubblicato è JSON valido e non perde creazioni', () => {
  const p = JSON.parse(pacco['data/products.json'].text);
  assert(p.length === data.products.length, `attese ${data.products.length} creazioni, trovate ${p.length}`);
});

test('le fotografie entrano come base64, mai come testo', () => {
  const conFoto = GH.pacchetto({ ...data, foto: [{ path: 'assets/images/products/x.webp', b64: 'QUJD' }] });
  const f = conFoto['assets/images/products/x.webp'];
  assert(f && f.b64 === 'QUJD' && f.text === undefined,
    'un binario inviato come utf-8 arriva sul repository corrotto');
});

/* Il token è la chiave del repository. Se finisse in un file pubblicato
   sarebbe pubblico nel momento stesso del commit, e revocarlo sarebbe
   l'unico rimedio. La regola 6 del progetto esiste per questo. */
test('nessun file pubblicato può contenere il token', () => {
  GH.setToken('github_pat_TOKENDIPROVA');
  const p = GH.pacchetto({ ...data, versione: 7 });
  const tutto = Object.values(p).map((f) => f.text || f.b64 || '').join('\n');
  assert(!tutto.includes('github_pat_'), 'un file del pacchetto contiene il token');
  GH.dimenticaToken();
});

test('il token non viene scritto in localStorage se non è stato chiesto', () => {
  GH.salvaImpostazioni({ remember: false });
  GH.setToken('github_pat_SEGRETO');
  assert(localStorage.getItem('ingly-admin-token') === null,
    'senza "ricorda", il token non deve sopravvivere alla chiusura del browser');
  assert(GH.token() === 'github_pat_SEGRETO', 'il token deve valere per questa sessione');
  GH.dimenticaToken();
});

test('dimenticaToken ripulisce entrambe le memorie', () => {
  GH.salvaImpostazioni({ remember: true });
  GH.setToken('github_pat_SEGRETO');
  assert(localStorage.getItem('ingly-admin-token'), 'con "ricorda" il token deve essere persistito');
  GH.dimenticaToken();
  assert(!GH.token() && !localStorage.getItem('ingly-admin-token'), 'token ancora presente dopo l’oblio');
  GH.salvaImpostazioni({ remember: false });
});

/* ---- impronta e guardia anti-sovrascrittura ----------------------------- */

test('l’impronta di un JSON ignora l’indentazione, non il contenuto', () => {
  const a = JSON.stringify({ x: 1, y: [2] });
  const b = JSON.stringify({ x: 1, y: [2] }, null, 4);
  assert(GH.impronta('data/products.json', a) === GH.impronta('data/products.json', b),
    'riformattare un file non è una modifica');
  assert(GH.impronta('data/products.json', a) !== GH.impronta('data/products.json', JSON.stringify({ x: 2, y: [2] })),
    'un valore diverso deve risultare diverso');
  assert(GH.impronta('sitemap.xml', ' a ') === ' a ', 'per i non-JSON vale il testo esatto');
});

/* ---- rilevamento del repository ----------------------------------------- */

test('owner e repo si leggono da un indirizzo github.io', () => {
  assert(GH.autodetect('inglyum.github.io', '/pusatingly/admin.html')?.repo === 'pusatingly',
    'repo di progetto non riconosciuto');
  assert(GH.autodetect('inglyum.github.io', '/admin.html')?.repo === 'inglyum.github.io',
    'sito utente non riconosciuto');
  assert(GH.autodetect('inglydesign.it', '/admin.html') === null,
    'su dominio personalizzato valgono le impostazioni salvate');
});

/* ---- la regola 6 vale anche per il codice sorgente ---------------------- */

test('nessun token o segreto scritto nei file del repository', () => {
  const sospetti = [];
  const guarda = (dir) => {
    for (const f of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (f.isDirectory()) { guarda(`${dir}/${f.name}`); continue; }
      if (!/\.(js|mjs|json|html)$/.test(f.name)) continue;
      const src = readFileSync(join(ROOT, dir, f.name), 'utf8');
      /* i veri token hanno un corpo lungo: il prefisso da solo è una citazione */
      if (/gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}/.test(src)) {
        sospetti.push(`${dir}/${f.name}`);
      }
    }
  };
  ['assets/js', 'data', 'scripts', 'tests'].forEach(guarda);
  assert(!sospetti.length, `possibile credenziale nel repository: ${sospetti.join(', ')}`);
});

/* ---- report ------------------------------------------------------------- */

console.log('\n  TEST ADMIN');
console.log('  ' + '─'.repeat(52));
if (failures.length) {
  console.log(`  ✓ ${passed} superati · ✗ ${failures.length} falliti\n`);
  failures.forEach((f) => console.log(`    ✗ ${f}\n`));
  process.exit(1);
}
console.log(`  ✓ ${passed} test superati\n`);
