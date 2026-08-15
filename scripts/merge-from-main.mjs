#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — MERGE DEI DATI REALI DAL BRANCH main
   ------------------------------------------------------------
   Il branch `main` conteneva un secondo sito INGLY con i dati REALI
   dell'attività di Giuseppe: sede, contatti, macchine, tecniche,
   materiali, processo, FAQ e racconto personale.

   Questo progetto era stato costruito su ipotesi sbagliate:
     - sede in Sicilia          → in realtà Cesena, Emilia-Romagna
     - 11 tecnologie ipotizzate → in realtà 8 lavorazioni, altre
     - 15 materiali ipotizzati  → in realtà 12, con vetro/ardesia/sughero
     - stampa 3D FDM (PLA/PETG) → non fa parte del laboratorio

   Lo script sostituisce le ipotesi con la realtà e RIMAPPA i 176
   prodotti sui nuovi id, così il catalogo resta integro.

   È idempotente: rieseguirlo non produce ulteriori cambiamenti.

   Uso:  node scripts/merge-from-main.mjs
   ============================================================ */

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));
const write = (f, o) => writeFileSync(join(ROOT, f), `${JSON.stringify(o, null, 1)}\n`, 'utf8');

/** Legge un file dal branch main senza fare checkout. */
function fromMain(path) {
  try {
    return JSON.parse(execFileSync('git', ['show', `origin/main:${path}`], { cwd: ROOT, encoding: 'utf8' }));
  } catch (e) {
    console.error(`\n  ✗ Impossibile leggere ${path} da origin/main.`);
    console.error(`    Esegui prima: git fetch origin main\n`);
    process.exit(1);
  }
}

const mConfig = fromMain('data/config.json');
const mChiSono = fromMain('data/chi-sono.json');
const mTecniche = fromMain('data/tecniche.json');
const mMateriali = fromMain('data/materiali.json');
const mEsclusi = fromMain('data/materiali-esclusi.json');
const mProcesso = fromMain('data/processo.json');
const mFaq = fromMain('data/faq.json');

/* ============================================================
   1. TECNOLOGIE — le 8 lavorazioni reali
   ============================================================ */

const TECH_FAMILY = {
  'taglio-laser': 'laser',
  'incisione-laser': 'laser',
  'marcatura-metalli': 'laser',
  'stampa-uv': 'stampa',
  'stampa-cilindri': 'stampa',
  'personalizzazione-tessile': 'stampa',
  'sublimazione-3d': 'stampa',
  'prototipazione': 'progetto'
};

/* I materiali citati nelle tecniche usano un vocabolario più largo dei
   12 materiali con scheda: qui si riportano agli id reali. */
const MAT_ALIAS = {
  legno: 'legno-massello',
  compensato: 'compensato',
  mdf: 'mdf',
  plexiglass: 'plexiglass-colato',
  pelle: 'pelle-vegetale',
  sughero: 'sughero',
  cartoncino: null,      // lavorato, ma senza scheda materiale dedicata
  tessuto: 'tessuto',
  gomma: null,
  acciaio: 'acciaio-inox',
  'acciaio inox': 'acciaio-inox',
  inox: 'acciaio-inox',
  alluminio: 'alluminio-anodizzato',
  ottone: 'ottone',
  vetro: 'vetro',
  ardesia: 'ardesia',
  oro: null,
  argento: null
};

const normMat = (s) => MAT_ALIAS[String(s).toLowerCase().trim()] ?? null;

const technologies = mTecniche.map((t, i) => ({
  id: t.id,
  name: { it: t.n, en: t.n },
  family: TECH_FAMILY[t.id] || 'lavorazione',
  order: i + 1,
  featured: i < 5,
  short: { it: t.sommario, en: t.sommario },
  // I limiti stanno nella tabella delle specifiche: ripeterli nel testo
  // farebbe leggere due volte la stessa frase.
  description: { it: t.quandoConviene || t.sommario, en: t.sommario },
  specs: Object.fromEntries(Object.entries({
    macchina: t.macchina,
    'quando conviene': t.quandoConviene ? `${t.quandoConviene.split('.')[0]}.` : null,
    limiti: t.limiti
  }).filter(([, v]) => v)),
  materials: [...new Set((t.materiali || []).map(normMat).filter(Boolean))],
  bestFor: { it: (t.usiTipici || []).join(', ') || t.sommario, en: t.sommario }
}));

write('data/technologies.json', technologies);

/* ============================================================
   2. MATERIALI — i 12 reali
   ============================================================ */

