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
