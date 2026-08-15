#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — TEST DI RENDERING
   ------------------------------------------------------------
   Monta i renderer reali in un DOM jsdom con i dati veri del
   repository e verifica il markup prodotto: struttura, ordine
   delle sezioni imposto dal master command §24, accessibilità,
   escaping e integrità dei link.
   ============================================================ */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

/* ---- ambiente ---------------------------------------------------------- */

const dom = new JSDOM('<!doctype html><html><body><main id="main"></main></body></html>', {
  url: 'https://inglydesign.it/',
  pretendToBeVisual: true
});

global.window = dom.window;
global.document = dom.window.document;
global.location = dom.window.location;
global.history = dom.window.history;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.IntersectionObserver = class {
  observe() {} unobserve() {} disconnect() {}
};
dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
global.matchMedia = dom.window.matchMedia;

/* ---- dati -------------------------------------------------------------- */

const D = {
  CONFIG: read('data/config.json'),
  T: read('data/texts.json'),
  CATS: read('data/categories.json'),
  PRODUCTS: read('data/products.json'),
  MATERIALS: read('data/materials.json'),
  TECHNOLOGIES: read('data/technologies.json'),
  PORTFOLIO: read('data/portfolio.json'),
  CONTENT: read('data/content.json'),
  MIGRATION: read('data/migration.json')
};

const lang = 'it';
const t = (k) => D.T[lang][k] ?? k;

/* ---- moduli ------------------------------------------------------------ */

const catalog = await import('../assets/js/catalog.js');
const sections = await import('../assets/js/sections.js');
const product = await import('../assets/js/product.js');
const pages = await import('../assets/js/pages.js');
const forms = await import('../assets/js/forms.js');
const seo = await import('../assets/js/seo.js');

catalog.initCatalog(D, lang, t);
sections.initSections(D, lang, t);
product.initProduct(D, lang, t);
pages.initPages(D, lang, t);
forms.initForms(D, lang, t);

/* ---- helper ------------------------------------------------------------ */

let passed = 0;
const failures = [];

function test(name, fn) {
  try { fn(); passed++; }
  catch (e) { failures.push(`${name}\n      ${e.message}`); }
}
const assert = (c, m) => { if (!c) throw new Error(m); };