const materials = mMateriali.map((m, i) => {
  const lavorazioni = [
    m.incisione ? 'incisione-laser' : null,
    m.marcatura ? 'marcatura-metalli' : null,
    m.stampaUv ? 'stampa-uv' : null,
    m.taglio ? 'taglio-laser' : null
  ].filter(Boolean);

  return {
    id: m.id,
    name: { it: m.n, en: m.n },
    family: m.famiglia || 'altro',
    order: i + 1,
    featured: i < 6,
    short: { it: (m.resa || '').split('.')[0] + '.', en: '' },
    description: { it: [m.resa, m.attenzione].filter(Boolean).join('\n\n'), en: m.resa || '' },
    properties: Object.fromEntries(Object.entries({
      spessori: m.spessori,
      taglio: m.taglio,
      incisione: m.incisione ? 'sì' : 'no',
      'marcatura laser': m.marcatura ? 'sì' : 'no',
      'stampa UV': m.stampaUv ? 'sì' : 'no'
    }).filter(([, v]) => v)),
    technologies: lavorazioni,
    bestFor: { it: (m.usiTipici || []).join(', '), en: '' },
    warning: m.attenzione || null
  };
});

write('data/materials.json', materials);

/* ============================================================
   3. RIMAPPATURA DEI 176 PRODOTTI
   ------------------------------------------------------------
   Gli id di materiali e tecnologie cambiano: senza rimappatura
   il catalogo perderebbe ogni riferimento.
   ============================================================ */

const MAT_MAP = {
  legno: 'legno-massello',
  betulla: 'compensato',
  mdf: 'mdf',
  compensato: 'compensato',
  plexiglass: 'plexiglass-colato',
  acrilico: 'plexiglass-colato',
  alluminio: 'alluminio-anodizzato',
  acciaio: 'acciaio-inox',
  ottone: 'ottone',
  pelle: 'pelle-vegetale',
  tessuto: 'tessuto',
  // Il laboratorio non fa stampa 3D FDM: i pezzi che la usavano
  // passano al materiale con cui verrebbero davvero realizzati.
  pla: 'plexiglass-colato',
  petg: 'plexiglass-colato',
  // Carta e cartone restano lavorabili ma senza scheda materiale:
  // si riportano al supporto rigido equivalente.
  carta: null,
  cartone: null
};

const TECH_MAP = {
  'laser-co2': 'taglio-laser',
  taglio: 'taglio-laser',
  incisione: 'incisione-laser',
  'laser-mopa': 'marcatura-metalli',
  'laser-fibra': 'marcatura-metalli',
  marcatura: 'marcatura-metalli',
  'uv-printing': 'stampa-uv',
  dtf: 'personalizzazione-tessile',
  'stampa-3d': 'prototipazione',
  verniciatura: null,   // finitura interna, non una lavorazione a catalogo
  assemblaggio: null
};

const matIds = new Set(materials.map((m) => m.id));
const techIds = new Set(technologies.map((t) => t.id));

/* Il seed è la fonte del catalogo: se non si rimappa anche lui, il primo
   `npm run build:catalog` riporterebbe indietro tutti i vecchi id. */
