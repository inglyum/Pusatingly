/* ============================================================
   INGLY DESIGN — HOMEPAGE
   ------------------------------------------------------------
   Schema imposto dal master command §21:
   HERO → Manifesto → Categorie → In evidenza → Tecnologie →
   Materiali → Portfolio → B2B → Chi è Giuseppe → Processo → CTA
   ============================================================ */

import { esc, loc, icon } from './utils.js';
import { href } from './router.js';
import { observeReveals } from './images.js';
import { productCard, categoryCard, publicProducts } from './catalog.js';

let D = null, lang = 'it', t = () => '';

export function initSections(data, l, translate) { D = data; lang = l; t = translate; }

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

export function renderHome(root) {
  const c = D.CONTENT?.home || {};
  const cats = (D.CATS || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const featured = publicProducts().filter((p) => p.featured).slice(0, 8);
  const techs = (D.TECHNOLOGIES || []).filter((x) => x.featured);
  const mats = (D.MATERIALS || []).filter((m) => m.featured);
  const archetypes = (D.PORTFOLIO?.archetypes || []).slice(0, 3);
  const segments = (D.CONTENT?.b2b?.segments || []).slice(0, 4);
  const steps = (D.CONTENT?.comeAcquistare?.steps || []).slice(0, 4);

  root.innerHTML = `
  <!-- HERO -->
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
  </section>

  <!-- MANIFESTO -->
  <section class="section section--alt">
    <div class="container">
      <div class="manifesto-grid">
        <div class="manifesto-body reveal">
          <p class="eyebrow">${esc(loc(c.manifesto?.eyebrow, lang))}</p>
          <h2 class="section-title">${esc(loc(c.manifesto?.title, lang))}</h2>
          ${loc(c.manifesto?.body, lang).split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('')}
        </div>
        <div class="manifesto-points">
          ${(c.manifesto?.points || []).map((p, i) => `
            <div class="manifesto-point reveal stagger-${i + 1}">
              <h3>${esc(loc(p.title, lang))}</h3>
              <p>${esc(loc(p.text, lang))}</p>
            </div>`).join('')}
        </div>
      </div>
    </div>
  </section>

  <!-- CATEGORIE -->
  <section class="section">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">${esc(loc(c.categories?.eyebrow, lang))}</p>
        <h2 class="section-title">${esc(loc(c.categories?.title, lang))}</h2>
        <p class="section-lead">${esc(loc(c.categories?.lead, lang))}</p>
      </div>
      <div class="grid grid--4">
        ${cats.map((cat, i) => categoryCard(cat, { large: i === 0, index: i })).join('')}
      </div>
    </div>
  </section>

  <!-- IN EVIDENZA -->
  ${featured.length ? `
  <section class="section section--alt">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">${esc(loc(c.featured?.eyebrow, lang))}</p>
        <h2 class="section-title">${esc(loc(c.featured?.title, lang))}</h2>
        <p class="section-lead">${esc(loc(c.featured?.lead, lang))}</p>
      </div>
      <div class="product-grid">
        ${featured.map((p, i) => productCard(p, { index: i })).join('')}
      </div>
      <div style="margin-top:var(--sp-7)">
        <a class="btn btn--outline" href="${href('/creazioni')}">${esc(t('cta.viewCatalog'))} ${icon('arrow', 16)}</a>
      </div>
    </div>
  </section>` : ''}

  <!-- TECNOLOGIE -->
  <section class="section">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">${esc(loc(c.technologies?.eyebrow, lang))}</p>
        <h2 class="section-title">${esc(loc(c.technologies?.title, lang))}</h2>
        <p class="section-lead">${esc(loc(c.technologies?.lead, lang))}</p>
      </div>
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
      <div style="margin-top:var(--sp-7)">
        <a class="btn btn--outline" href="${href('/tecnologie')}">${esc(t('common.seeAll'))} ${icon('arrow', 16)}</a>
      </div>
    </div>
  </section>

  <!-- MATERIALI -->
  <section class="section section--alt">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">${esc(loc(c.materials?.eyebrow, lang))}</p>
        <h2 class="section-title">${esc(loc(c.materials?.title, lang))}</h2>
        <p class="section-lead">${esc(loc(c.materials?.lead, lang))}</p>
      </div>
      <div class="grid grid--3">
        ${mats.map((m, i) => `
          <a class="info-card reveal stagger-${(i % 6) + 1}" href="${href(`/materiali#${m.id}`)}">
            <h3>${esc(loc(m.name, lang))}</h3>
            <p class="info-short">${esc(loc(m.short, lang))}</p>
            <p>${esc(loc(m.description, lang).split('. ')[0])}.</p>
          </a>`).join('')}
      </div>
      <div style="margin-top:var(--sp-7)">
        <a class="btn btn--outline" href="${href('/materiali')}">${esc(t('common.seeAll'))} ${icon('arrow', 16)}</a>
      </div>
    </div>
  </section>

  <!-- PORTFOLIO -->
  <section class="section">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">${esc(loc(D.CONTENT?.portfolio?.eyebrow, lang))}</p>
        <h2 class="section-title">${esc(loc(D.CONTENT?.portfolio?.archetypesTitle, lang))}</h2>
        <p class="section-lead">${esc(loc(D.CONTENT?.portfolio?.archetypesLead, lang))}</p>
      </div>
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
      <div style="margin-top:var(--sp-7)">
        <a class="btn btn--outline" href="${href('/portfolio')}">${esc(t('nav.portfolio'))} ${icon('arrow', 16)}</a>
      </div>
    </div>
  </section>

  <!-- B2B -->
  <section class="section section--alt">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">${esc(loc(c.b2b?.eyebrow, lang))}</p>
        <h2 class="section-title">${esc(loc(c.b2b?.title, lang))}</h2>
        <p class="section-lead">${esc(loc(c.b2b?.lead, lang))}</p>
      </div>
      <div class="segment-grid">
        ${segments.map((s, i) => `
          <div class="segment reveal stagger-${i + 1}">
            <h3>${esc(loc(s.title, lang))}</h3>
            <p>${esc(loc(s.text, lang))}</p>
          </div>`).join('')}
      </div>
      <div style="margin-top:var(--sp-7)">
        <a class="btn btn--outline" href="${href('/b2b')}">${esc(t('nav.b2b'))} ${icon('arrow', 16)}</a>
      </div>
    </div>
  </section>

  <!-- CHI È GIUSEPPE -->
  <section class="section">
    <div class="container container--narrow" style="text-align:center">
      <p class="eyebrow" style="justify-content:center">${esc(loc(c.about?.eyebrow, lang))}</p>
      <h2 class="section-title">${esc(loc(c.about?.title, lang))}</h2>
      <p class="section-lead">${esc(loc(c.about?.lead, lang))}</p>
      <div style="margin-top:var(--sp-6)">
        <a class="btn btn--outline" href="${href('/chi-sono')}">${esc(t('nav.chiSono'))} ${icon('arrow', 16)}</a>
      </div>
    </div>
  </section>

  <!-- PROCESSO -->
  <section class="section section--alt">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">${esc(loc(c.process?.eyebrow, lang))}</p>
        <h2 class="section-title">${esc(loc(c.process?.title, lang))}</h2>
        <p class="section-lead">${esc(loc(c.process?.lead, lang))}</p>
      </div>
      <div class="grid grid--4">
        ${steps.map((s, i) => `
          <div class="step reveal stagger-${i + 1}" style="grid-template-columns:1fr">
            <span class="step-n">${s.n}</span>
            <div>
              <h3>${esc(loc(s.title, lang))}</h3>
              <p>${esc(loc(s.text, lang))}</p>
            </div>
          </div>`).join('')}
      </div>
      <div style="margin-top:var(--sp-7)">
        <a class="btn btn--outline" href="${href('/come-acquistare')}">${esc(t('nav.comeAcquistare'))} ${icon('arrow', 16)}</a>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="section">
    <div class="container">
      <div class="cta-band reveal">
        <h2>${esc(loc(c.cta?.title, lang))}</h2>
        <p>${esc(loc(c.cta?.lead, lang))}</p>
        <div class="hero-actions">
          <a class="btn btn--primary btn--lg" href="${href('/contatti')}">
            ${esc(loc(c.cta?.cta, lang))} ${icon('arrow', 16)}
          </a>
        </div>
      </div>
    </div>
  </section>`;

  observeReveals(root);
}
