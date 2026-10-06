/* ============================================================
   INGLY DESIGN — HOMEPAGE
   ------------------------------------------------------------
   L'ordine delle sezioni non è scritto qui: arriva da
   data/content.json → home.ordine. Ogni voce di quell'array
   corrisponde a una chiave di SEZIONI. Aggiungere una sezione
   significa scrivere una funzione e nominarla nell'ordine.
   ============================================================ */

import { esc, loc, icon } from './utils.js';
import { href } from './router.js';
import { observeReveals } from './images.js';
import { productCard, categoryCard, publicProducts } from './catalog.js';

let D = null, lang = 'it', t = () => '';

export function initSections(data, l, translate) { D = data; lang = l; t = translate; }

const ORDINE_PREDEFINITO = [
  'hero', 'categorie', 'featured', 'dietro', 'intenti', 'processo',
  'portfolio', 'idea', 'tecnologie', 'materiali', 'xtool', 'b2b', 'manifesto'
];

/** Intestazione di sezione: salta le righe che nel JSON sono vuote. */
function head(c, { center = false } = {}) {
  const eyebrow = loc(c?.eyebrow, lang);
  const title = loc(c?.title, lang);
  const lead = loc(c?.lead, lang);
  if (!eyebrow && !title && !lead) return '';
  return `
    <div class="section-head${center ? ' section-head--center' : ''}">
      ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
      ${title ? `<h2 class="section-title">${esc(title)}</h2>` : ''}
      ${lead ? `<p class="section-lead">${esc(lead)}</p>` : ''}
    </div>`;
}

/** Iniziali di una categoria: al massimo due lettere. */
function monogramma(nome) {
  return String(nome || '')
    .split(/[\s&]+/).filter(Boolean).slice(0, 2)
    .map((p) => p[0]).join('').toUpperCase();
}

function more(path, label) {
  return `
    <div class="section-more">
      <a class="btn btn--outline" href="${href(path)}">${esc(label)} ${icon('arrow', 16)}</a>
    </div>`;
}

/** I contatori senza valore reale non vengono mostrati (docs/MIGRATION-MAP.md §3). */
function statsMarkup() {
  const s = D.CONFIG?.stats || {};
  const items = [
    { value: s.categorie, label: 'Categorie' },
    { value: s.materiali, label: 'Materiali' },
    { value: s.tecnologie, label: 'Tecnologie' },
    { value: s.pezzi, label: 'Pezzi realizzati' },
    { value: s.clienti, label: 'Clienti' }
  ].filter((i) => i.value != null && i.value !== '');

  if (!items.length) return '';
  return `
    <div class="hero-meta">
      ${items.map((i) => `<div><b>${esc(String(i.value))}</b><span>${esc(i.label)}</span></div>`).join('')}
    </div>`;
}

/* ---- le sezioni ------------------------------------------------------- */