function remapSeed() {
  const path = 'scripts/seed/catalog-seed.mjs';
  let src = readFileSync(join(ROOT, path), 'utf8');
  let changes = 0;

  for (const [from, to] of [...Object.entries(MAT_MAP), ...Object.entries(TECH_MAP)]) {
    if (from === to) continue;
    // Solo token interi fra apici: evita di toccare 'legno' dentro 'legno-massello'.
    const re = new RegExp(`'${from}'`, 'g');
    const hits = (src.match(re) || []).length;
    if (!hits) continue;
    changes += hits;
    src = src.replace(re, to === null ? "'__DROP__'" : `'${to}'`);
  }

  // Le voci non più pertinenti spariscono dagli array, senza lasciare buchi.
  src = src.replace(/'__DROP__',\s*/g, '').replace(/,\s*'__DROP__'/g, '').replace(/'__DROP__'/g, '');
  // Un array svuotato dalla rimappatura riceve il default del laboratorio.
  src = src.replace(/\[\s*\](,\s*\[)/g, "['compensato']$1");

  writeFileSync(join(ROOT, path), src, 'utf8');
  return changes;
}

const seedChanges = remapSeed();

/* Nella categoria "Plexi & Metallo" le sottocategorie prendono il nome dal
   materiale: se cambia l'id del materiale deve cambiare anche il loro,
   altrimenti i prodotti puntano a una sottocategoria che non esiste più. */
const categories = read('data/categories.json');
let subRenamed = 0;
for (const c of categories) {
  for (const s of c.subcategories || []) {
    const mapped = MAT_MAP[s.id];
    if (mapped && matIds.has(mapped) && mapped !== s.id) {
      s.id = mapped;
      subRenamed++;
    }
  }
}
if (subRenamed) write('data/categories.json', categories);

/* La collezione "Sicilia" nasceva dall'ipotesi sbagliata sulla sede.
   Il laboratorio è a Cesena: la collezione sparisce e i prodotti che la
   usavano passano a "turismo", che è il mercato che intercettavano davvero. */
const migration = read('data/migration.json');
const hadSicilia = migration.collections.some((c) => c.id === 'sicilia');
if (hadSicilia) {
  migration.collections = migration.collections.filter((c) => c.id !== 'sicilia');
  migration.collections.forEach((c, i) => { c.order = i + 1; });
  write('data/migration.json', migration);

  const seedPath = 'scripts/seed/catalog-seed.mjs';
  let seedSrc = readFileSync(join(ROOT, seedPath), 'utf8');
  seedSrc = seedSrc.replace(/'sicilia'/g, "'turismo'");
  writeFileSync(join(ROOT, seedPath), seedSrc, 'utf8');
}

const products = read('data/products.json');

let remapped = 0;
const emptied = [];

for (const p of products) {
  const beforeM = JSON.stringify(p.materials);
  const beforeT = JSON.stringify(p.technologies);

  p.materials = [...new Set((p.materials || [])
    .map((m) => (matIds.has(m) ? m : MAT_MAP[m]))
    .filter((m) => m && matIds.has(m)))];

  p.technologies = [...new Set((p.technologies || [])
    .map((t) => (techIds.has(t) ? t : TECH_MAP[t]))
    .filter((t) => t && techIds.has(t)))];

  // Un prodotto senza materiale o lavorazione non è descrivibile:
  // si assegna il default del laboratorio invece di lasciarlo muto.
  if (!p.materials.length) { p.materials = ['compensato']; emptied.push(`${p.id} (materiali)`); }
  if (!p.technologies.length) { p.technologies = ['taglio-laser']; emptied.push(`${p.id} (lavorazioni)`); }

  p.tags = [...new Set([p.category, p.subcategory, ...p.materials, ...p.technologies, ...(p.uses || [])])];

  if (JSON.stringify(p.materials) !== beforeM || JSON.stringify(p.technologies) !== beforeT) remapped++;
}

write('data/products.json', products);

/* ============================================================
   4. CONFIGURAZIONE — dati reali
   ============================================================ */

const config = read('data/config.json');

config.brand.person = mConfig.titolare;
config.brand.role = { it: mConfig.ruolo, en: 'Maker and designer' };
config.brand.payoff = { it: mConfig.claim, en: 'From idea to finished piece.' };
config.brand.claim = { it: mConfig.descrizione, en: config.brand.claim.en };

config.site.description = mConfig.descrizione;
config.site.title = `INGLY DESIGN — ${mConfig.claim}`;

config.contact.email = mConfig.contatti.email;
config.contact.phone = mConfig.contatti.whatsapp;
config.contact.whatsapp = `https://wa.me/${mConfig.contatti.whatsappNumero}`;
config.contact.city = mConfig.sede.citta;
config.contact.region = mConfig.sede.regione;
config.contact.province = mConfig.sede.provincia;
config.contact.country = 'Italia';
delete config.contact.note;

config.social.instagram = mConfig.social.instagram || '';
config.social.facebook = mConfig.social.facebook || '';

config.stats.materiali = materials.length;
config.stats.tecnologie = technologies.length;

config.business.leadTime = { it: '5–10 giorni dal sì al pezzo in mano', en: '5–10 days from approval to delivery' };

write('data/config.json', config);

/* ============================================================
   5. CONTENUTI — racconto, processo, FAQ, materiali esclusi
   ============================================================ */

const content = read('data/content.json');

// Chi sono: il racconto reale sostituisce la biografia vuota.
content.chiSono.lead = { it: mChiSono.sommario, en: content.chiSono.lead.en };
content.chiSono.role = { it: `${mChiSono.ruolo} — INGLY DESIGN`, en: content.chiSono.role.en };
content.chiSono.biografia = { it: mChiSono.racconto.join('\n\n'), en: '' };
delete content.chiSono.biografia._todo;

content.chiSono.principi = mChiSono.principi.map((p) => ({
  title: { it: p.t, en: p.t },
  text: { it: p.d, en: p.d }
}));

// Il laboratorio non è più in Sicilia.
content.chiSono.sections = content.chiSono.sections.filter((s) => s.id !== 'laboratorio');
content.chiSono.sections.unshift({
  id: 'laboratorio',
  title: { it: 'Il laboratorio', en: 'The workshop' },
  body: {
    it: mChiSono.racconto[1],
    en: 'Four technologies that complement each other, all in-house.'
  }
});

// Processo: i 6 passaggi reali sostituiscono gli 8 ipotizzati.
// I tempi dichiarati per ogni passaggio sono un dato che il sito precedente
// esponeva e che vale la pena non perdere.
content.comeAcquistare.title = { it: mProcesso.titolo, en: 'How to order' };
content.comeAcquistare.lead = { it: mProcesso.sommario, en: content.comeAcquistare.lead.en };
content.comeAcquistare.steps = mProcesso.passi.map((s, i) => ({
  n: s.n ?? i + 1,
  title: { it: s.t, en: s.t },
  text: { it: s.d, en: s.d },
  ...(s.tempi ? { timing: { it: s.tempi, en: s.tempi } } : {})
}));
if (mProcesso.pagamenti) content.comeAcquistare.pagamenti = mProcesso.pagamenti;

// FAQ reali.
const faqList = Array.isArray(mFaq) ? mFaq : (mFaq.faq || Object.values(mFaq)[0]);
content.comeAcquistare.faq = faqList.map((f) => ({
  q: { it: f.q, en: f.q },
  a: { it: f.a, en: f.a }
}));

// Materiali che non si lavorano: è una delle pagine più utili del sito.
content.materiali.esclusi = {
  title: { it: mEsclusi.titolo, en: 'Materials we do not process' },
  intro: { it: mEsclusi.premessa, en: '' },
  items: mEsclusi.materiali.map((m) => ({
    name: { it: m.m, en: m.m },
    why: { it: m.perche, en: m.perche },
    alternative: { it: m.alternativa, en: m.alternativa }
  }))
};

// La sede corretta entra nei testi di homepage.
content.home.hero.lead = { it: mConfig.descrizione, en: content.home.hero.lead.en };
content.home.hero.title = { it: mConfig.claim, en: 'From idea to finished piece.' };
content.home.hero.eyebrow = { it: mConfig.ruolo, en: 'Maker and designer' };

/* ---- Testi che citavano i numeri sbagliati ----------------------------
   Erano scritti sulle ipotesi: 11 lavorazioni, 15 materiali, 8 passaggi.
   Vanno riallineati alla realtà, altrimenti il sito si contraddice da solo. */

const nTech = technologies.length;
const nMat = materials.length;
const nSteps = content.comeAcquistare.steps.length;

content.home.technologies.title = {
  it: `${nTech === 8 ? 'Otto' : nTech} lavorazioni, un solo laboratorio`,
  en: `${nTech} processes, one workshop`
};
content.home.technologies.lead = {
  it: 'Taglio e incisione laser, marcatura su metallo, stampa UV anche su cilindri, personalizzazione tessile, sublimazione e prototipazione. Le macchine sono in officina a Cesena: nessun passaggio da subappaltare, nessuna attesa fra una fase e l\'altra.',
  en: 'Laser cutting and engraving, metal marking, UV printing, textile personalisation, sublimation and prototyping — all in-house.'
};

content.home.materials.title = { it: 'Non solo legno', en: 'Not only wood' };
content.home.materials.lead = {
  it: `${nMat === 12 ? 'Dodici' : nMat} materiali con scheda tecnica, dal compensato di betulla all'acciaio inox, passando per vetro, ardesia e sughero. Per ognuno c'è scritto cosa si può fare e cosa no.`,
  en: `${nMat} materials with a technical sheet, from birch plywood to stainless steel.`
};

content.home.process.title = { it: mProcesso.titolo, en: 'How to order' };
content.home.process.lead = { it: mProcesso.sommario, en: 'Six steps, each with a known next move.' };

/* Il manifesto dichiarava tolleranze mai verificate. Al loro posto vanno
   i fatti che il laboratorio può davvero sostenere. */
content.home.manifesto.points = [
  {
    title: { it: 'Il materiale segue l\'uso', en: 'Material follows use' },
    text: { it: `${nMat} materiali in lavorazione corrente, ognuno con i suoi limiti dichiarati. Il legno non è sempre la risposta giusta.`, en: 'Materials chosen case by case.' }
  },
  {
    title: { it: 'Ti dico prima cosa non funziona', en: 'You hear the problems first' },
    text: { it: mChiSono.principi[0].d, en: '' }
  },
  {
    title: { it: 'Niente va in produzione senza la tua approvazione', en: 'Nothing is produced without your approval' },
    text: { it: mChiSono.principi[1].d, en: '' }
  },
  {
    title: { it: 'Un pezzo solo è un ordine valido', en: 'A single piece is a valid order' },
    text: { it: mChiSono.principi[3].d, en: '' }
  }
];

/* ---- Famiglie: derivate dai dati, non scritte a mano -------------------
   Le pagine Materiali e Tecnologie raggruppano per famiglia e mostrano solo
   le famiglie elencate qui. Se restano quelle vecchie, i materiali delle
   famiglie nuove semplicemente non compaiono: 9 su 12 erano invisibili. */

const FAMILY_LABELS = {
  legno: { it: 'Legno e derivati', en: 'Wood and panels' },
  plastica: { it: 'Plastiche tecniche', en: 'Technical plastics' },
  metallo: { it: 'Metalli', en: 'Metals' },
  pelle: { it: 'Pelle', en: 'Leather' },
  minerale: { it: 'Minerali', en: 'Stone and glass' },
  naturale: { it: 'Naturali', en: 'Natural' },
  tessile: { it: 'Tessili', en: 'Textiles' },
  laser: { it: 'Laser', en: 'Laser' },
  stampa: { it: 'Stampa', en: 'Printing' },
  progetto: { it: 'Progetto', en: 'Design' }
};

/** Famiglie presenti nei dati, nell'ordine in cui compaiono. */
function familiesOf(items) {
  const seen = [];
  for (const x of items) if (x.family && !seen.includes(x.family)) seen.push(x.family);
  return seen.map((id) => ({ id, name: FAMILY_LABELS[id] || { it: id, en: id } }));
}

content.materiali.families = familiesOf(materials);
content.tecnologie.families = familiesOf(technologies);

content.materiali.lead = {
  it: `${nMat} materiali con scheda tecnica: spessori, cosa si può incidere, cosa si può marcare, cosa si può stampare. Dove un materiale ha un limite, è scritto.`,
  en: `${nMat} materials with technical sheets.`
};
content.tecnologie.eyebrow = { it: 'Servizi', en: 'Services' };
content.tecnologie.title = { it: 'Servizi & Lavorazioni', en: 'Services & Processes' };
content.tecnologie.lead = {
  it: `${nTech} lavorazioni, tutte in officina a Cesena. Per ognuna sono dichiarate la macchina, quando conviene usarla e cosa non può fare.`,
  en: `${nTech} in-house processes, each with machine, best use and limits.`
};

// La lista dei dati da completare: resta solo ciò che manca davvero.
content._daCompletare = [
  'config.seo.dominio — dominio definitivo, diverso da quello del sito precedente',
  'config.stats.pezzi / clienti / rating — solo se dati reali e verificabili',
  'portfolio.projects[] — lavori realmente eseguiti, con foto proprie',
  'assets/images/products/*.webp — fotografie reali delle creazioni'
];
content._nota = 'Contenuti editoriali del sito. I dati di attività, sede, contatti, lavorazioni, materiali, processo e FAQ provengono dal sito INGLY esistente (branch main) e sono REALI. Rigenerabile con: node scripts/merge-from-main.mjs';

write('data/content.json', content);

/* ============================================================
   REPORT
   ============================================================ */

const line = '─'.repeat(56);
console.log(`\n  MERGE DAI DATI REALI (origin/main)\n  ${line}`);
console.log(`  Tecnologie      ${technologies.length}  (erano 11 ipotizzate)`);
console.log(`  Materiali       ${materials.length}  (erano 15 ipotizzati)`);
console.log(`  Prodotti rimappati  ${remapped} / ${products.length}`);
console.log(`  Sede            ${mConfig.sede.citta}, ${mConfig.sede.regione}`);
console.log(`  Contatti        ${mConfig.contatti.email} · ${mConfig.contatti.whatsapp}`);
console.log(`  Processo        ${content.comeAcquistare.steps.length} passaggi reali`);
console.log(`  FAQ             ${content.comeAcquistare.faq.length} reali`);
console.log(`  Materiali esclusi  ${mEsclusi.materiali.length} documentati`);
if (emptied.length) {
  console.log(`\n  Default applicati dove la rimappatura svuotava il campo: ${emptied.length}`);
}
console.log(`\n  Ora esegui:  npm run build && npm test\n`);