function fresh() {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

/* ---- HOMEPAGE ---------------------------------------------------------- */

test('la homepage rende tutte le sezioni del master command §21', () => {
  const root = fresh();
  sections.renderHome(root);

  assert(root.querySelector('.hero'), 'sezione hero mancante');
  assert(root.querySelectorAll('section').length >= 10,
    `attese almeno 10 sezioni, trovate ${root.querySelectorAll('section').length}`);

  const h1 = root.querySelectorAll('h1');
  assert(h1.length === 1, `la pagina deve avere esattamente un h1, trovati ${h1.length}`);

  const text = root.textContent;
  for (const needle of ['Manifesto', 'Catalogo', 'Tecnologie', 'Materiali', 'Business', 'Processo']) {
    assert(text.includes(needle), `sezione "${needle}" non presente in homepage`);
  }
});

test('la homepage mostra tutte le 13 categorie', () => {
  const root = fresh();
  sections.renderHome(root);
  const cards = root.querySelectorAll('.cat-card');
  assert(cards.length === D.CATS.length,
    `attese ${D.CATS.length} card categoria, trovate ${cards.length}`);
});

test('i contatori senza dato reale non vengono mostrati', () => {
  const root = fresh();
  sections.renderHome(root);
  const meta = root.querySelector('.hero-meta');
  if (!meta) return; // nessuna statistica valorizzata: accettabile
  const labels = [...meta.querySelectorAll('span')].map((s) => s.textContent);
  for (const forbidden of ['Pezzi realizzati', 'Clienti']) {
    const stat = forbidden === 'Clienti' ? D.CONFIG.stats.clienti : D.CONFIG.stats.pezzi;
    if (stat === null) {
      assert(!labels.includes(forbidden), `"${forbidden}" mostrato pur essendo null in config`);
    }
  }
});

/* ---- CATALOGO ---------------------------------------------------------- */

test('il catalogo rende tutti i prodotti pubblici', () => {
  const root = fresh();
  root.id = 'main';
  catalog.renderCatalogPage(root, { categoryId: null, query: new URLSearchParams() });
  const cards = root.querySelectorAll('.card');
  const expected = catalog.publicProducts().length;
  assert(cards.length === expected, `attese ${expected} card, trovate ${cards.length}`);
});

test('la vista categoria filtra correttamente', () => {
  const root = fresh();
  root.id = 'main';
  const cat = D.CATS[0];
  catalog.renderCatalogPage(root, { categoryId: cat.id, query: new URLSearchParams() });
  const expected = catalog.productsIn(cat.id).length;
  const cards = root.querySelectorAll('.card');
  assert(cards.length === expected,
    `categoria ${cat.id}: attese ${expected} card, trovate ${cards.length}`);
});

test('i filtri restituiscono sottoinsiemi coerenti', () => {
  const all = catalog.publicProducts();

  // Il materiale di riferimento si prende dai dati, non da un id fisso:
  // dopo il merge con i dati reali gli id sono cambiati.
  const someMat = D.MATERIALS[0].id;
  const byMat = catalog.applyFilters(all, { mat: someMat });
  assert(byMat.length > 0, `nessun prodotto con materiale "${someMat}": filtro rotto`);
  assert(byMat.every((p) => p.materials.includes(someMat)), 'filtro materiale impreciso');

  const b2b = catalog.applyFilters(all, { pub: 'b2b' });
  assert(b2b.every((p) => p.audience === 'b2b' || p.audience === 'both'),
    'filtro pubblico impreciso');

  const search = catalog.applyFilters(all, { q: 'portamenù' });
  assert(search.length > 0, 'la ricerca "portamenù" non restituisce risultati');

  const accentless = catalog.applyFilters(all, { q: 'portamenu' });
  assert(accentless.length === search.length,
    'la ricerca deve ignorare gli accenti');

  const combined = catalog.applyFilters(all, { cat: 'soluzioni-menu', mat: someMat });
  assert(combined.every((p) => p.category === 'soluzioni-menu' && p.materials.includes(someMat)),
    'i filtri combinati non si intersecano correttamente');
});

test('ogni card espone immagine con alt, titolo e CTA', () => {
  const root = fresh();
  root.innerHTML = catalog.productCard(D.PRODUCTS[0], { index: 0 });
  const img = root.querySelector('img');
  assert(img, 'card senza immagine');
  assert(img.getAttribute('alt')?.trim(), 'immagine di card senza alt');
  assert(img.getAttribute('width') && img.getAttribute('height'),
    'immagine senza width/height: rischio layout shift');
  assert(root.querySelector('.card-title'), 'card senza titolo');
  const cta = root.querySelector('.link-arrow');
  assert(cta?.textContent.includes('Scopri la creazione'), 'CTA della card errata (§23)');
});

/* ---- SCHEDA PRODOTTO --------------------------------------------------- */

test('la scheda prodotto rispetta l\'ordine delle sezioni del §24', () => {
  const root = fresh();
  const p = D.PRODUCTS.find((x) => x.customizable && x.uses?.length && Object.keys(x.dimensions).length);
  product.renderProductPage(root, p);

  assert(root.querySelector('.product-media'), 'gallery mancante');
  assert(root.querySelector('h1.product-title'), 'titolo mancante');

  const headings = [...root.querySelectorAll('.product-section h2')].map((h) => h.textContent.trim());
  const expected = ['Applicazioni', 'Materiali', 'Tecnologie', 'Dimensioni', 'Personalizzazione'];
  let cursor = -1;
  for (const h of expected) {
    const i = headings.indexOf(h);
    assert(i > -1, `sezione "${h}" mancante nella scheda prodotto`);
    assert(i > cursor, `sezione "${h}" fuori ordine rispetto al §24`);
    cursor = i;
  }

  assert(root.querySelector('.product-cta'), 'CTA di richiesta mancante');
  assert(root.textContent.includes('Domande frequenti'), 'FAQ mancante');
});

test('la scheda prodotto include breadcrumb e correlati', () => {
  const root = fresh();
  product.renderProductPage(root, D.PRODUCTS[0]);
  const crumbs = root.querySelectorAll('.breadcrumb li');
  assert(crumbs.length === 4, `breadcrumb: attesi 4 livelli, trovati ${crumbs.length}`);
  assert(root.querySelector('[aria-current="page"]'), 'breadcrumb senza aria-current');
  assert(root.querySelectorAll('.product-grid .card').length > 0, 'nessun prodotto correlato');
});

test('la scheda prodotto segnala il placeholder fotografico', () => {
  const root = fresh();
  product.renderProductPage(root, D.PRODUCTS[0]);
  assert(root.querySelector('.media-note'),
    'un prodotto senza foto reale deve dichiararlo (docs/IMAGE-MIGRATION.md)');
});

/* ---- PAGINE EDITORIALI ------------------------------------------------- */

test('la pagina materiali rende tutti i materiali, senza famiglie orfane', () => {
  const root = fresh();
  pages.renderMaterials(root);
  const cards = root.querySelectorAll('.info-card');
  assert(cards.length === D.MATERIALS.length,
    `attesi ${D.MATERIALS.length} materiali, trovati ${cards.length}`);
  for (const m of D.MATERIALS) {
    assert(root.querySelector(`#${m.id}`), `ancora #${m.id} mancante`);
  }
});

test('la pagina tecnologie rende tutte le lavorazioni', () => {
  const root = fresh();
  pages.renderTechnologies(root);
  const cards = root.querySelectorAll('.info-card');
  assert(cards.length === D.TECHNOLOGIES.length,
    `attese ${D.TECHNOLOGIES.length} tecnologie, trovate ${cards.length}`);
});

test('la pagina chi sono non attribuisce contenuti di terzi', () => {
  const root = fresh();
  pages.renderAbout(root);
  const text = root.textContent.toLowerCase();
  assert(text.includes('giuseppe inglima'), 'la pagina deve nominare Giuseppe Inglima');
  for (const forbidden of ['pusateri', 'alessio']) {
    assert(!text.includes(forbidden), `contenuto di terzi rilevato: "${forbidden}"`);
  }
});

test('il portfolio dichiara di essere in costruzione se vuoto', () => {
  const root = fresh();
  pages.renderPortfolio(root);
  if (!D.PORTFOLIO.projects.length) {
    assert(root.querySelector('.notice'), 'portfolio vuoto senza avviso esplicito');
  }
  assert(root.querySelectorAll('.archetype').length === D.PORTFOLIO.archetypes.length,
    'tipologie di progetto non renderizzate');
});

test('la pagina come acquistare rende tutti i passaggi del processo', () => {
  const root = fresh();
  pages.renderHow(root);
  const steps = root.querySelectorAll('.step');
  const expected = D.CONTENT.comeAcquistare.steps.length;
  assert(steps.length === expected, `attesi ${expected} passaggi, trovati ${steps.length}`);
  assert(expected >= 5, 'il processo dichiarato ha troppi pochi passaggi');
  assert(root.querySelectorAll('.accordion-item').length > 0, 'FAQ mancante');
});

test('la pagina B2B rende tutti i segmenti del §26', () => {
  const root = fresh();
  pages.renderB2b(root);
  const segments = root.querySelectorAll('.segment');
  assert(segments.length === D.CONTENT.b2b.segments.length,
    `attesi ${D.CONTENT.b2b.segments.length} segmenti, trovati ${segments.length}`);
});

/* ---- FORM -------------------------------------------------------------- */

test('il form contatti contiene tutti i campi del §18', () => {
  const root = fresh();
  forms.renderContact(root, new URLSearchParams());
  const required = ['f-name', 'f-email', 'f-phone', 'f-company', 'f-type',
    'f-product', 'f-qty', 'f-custom', 'f-message', 'f-file', 'f-privacy'];
  for (const id of required) {
    assert(root.querySelector(`#${id}`), `campo mancante: ${id}`);
  }
});

test('ogni campo del form ha una label associata', () => {
  const root = fresh();
  forms.renderContact(root, new URLSearchParams());
  for (const field of root.querySelectorAll('input, textarea, select')) {
    if (field.type === 'checkbox') {
      assert(field.closest('label'), 'checkbox senza label contenitore');
      continue;
    }
    const label = root.querySelector(`label[for="${field.id}"]`);
    assert(label, `campo #${field.id} senza label`);
  }
});

test('il form preseleziona il prodotto passato in query', () => {
  const root = fresh();
  const target = D.PRODUCTS[5];
  forms.renderContact(root, new URLSearchParams(`prodotto=${target.id}`));
  const sel = root.querySelector('#f-product');
  assert(sel.value === target.id, `prodotto non preselezionato: ${sel.value} invece di ${target.id}`);
});

/* ---- SEO --------------------------------------------------------------- */

test('setSeo popola title, description, canonical e Open Graph', () => {
  seo.setSeo({
    title: 'Prova',
    description: 'Descrizione di prova',
    canonical: 'https://inglydesign.it/prova',
    image: 'assets/images/products/sm-001.svg',
    lang: 'it'
  });
  assert(document.title === 'Prova | INGLY DESIGN', `title errato: ${document.title}`);
  assert(document.querySelector('meta[name="description"]')?.content === 'Descrizione di prova',
    'meta description non impostata');
  assert(document.querySelector('link[rel="canonical"]')?.href === 'https://inglydesign.it/prova',
    'canonical non impostato');
  assert(document.querySelector('meta[property="og:title"]'), 'og:title mancante');
  assert(document.querySelector('meta[property="og:image"]'), 'og:image mancante');
});

test('il JSON-LD del prodotto è valido e senza prezzo', () => {
  const p = D.PRODUCTS[0];
  const cat = D.CATS.find((c) => c.id === p.category);
  const ld = seo.productLd(p, cat, 'https://inglydesign.it', 'it');
  assert(ld['@type'] === 'Product', 'tipo JSON-LD errato');
  assert(ld.sku === p.id, 'sku non corrispondente');
  assert(ld.offers.availability.includes('MadeToOrder'),
    'la disponibilità deve essere MadeToOrder: il sito non è un e-commerce');
  assert(!('price' in ld.offers), 'nessun prezzo deve essere dichiarato');
  JSON.parse(JSON.stringify(ld));
});

/* ---- SICUREZZA E INTEGRITÀ --------------------------------------------- */

test('i contenuti sono correttamente escapati', () => {
  const root = fresh();
  const evil = {
    ...D.PRODUCTS[0],
    name: '<img src=x onerror="alert(1)">',
    subtitle: '"><script>alert(2)</script>',
    shortDescription: 'ok'
  };
  root.innerHTML = catalog.productCard(evil, { index: 0 });
  assert(!root.querySelector('script'), 'script iniettato: escaping non applicato');
  assert(root.querySelectorAll('img').length === 1,
    'tag immagine iniettato: escaping non applicato');
});

test('nessun link interno punta a una rotta inesistente', () => {
  const root = fresh();
  sections.renderHome(root);
  const catIds = new Set(D.CATS.map((c) => c.id));
  const known = new Set(['/', '/creazioni', '/materiali', '/tecnologie', '/portfolio',
    '/chi-sono', '/come-acquistare', '/b2b', '/contatti']);

  for (const a of root.querySelectorAll('a[href]')) {
    const raw = a.getAttribute('href');
    if (!raw.startsWith('#/') && !raw.startsWith('/')) continue;
    const path = raw.replace(/^#/, '').split('?')[0].split('#')[0];
    if (known.has(path)) continue;
    const m = path.match(/^\/creazioni\/([a-z0-9-]+)$/);
    if (m) {
      assert(catIds.has(m[1]), `link a categoria inesistente: ${path}`);
      continue;
    }
    const pm = path.match(/^\/creazioni\/([a-z0-9-]+)\/([a-z0-9-]+)$/);
    if (pm) {
      assert(D.PRODUCTS.some((p) => p.slug === pm[2]), `link a prodotto inesistente: ${path}`);
      continue;
    }
    throw new Error(`link non riconosciuto: ${path}`);
  }
});

test('index.html referenzia solo asset esistenti', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:href|src)="((?!http|mailto|#)[^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    try {
      readFileSync(join(ROOT, ref));
    } catch {
      throw new Error(`asset referenziato ma assente: ${ref}`);
    }
  }
});

/* ---- report ------------------------------------------------------------ */

console.log(`\n  TEST RENDERING`);
console.log(`  ${'─'.repeat(52)}`);
if (failures.length) {
  console.log(`  ✓ ${passed} superati · ✗ ${failures.length} falliti\n`);
  for (const f of failures) console.log(`    ✗ ${f}\n`);
  process.exit(1);
}
console.log(`  ✓ ${passed} test superati\n`);