const SEZIONI = {

  hero(c) {
    return `
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <p class="eyebrow">${esc(loc(c.hero?.eyebrow, lang))}</p>
          <h1 class="hero-title">${esc(loc(c.hero?.title, lang))}</h1>
          <p class="hero-lead">${esc(loc(c.hero?.lead, lang))}</p>
          <div class="hero-actions">
            <a class="btn btn--primary btn--lg" href="${href('/creazioni')}">
              ${esc(loc(c.hero?.ctaPrimary, lang))} ${icon('arrow', 16)}
            </a>
            <a class="btn btn--outline btn--lg" href="${href('/contatti')}">
              ${esc(loc(c.hero?.ctaSecondary, lang))}
            </a>
          </div>
        </div>
        ${statsMarkup()}
      </div>
    </section>`;
  },

  /** "Acquista per categoria": pastiglie circolari, una per categoria. */
  categorie(c) {
    const cats = (D.CATS || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!cats.length) return '';
    return `
    <section class="section">
      <div class="container">
        ${head(c.categories, { center: true })}
        <ul class="cat-circles">
          ${cats.map((cat, i) => `
            <li class="cat-circle reveal stagger-${(i % 6) + 1}">
              <a href="${href(`/creazioni/${cat.id}`)}">
                <span class="cat-circle-media">
                  ${cat.image
                    ? `<img src="${esc(cat.image)}" alt="" width="240" height="240" loading="lazy" decoding="async">`
                    /* Il placeholder 4:3 ritagliato in cerchio taglia a metà il
                       proprio testo. Finché non c'è una foto quadrata vera si
                       mostra il monogramma: sembra una scelta, non un errore. */
                    : `<span class="cat-circle-mono" aria-hidden="true">${esc(monogramma(loc(cat.name, lang)))}</span>`}
                </span>
                <span class="cat-circle-name">${esc(loc(cat.name, lang))}</span>
              </a>
            </li>`).join('')}
        </ul>
        ${more('/creazioni', t('cta.allCategories'))}
      </div>
    </section>`;
  },

  /** "Le nostre idee diventano prodotti": binario scorrevole, non griglia. */
  featured(c) {
    const featured = publicProducts().filter((p) => p.featured).slice(0, 10);
    if (!featured.length) return '';
    return `
    <section class="section section--alt">
      <div class="container">
        ${head(c.featured)}
        <div class="rail" role="list">
          ${featured.map((p, i) => `<div class="rail-item" role="listitem">${productCard(p, { index: i })}</div>`).join('')}
        </div>
        ${more('/creazioni', t('cta.viewCatalog'))}
      </div>
    </section>`;
  },

  /** "Chi c'è dietro": immagine, testo, tre punti, bollino circolare. */
  dietro(c) {
    const d = c.dietro;
    if (!d) return '';
    return `
    <section class="section">
      <div class="container">
        <div class="behind reveal">
          <div class="behind-media">
            <img src="${esc(d.immagine || 'assets/images/brand/officina.svg')}" alt=""
                 width="800" height="600" loading="lazy" decoding="async">
            ${loc(d.bollino, lang) ? `<span class="badge-round">${esc(loc(d.bollino, lang))}</span>` : ''}
          </div>
          <div class="behind-body">
            <p class="eyebrow">${esc(loc(d.eyebrow, lang))}</p>
            <h2 class="section-title">${esc(loc(d.title, lang))}</h2>
            ${loc(d.body, lang).split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('')}
            <ul class="behind-points">
              ${(d.punti || []).map((p) => `<li>${icon('arrow', 15)}<span>${esc(loc(p, lang))}</span></li>`).join('')}
            </ul>
            <a class="btn btn--outline" href="${href('/chi-sono')}">
              ${esc(loc(d.cta, lang) || t('nav.chiSono'))} ${icon('arrow', 16)}
            </a>
          </div>
        </div>
      </div>
    </section>`;
  },

  /** "Cosa vuoi fare oggi?": l'ingresso per intenzione, non per reparto. */
  intenti(c) {
    const s = c.intenti;
    if (!s?.voci?.length) return '';
    return `
    <section class="section section--alt">
      <div class="container">
        ${head(s, { center: true })}
        <div class="intent-grid">
          ${s.voci.map((v, i) => `
            <a class="intent-card reveal stagger-${(i % 6) + 1}" href="${href(v.path)}">
              <span class="intent-num">${String(i + 1).padStart(2, '0')}</span>
              <span class="intent-verb">${esc(loc(v.verbo, lang))}</span>
              <span class="intent-text">${esc(loc(v.testo, lang))}</span>
              <span class="intent-go">${icon('arrow', 16)}</span>
            </a>`).join('')}
        </div>
      </div>
    </section>`;
  },

  processo(c) {
    const steps = (D.CONTENT?.comeAcquistare?.steps || []).slice(0, 4);
    if (!steps.length) return '';
    return `
    <section class="section">
      <div class="container">
        ${head(c.process)}
        <div class="grid grid--4">
          ${steps.map((s, i) => `
            <div class="step reveal stagger-${i + 1}" style="grid-template-columns:1fr">
              <span class="step-n">${esc(String(s.n))}</span>
              <div>
                <h3>${esc(loc(s.title, lang))}</h3>
                <p>${esc(loc(s.text, lang))}</p>
              </div>
            </div>`).join('')}
        </div>
        ${more('/come-acquistare', t('nav.comeAcquistare'))}
      </div>
    </section>`;
  },

  portfolio() {
    /* I testi stanno in content.json, gli archetipi in portfolio.json. */
    const p = D.CONTENT?.portfolio || {};
    const archetypes = (D.PORTFOLIO?.archetypes || []).slice(0, 3);
    if (!archetypes.length) return '';
    return `
    <section class="section section--alt">
      <div class="container">
        ${head({ eyebrow: p.eyebrow, title: p.archetypesTitle, lead: p.archetypesLead })}
        <div class="grid grid--3">
          ${archetypes.map((a, i) => `
            <div class="info-card reveal stagger-${i + 1}">
              <h3>${esc(loc(a.title, lang))}</h3>
              <p>${esc(loc(a.brief, lang))}</p>
              <div class="spec-list">
                <div><span class="k">Scala</span><span class="v">${esc(loc(a.scale, lang))}</span></div>
                <div><span class="k">Tempi</span><span class="v">${esc(loc(a.leadTime, lang))}</span></div>
              </div>
            </div>`).join('')}
        </div>
        ${more('/portfolio', t('nav.portfolio'))}
      </div>
    </section>`;
  },

  /** "Hai un'idea? Creiamola insieme." */
  idea(c) {
    const s = c.idea || c.cta;
    if (!s) return '';
    return `
    <section class="section">
      <div class="container">
        <div class="cta-band reveal">
          ${loc(s.eyebrow, lang) ? `<p class="eyebrow">${esc(loc(s.eyebrow, lang))}</p>` : ''}
          <h2>${esc(loc(s.title, lang))}</h2>
          <p>${esc(loc(s.lead, lang))}</p>
          <div class="hero-actions">
            <a class="btn btn--primary btn--lg" href="${href('/contatti')}">
              ${esc(loc(s.cta, lang))} ${icon('arrow', 16)}
            </a>
          </div>
        </div>
      </div>
    </section>`;
  },

  tecnologie(c) {
    const techs = (D.TECHNOLOGIES || []).filter((x) => x.featured);
    if (!techs.length) return '';
    return `
    <section class="section section--alt">
      <div class="container">
        ${head(c.technologies)}
        <div class="grid grid--3">
          ${techs.map((x, i) => `
            <a class="info-card reveal stagger-${(i % 6) + 1}" href="${href(`/tecnologie#${x.id}`)}">
              <h3>${esc(loc(x.name, lang))}</h3>
              <p class="info-short">${esc(loc(x.short, lang))}</p>
              <p>${esc(loc(x.description, lang).split('. ')[0])}.</p>
              <div class="spec-list">
                ${Object.entries(x.specs || {}).slice(0, 3).map(([k, v]) => `
                  <div><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')}
              </div>
            </a>`).join('')}
        </div>
        ${more('/tecnologie', t('common.seeAll'))}
      </div>
    </section>`;
  },

  materiali(c) {
    const mats = (D.MATERIALS || []).filter((m) => m.featured);
    if (!mats.length) return '';
    return `
    <section class="section">
      <div class="container">
        ${head(c.materials)}
        <div class="grid grid--3">
          ${mats.map((m, i) => `
            <a class="info-card reveal stagger-${(i % 6) + 1}" href="${href(`/materiali#${m.id}`)}">
              <h3>${esc(loc(m.name, lang))}</h3>
              <p class="info-short">${esc(loc(m.short, lang))}</p>
              <p>${esc(loc(m.description, lang).split('. ')[0])}.</p>
            </a>`).join('')}
        </div>
        ${more('/materiali', t('common.seeAll'))}
      </div>
    </section>`;
  },

  /** "Tecnologia da vedere e da provare": gamma xTool e centro assistenza. */
  xtool(c) {
    const s = c.xtool;
    const x = D.XTOOL;
    if (!s || !x) return '';
    const servizi = (x.servizi || []).slice(0, 4);
    const officina = (x.gamma || []).filter((g) => g.inOfficina);
    return `
    <section class="section section--alt">
      <div class="container">
        <div class="xtool-band">
          <div class="xtool-band-body">
            <p class="eyebrow">${esc(loc(s.eyebrow, lang))}</p>
            <h2 class="section-title">${esc(loc(s.title, lang))}</h2>
            <p class="section-lead">${esc(loc(s.lead, lang))}</p>
            ${officina.length ? `
              <div class="tag-list">
                ${officina.map((g) => `<span class="chip chip--mono">${esc(loc(g.n, lang) || g.n)}</span>`).join('')}
              </div>` : ''}
            <div class="section-more">
              <a class="btn btn--primary" href="${href('/xtool')}">
                ${esc(loc(s.cta, lang))} ${icon('arrow', 16)}
              </a>
            </div>
          </div>
          <div class="xtool-band-aside">
            ${servizi.map((sv) => `
              <div class="xtool-service">
                <h3>${esc(loc(sv.n, lang))}</h3>
                <p>${esc(loc(sv.tempi, lang) || loc(sv.d, lang))}</p>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </section>`;
  },

  b2b(c) {
    const segments = (D.CONTENT?.b2b?.segments || []).slice(0, 4);
    if (!segments.length) return '';
    return `
    <section class="section">
      <div class="container">
        ${head(c.b2b)}
        <div class="segment-grid">
          ${segments.map((s, i) => `
            <div class="segment reveal stagger-${i + 1}">
              <h3>${esc(loc(s.title, lang))}</h3>
              <p>${esc(loc(s.text, lang))}</p>
            </div>`).join('')}
        </div>
        ${more('/b2b', t('nav.b2b'))}
      </div>
    </section>`;
  },

  manifesto(c) {
    if (!c.manifesto) return '';
    return `
    <section class="section section--alt">
      <div class="container">
        <div class="manifesto-grid">
          <div class="manifesto-body reveal">
            <p class="eyebrow">${esc(loc(c.manifesto.eyebrow, lang))}</p>
            <h2 class="section-title">${esc(loc(c.manifesto.title, lang))}</h2>
            ${loc(c.manifesto.body, lang).split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('')}
          </div>
          <div class="manifesto-points">
            ${(c.manifesto.points || []).map((p, i) => `
              <div class="manifesto-point reveal stagger-${i + 1}">
                <h3>${esc(loc(p.title, lang))}</h3>
                <p>${esc(loc(p.text, lang))}</p>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </section>`;
  }
};

export function renderHome(root) {
  const c = D.CONTENT?.home || {};
  const ordine = Array.isArray(c.ordine) && c.ordine.length ? c.ordine : ORDINE_PREDEFINITO;

  root.innerHTML = ordine
    .map((nome) => {
      const fn = SEZIONI[nome];
      if (!fn) { console.warn('[INGLY] sezione home sconosciuta:', nome); return ''; }
      return fn(c);
    })
    .join('\n');

  observeReveals(root);
}
