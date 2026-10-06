/* ============================================================
   INGLY DESIGN — PAGINE EDITORIALI
   Materiali, Tecnologie, Chi sono, Portfolio, Come acquistare, B2B.
   ============================================================ */

import { esc, loc, icon, joinIt } from './utils.js';
import { href } from './router.js';
import { observeReveals } from './images.js';

let D = null, lang = 'it', t = () => '';

export function initPages(data, l, translate) { D = data; lang = l; t = translate; }

const head = (c) => `
  <header class="page-head">
    <p class="eyebrow">${esc(loc(c.eyebrow, lang))}</p>
    <h1>${esc(loc(c.title, lang))}</h1>
    <p>${esc(loc(c.lead, lang))}</p>
  </header>`;

const YES_NO = { 'sì': true, si: true, yes: true };
const flagChip = (label, value) => {
  const v = String(value || '').toLowerCase();
  const on = Object.keys(YES_NO).some((k) => v.startsWith(k));
  return `<span class="chip ${on ? 'chip--accent' : ''}">${esc(label)}: ${esc(value)}</span>`;
};

/* ---- MATERIALI --------------------------------------------------------- */

export function renderMaterials(root) {
  const c = D.CONTENT?.materiali || {};
  const families = c.families || [];
  const mats = (D.MATERIALS || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  root.innerHTML = `
    <div class="container">
      ${head(c)}
      ${families.map((f) => {
        const list = mats.filter((m) => m.family === f.id);
        if (!list.length) return '';
        return `
        <section class="section section--tight">
          <div class="section-head">
            <p class="eyebrow">${esc(loc(f.name, lang))}</p>
          </div>
          <div class="grid grid--3">
            ${list.map((m, i) => `
              <article class="info-card reveal stagger-${(i % 6) + 1}" id="${esc(m.id)}">
                <h3>${esc(loc(m.name, lang))}</h3>
                <p class="info-short">${esc(loc(m.short, lang))}</p>
                <p>${esc(loc(m.description, lang))}</p>
                <div class="spec-list">
                  ${Object.entries(m.properties || {}).map(([k, v]) => `
                    <div><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')}
                </div>
                <div class="tag-list" style="margin-top:var(--sp-4)">
                  <a class="chip" href="${href(`/creazioni?mat=${m.id}`)}">${esc(t('cta.viewCatalog'))}</a>
                </div>
              </article>`).join('')}
          </div>
        </section>`;
      }).join('')}
    </div>`;
  observeReveals(root);
}

/* ---- TECNOLOGIE -------------------------------------------------------- */

export function renderTechnologies(root) {
  const c = D.CONTENT?.tecnologie || {};
  const families = c.families || [];
  const techs = (D.TECHNOLOGIES || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  root.innerHTML = `
    <div class="container">
      ${head(c)}
      ${families.map((f) => {
        const list = techs.filter((x) => x.family === f.id);
        if (!list.length) return '';
        return `
        <section class="section section--tight">
          <div class="section-head">
            <p class="eyebrow">${esc(loc(f.name, lang))}</p>
          </div>
          <div class="grid grid--2">
            ${list.map((x, i) => `
              <article class="info-card reveal stagger-${(i % 6) + 1}" id="${esc(x.id)}">
                <h3>${esc(loc(x.name, lang))}</h3>
                <p class="info-short">${esc(loc(x.short, lang))}</p>
                <p>${esc(loc(x.description, lang))}</p>
                <div class="spec-list">
                  ${Object.entries(x.specs || {}).map(([k, v]) => `
                    <div><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')}
                </div>
                <div class="tag-list" style="margin-top:var(--sp-4)">
                  <a class="chip" href="${href(`/creazioni?tec=${x.id}`)}">${esc(t('cta.viewCatalog'))}</a>
                </div>
              </article>`).join('')}
          </div>
        </section>`;
      }).join('')}
    </div>`;
  observeReveals(root);
}

/* ---- CHI SONO ---------------------------------------------------------- */

export function renderAbout(root) {
  const c = D.CONTENT?.chiSono || {};
  const bio = loc(c.biografia, lang);

  root.innerHTML = `
    <div class="container container--narrow">
      <header class="page-head">
        <p class="eyebrow">${esc(loc(c.eyebrow, lang))}</p>
        <h1>${esc(loc(c.title, lang))}</h1>
        <p style="font-family:var(--font-mono);font-size:var(--fs-sm);color:var(--accent-text);margin-bottom:var(--sp-5)">
          ${esc(loc(c.role, lang))}
        </p>
        <p>${esc(loc(c.lead, lang))}</p>
      </header>

      ${bio ? `<div class="prose">${bio.split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('')}</div>` : ''}

      ${(c.sections || []).map((s) => `
        <section class="editorial-section reveal" id="${esc(s.id)}">
          <div class="editorial-grid">
            <h2>${esc(loc(s.title, lang))}</h2>
            <div class="prose">
              ${loc(s.body, lang).split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('')}
            </div>
          </div>
        </section>`).join('')}

      <section class="section section--tight">
        <div class="cta-band">
          <h2 style="font-size:var(--fs-2xl)">${esc(loc(D.CONTENT?.home?.cta?.title, lang))}</h2>
          <p>${esc(loc(D.CONTENT?.home?.cta?.lead, lang))}</p>
          <div class="hero-actions">
            <a class="btn btn--primary btn--lg" href="${href('/contatti')}">${esc(t('cta.request'))} ${icon('arrow', 16)}</a>
          </div>
        </div>
      </section>
    </div>`;
  observeReveals(root);
}

/* ---- PORTFOLIO --------------------------------------------------------- */

export function renderPortfolio(root) {
  const c = D.CONTENT?.portfolio || {};
  const projects = D.PORTFOLIO?.projects || [];
  const archetypes = D.PORTFOLIO?.archetypes || [];

  root.innerHTML = `
    <div class="container">
      ${head(c)}

      ${projects.length ? `
        <div class="grid grid--3">
          ${projects.map((p, i) => `
            <article class="info-card reveal stagger-${(i % 6) + 1}">
              <h3>${esc(loc(p.title, lang))}</h3>
              <p>${esc(loc(p.brief, lang))}</p>
            </article>`).join('')}
        </div>`
      : `
        <div class="notice">
          <h3>${esc(loc(c.emptyState?.title, lang))}</h3>
          ${loc(c.emptyState?.text, lang).split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('')}
        </div>`}

      <section class="section section--tight">
        <div class="section-head">
          <p class="eyebrow">${esc(loc(c.archetypesTitle, lang))}</p>
          <p class="section-lead">${esc(loc(c.archetypesLead, lang))}</p>
        </div>
        <div class="grid grid--2">
          ${archetypes.map((a, i) => `
            <article class="archetype reveal stagger-${(i % 6) + 1}">
              <div class="archetype-head">
                <h3>${esc(loc(a.title, lang))}</h3>
                <span class="chip chip--mono">${esc(loc(a.scale, lang))}</span>
              </div>
              <p>${esc(loc(a.brief, lang))}</p>
              <div class="spec-list">
                <div><span class="k">Tempi</span><span class="v">${esc(loc(a.leadTime, lang))}</span></div>
                <div><span class="k">Lavorazioni</span><span class="v">${esc(String(a.technologies?.length || 0))}</span></div>
              </div>
              <div class="archetype-includes">
                ${(a.includes || []).map((x) => `<span class="chip">${esc(x)}</span>`).join('')}
              </div>
            </article>`).join('')}
        </div>
      </section>
    </div>`;
  observeReveals(root);
}

/* ---- COME ACQUISTARE --------------------------------------------------- */

export function renderHow(root) {
  const c = D.CONTENT?.comeAcquistare || {};

  root.innerHTML = `
    <div class="container container--narrow">
      ${head(c)}

      <div class="steps">
        ${(c.steps || []).map((s, i) => `
          <div class="step reveal stagger-${(i % 6) + 1}">
            <span class="step-n">${s.n}</span>
            <div>
              <h3>${esc(loc(s.title, lang))}</h3>
              <p>${esc(loc(s.text, lang))}</p>
            </div>
          </div>`).join('')}
      </div>

      <section class="section section--tight">
        <div class="section-head">
          <p class="eyebrow">${esc(t('product.faq'))}</p>
        </div>
        <div class="accordion" data-accordion>
          ${(c.faq || []).map((f, i) => `
            <div class="accordion-item">
              <h3>
                <button type="button" class="accordion-trigger" aria-expanded="false" aria-controls="hf-${i}">
                  ${esc(loc(f.q, lang))} ${icon('plus', 18)}
                </button>
              </h3>
              <div class="accordion-panel" id="hf-${i}">
                <p>${esc(loc(f.a, lang))}</p>
              </div>
            </div>`).join('')}
        </div>
      </section>

      <div class="cta-band">
        <h2 style="font-size:var(--fs-2xl)">${esc(loc(D.CONTENT?.home?.cta?.title, lang))}</h2>
        <p>${esc(loc(D.CONTENT?.home?.cta?.lead, lang))}</p>
        <div class="hero-actions">
          <a class="btn btn--primary btn--lg" href="${href('/contatti')}">${esc(t('cta.request'))} ${icon('arrow', 16)}</a>
        </div>
      </div>
    </div>`;
  observeReveals(root);
}

/* ---- B2B --------------------------------------------------------------- */

export function renderB2b(root) {
  const c = D.CONTENT?.b2b || {};

  root.innerHTML = `
    <div class="container">
      ${head(c)}

      <section class="section section--tight">
        <div class="segment-grid">
          ${(c.segments || []).map((s, i) => `
            <article class="segment reveal stagger-${(i % 6) + 1}">
              <h3>${esc(loc(s.title, lang))}</h3>
              <p>${esc(loc(s.text, lang))}</p>
            </article>`).join('')}
        </div>
      </section>

      <section class="section section--tight">
        <div class="section-head">
          <p class="eyebrow">Perché una fornitura coordinata</p>
        </div>
        <div class="grid grid--4">
          ${(c.advantages || []).map((a, i) => `
            <div class="manifesto-point reveal stagger-${i + 1}">
              <h3>${esc(loc(a.title, lang))}</h3>
              <p>${esc(loc(a.text, lang))}</p>
            </div>`).join('')}
        </div>
      </section>

      <div class="cta-band">
        <h2 style="font-size:var(--fs-2xl)">${esc(loc(c.cta, lang))}</h2>
        <p>${esc(loc(D.CONTENT?.home?.cta?.lead, lang))}</p>
        <div class="hero-actions">
          <a class="btn btn--primary btn--lg" href="${href('/contatti?tipo=b2b')}">
            ${esc(loc(c.cta, lang))} ${icon('arrow', 16)}
          </a>
        </div>
      </div>
    </div>`;
  observeReveals(root);
}


/* ---- INFORMAZIONI (spedizioni, resi, privacy, condizioni, cookie) ------
   Sono le pagine che Shopify genera d'ufficio sotto /policies/ e che qui non
   esistevano. Per un e-commerce italiano non sono facoltative.

   Dove serve un dato aziendale o il parere di un professionista il testo non
   è inventato: `daCompletare` lo dichiara in pagina, così nessuno pubblica
   un'informativa generica credendola a posto. */

export function findInfoPage(id) {
  return (D.INFO?.pagine || []).find((p) => p.id === id) || null;
}

export function renderInfo(root, p) {
  root.innerHTML = `
    <div class="container container--narrow">
      <header class="page-head">
        <p class="eyebrow">${esc(loc(p.occhiello, lang))}</p>
        <h1>${esc(loc(p.n, lang))}</h1>
        <p>${esc(loc(p.lead, lang))}</p>
      </header>

      ${p.daCompletare ? `
      <div class="card"><div class="card-body">
        <p><strong>${esc(t('info.daCompletare'))}</strong> ${esc(loc(p.daCompletare, lang))}</p>
      </div></div>` : ''}

      ${(p.sezioni || []).map((sz, i) => `
        <section class="section section--tight reveal stagger-${(i % 6) + 1}">
          <h2>${esc(loc(sz.t, lang))}</h2>
          <p>${esc(loc(sz.c, lang))}</p>
        </section>`).join('')}

      <section class="section section--tight">
        <div class="tag-list">
          ${(D.INFO?.pagine || []).filter((x) => x.id !== p.id).map((x) =>
            `<a class="chip" href="${href('/informazioni/' + x.id)}">${esc(loc(x.n, lang))}</a>`).join('')}
        </div>
      </section>
    </div>`;
  observeReveals(root);
}

/* ---- xTOOL · CENTRO ASSISTENZA UFFICIALE ------------------------------- */

/* Perché questa sezione esiste e non è «una pagina sulle nostre macchine»:
   siamo centro assistenza e riparazione autorizzato, quindi il servizio
   riguarda TUTTA la gamma, non i quattro modelli che abbiamo in officina.
   Due campi dei dati cambiano quello che la pagina dice di ogni modello:
   `inOfficina` (lo usiamo per produrre, quindi lo conosciamo nell'uso) e
   `fuoriProduzione` (nessuno lo assiste più: è dove serviamo di più). */

const ORDINE_SERIE = ['P', 'F', 'S', 'M', 'Stampa', 'Fuori produzione'];

const NOMI_SERIE = {
  P: { it: 'Serie P — laser CO₂', en: 'P series — CO₂ lasers' },
  F: { it: 'Serie F — fibra, infrarosso e UV', en: 'F series — fibre, infrared and UV' },
  S: { it: 'Serie S — diodo chiuso', en: 'S series — enclosed diode' },
  M: { it: 'Serie M — stampa e taglio', en: 'M series — print and cut' },
  Stampa: { it: 'Stampa e trasferimento', en: 'Printing and transfer' },
  'Fuori produzione': { it: 'Fuori produzione — assistite lo stesso', en: 'Discontinued — still serviced' }
};

function schedaMacchina(m, i) {
  const etichette = [];
  if (m.inOfficina) etichette.push(`<span class="chip chip--accent">${esc(t('xtool.inOfficina'))}</span>`);
  if (m.fuoriProduzione) etichette.push(`<span class="chip">${esc(t('xtool.fuoriProduzione'))}</span>`);
  return `
    <article class="info-card reveal stagger-${(i % 6) + 1}" id="${esc(m.id)}">
      ${etichette.length ? `<div class="tag-list">${etichette.join('')}</div>` : ''}
      <h3>${esc(m.n)}</h3>
      <p class="info-short">${esc(loc(m.tipo, lang))}</p>
      <p>${esc(loc(m.perChi, lang))}</p>
      <div class="spec-list">
        ${Object.entries(m.specs || {}).map(([k, v]) => `
          <div><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')}
      </div>
      <div class="tag-list" style="margin-top:var(--sp-4)">
        <a class="chip" href="${href('/xtool/' + m.id)}">${esc(t('xtool.scheda'))}</a>
      </div>
    </article>`;
}

export function renderXtool(root) {
  const X = D.XTOOL || {};
  const c = X.centro || {};
  const gamma = X.gamma || [];
  const serie = ORDINE_SERIE.filter((k) => gamma.some((m) => m.serie === k));

  root.innerHTML = `
    <div class="container">
      <header class="page-head">
        <p class="eyebrow">${esc(loc(c.occhiello, lang))}</p>
        <h1>${esc(loc(c.titolo, lang))}</h1>
        <p>${esc(loc(c.sommario, lang))}</p>
      </header>

      <section class="section section--tight">
        <div class="card"><div class="card-body">
          <p>${esc(loc(c.percheConta, lang))}</p>
        </div></div>
      </section>

      <section class="section">
        <div class="section-head">
          <p class="eyebrow">${esc(t('xtool.serviziEyebrow'))}</p>
          <h2>${esc(t('xtool.serviziTitolo'))}</h2>
        </div>
        <div class="grid grid--2">
          ${(X.servizi || []).map((sv, i) => `
            <article class="info-card reveal stagger-${(i % 6) + 1}" id="${esc(sv.id)}">
              <h3>${esc(loc(sv.n, lang))}</h3>
              <p>${esc(loc(sv.d, lang))}</p>
              <div class="spec-list">
                <div><span class="k">${esc(t('xtool.tempi'))}</span><span class="v">${esc(loc(sv.tempi, lang))}</span></div>
              </div>
            </article>`).join('')}
        </div>
        <div class="tag-list" style="margin-top:var(--sp-6)">
          <a class="btn btn--primary" href="${href('/contatti?motivo=assistenza-xtool')}">${esc(t('xtool.ctaAssistenza'))}</a>
        </div>
      </section>

      ${serie.map((k) => {
        const lista = gamma.filter((m) => m.serie === k);
        return `
        <section class="section section--tight">
          <div class="section-head">
            <p class="eyebrow">${esc(loc(NOMI_SERIE[k], lang))}</p>
          </div>
          <div class="grid grid--2">${lista.map(schedaMacchina).join('')}</div>
        </section>`;
      }).join('')}

      <section class="section">
        <div class="section-head">
          <p class="eyebrow">${esc(t('xtool.domandeEyebrow'))}</p>
          <h2>${esc(t('xtool.domandeTitolo'))}</h2>
        </div>
        <div class="accordion" data-accordion>
          ${(X.faq || []).map((q, i) => `
            <div class="accordion-item">
              <h3>
                <button type="button" class="accordion-trigger" aria-expanded="false" aria-controls="xf-${i}">
                  ${esc(loc(q.q, lang))} ${icon('plus', 18)}
                </button>
              </h3>
              <div class="accordion-panel" id="xf-${i}">
                <p>${esc(loc(q.a, lang))}</p>
              </div>
            </div>`).join('')}
        </div>
      </section>
    </div>`;
  observeReveals(root);
}

export function findXtoolMachine(id) {
  return (D.XTOOL?.gamma || []).find((m) => m.id === id) || null;
}

export function renderXtoolMachine(root, m) {
  const X = D.XTOOL || {};
  const etichette = [];
  if (m.inOfficina) etichette.push(`<span class="chip chip--accent">${esc(t('xtool.inOfficina'))}</span>`);
  if (m.fuoriProduzione) etichette.push(`<span class="chip">${esc(t('xtool.fuoriProduzione'))}</span>`);

  root.innerHTML = `
    <div class="container">
      <nav class="breadcrumb" aria-label="${esc(t('nav.breadcrumb') || 'Percorso')}">
        <a href="${href('/xtool')}">${esc(loc(X.centro?.occhiello, lang))}</a>
        <span aria-hidden="true">›</span>
        <span aria-current="page">${esc(m.n)}</span>
      </nav>

      <header class="page-head">
        ${etichette.length ? `<div class="tag-list">${etichette.join('')}</div>` : ''}
        <h1>${esc(m.n)}</h1>
        <p>${esc(loc(m.tipo, lang))} — ${esc(loc(m.perChi, lang))}</p>
      </header>

      <section class="section section--tight">
        <div class="section-head"><p class="eyebrow">${esc(t('xtool.specifiche'))}</p></div>
        <div class="spec-list">
          ${Object.entries(m.specs || {}).map(([k, v]) => `
            <div><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')}
        </div>
      </section>

      ${m.inOfficina ? `
      <section class="section section--tight">
        <div class="card"><div class="card-body">
          <p>${esc(t('xtool.notaInOfficina'))}</p>
        </div></div>
      </section>` : ''}

      ${m.fuoriProduzione ? `
      <section class="section section--tight">
        <div class="card"><div class="card-body">
          <p><strong>${esc(t('xtool.fuoriProduzione'))}.</strong> ${esc(t('xtool.notaFuoriProduzione'))}</p>
        </div></div>
      </section>` : ''}

      <section class="section">
        <div class="section-head">
          <p class="eyebrow">${esc(t('xtool.serviziEyebrow'))}</p>
          <h2>${esc(t('xtool.serviziSuQuesta'))}</h2>
        </div>
        <div class="grid grid--2">
          ${(X.servizi || []).map((sv, i) => `
            <article class="info-card reveal stagger-${(i % 6) + 1}">
              <h3>${esc(loc(sv.n, lang))}</h3>
              <p>${esc(loc(sv.d, lang))}</p>
            </article>`).join('')}
        </div>
        <div class="tag-list" style="margin-top:var(--sp-6)">
          <a class="btn btn--primary" href="${href('/contatti?motivo=assistenza-xtool&macchina=' + m.id)}">${esc(t('xtool.ctaQuesta'))}</a>
          <a class="chip" href="${href('/xtool')}">${esc(t('xtool.tuttaLaGamma'))}</a>
        </div>
      </section>
    </div>`;
  observeReveals(root);
}

/* ---- 404 --------------------------------------------------------------- */


export function renderNotFound(root, path) {
  root.innerHTML = `
    <div class="container">
      <div class="notfound">
        <p class="eyebrow" style="justify-content:center">404</p>
        <h1>${esc(t('common.notFound'))}</h1>
        <p>${esc(t('common.notFoundText'))}</p>
        <p style="font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--text-3)">${esc(path || '')}</p>
        <div class="hero-actions" style="justify-content:center;margin-top:var(--sp-4)">
          <a class="btn btn--primary" href="${href('/')}">${esc(t('common.home'))}</a>
          <a class="btn btn--outline" href="${href('/creazioni')}">${esc(t('cta.viewCatalog'))}</a>
        </div>
      </div>
    </div>`;
}

export { flagChip, joinIt };
