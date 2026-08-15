/* ============================================================
   INGLY DESIGN — NAVIGAZIONE
   Header, mega-menu (§25), menu mobile, tema, lingua.
   ============================================================ */

import { $, $$, esc, loc, icon } from './utils.js';
import { href } from './router.js';

let D = null;
let lang = 'it';
let t = () => '';

const NAV_ITEMS = [
  { key: 'nav.creazioni', path: '/creazioni', mega: true },
  { key: 'nav.materiali', path: '/materiali' },
  { key: 'nav.tecnologie', path: '/tecnologie' },
  { key: 'nav.portfolio', path: '/portfolio' },
  { key: 'nav.b2b', path: '/b2b' },
  { key: 'nav.chiSono', path: '/chi-sono' },
  { key: 'nav.contatti', path: '/contatti' }
];

export function initNav(data, l, translate) {
  D = data; lang = l; t = translate;
  renderHeader();
  renderFooter();
  bind();
}

/* ---- header ----------------------------------------------------------- */

function renderHeader() {
  const el = $('#header');
  if (!el) return;

  el.innerHTML = `
    <div class="container header-inner">
      <a class="brand" href="${href('/')}" aria-label="INGLY DESIGN — home">
        INGL<em>Y</em> DESIGN
      </a>

      <nav class="nav" aria-label="Navigazione principale">
        ${NAV_ITEMS.map((i) => `
          <a class="nav-link" href="${href(i.path)}" data-path="${i.path}"
             ${i.mega ? 'data-mega="creazioni" aria-haspopup="true" aria-expanded="false"' : ''}>
            ${esc(t(i.key))}
          </a>`).join('')}
      </nav>

      <div class="header-actions">
        <div class="lang-switch" role="group" aria-label="Lingua">
          <button type="button" data-lang="it" class="${lang === 'it' ? 'is-on' : ''}" aria-pressed="${lang === 'it'}">IT</button>
          <button type="button" data-lang="en" class="${lang === 'en' ? 'is-on' : ''}" aria-pressed="${lang === 'en'}">EN</button>
        </div>
        <button type="button" class="icon-btn" id="themeBtn" aria-label="${esc(t('common.lightMode'))}">${icon('sun')}</button>
        <button type="button" class="icon-btn burger" id="burger" aria-label="${esc(t('nav.menu'))}" aria-expanded="false" aria-controls="mobileMenu">${icon('menu')}</button>
      </div>
    </div>
    ${renderMega()}
  `;
  renderMobileMenu();
}

function renderMega() {
  const cats = (D.CATS || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const collections = (D.MIGRATION?.collections || []).filter((c) => c.featured);
  const featured = (D.PRODUCTS || []).find((p) => p.featured);

  const col = (title, links) => `
    <div>
      <p class="mega-group-title">${esc(title)}</p>
      ${links}
    </div>`;

  const third = Math.ceil(cats.length / 2);

  return `
  <div class="mega" id="mega-creazioni" role="region" aria-label="Catalogo creazioni">
    <div class="container mega-inner">
      <div class="mega-cols">
        ${col('Categorie', cats.slice(0, third).map((c) => `
          <a class="mega-link" href="${href(`/creazioni/${c.id}`)}">
            ${esc(loc(c.name, lang))}
            <span>${esc(loc(c.tagline, lang))}</span>
          </a>`).join(''))}
        ${col('&nbsp;', cats.slice(third).map((c) => `
          <a class="mega-link" href="${href(`/creazioni/${c.id}`)}">
            ${esc(loc(c.name, lang))}
            <span>${esc(loc(c.tagline, lang))}</span>
          </a>`).join(''))}
        ${col('Per destinazione', collections.map((c) => `
          <a class="mega-link" href="${href(`/creazioni?uso=${c.id}`)}">${esc(loc(c.name, lang))}</a>
        `).join(''))}
      </div>

      <div class="mega-feature">
        <p class="mega-group-title">In evidenza</p>
        ${featured ? `
          <a href="${href(`/creazioni/${featured.category}/${featured.slug}`)}">
            <img src="${esc(featured.images?.[0]?.src || `assets/images/products/${featured.id}.svg`)}" alt="" width="800" height="600" loading="lazy" decoding="async">
            <h3 style="font-size:var(--fs-lg);margin-bottom:var(--sp-1)">${esc(featured.name)}</h3>
            <p style="font-size:var(--fs-sm);color:var(--text-3)">${esc(featured.subtitle)}</p>
          </a>` : ''}
        <a class="btn btn--outline btn--block" style="margin-top:var(--sp-5)" href="${href('/creazioni')}">
          ${esc(t('cta.viewCatalog'))}
        </a>
      </div>
    </div>
  </div>`;
}

function renderMobileMenu() {
  const el = $('#mobileMenu');
  if (!el) return;
  const cats = (D.CATS || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  el.innerHTML = `
    <div class="container">
      <div class="m-item">
        <button type="button" class="m-link" aria-expanded="false" data-toggle="mcats">
          ${esc(t('nav.creazioni'))} ${icon('chevron', 18)}
        </button>
        <div class="m-sub" id="mcats">
          <a href="${href('/creazioni')}">${esc(t('cta.allCategories'))}</a>
          ${cats.map((c) => `<a href="${href(`/creazioni/${c.id}`)}">${esc(loc(c.name, lang))}</a>`).join('')}
        </div>
      </div>
      ${NAV_ITEMS.filter((i) => !i.mega).map((i) => `
        <div class="m-item">
          <a class="m-link" href="${href(i.path)}">${esc(t(i.key))}</a>
        </div>`).join('')}
    </div>`;
}

/* ---- footer ----------------------------------------------------------- */

function renderFooter() {
  const el = $('#footer');
  if (!el) return;
  const cfg = D.CONFIG || {};
  const cats = (D.CATS || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)).slice(0, 7);

  const socials = Object.entries(cfg.social || {}).filter(([, v]) => v);

  el.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <p class="brand" style="margin-bottom:var(--sp-3)">INGL<em>Y</em> DESIGN</p>
          <p style="font-size:var(--fs-sm);color:var(--text-3);max-width:34ch">
            ${esc(loc(cfg.brand?.claim, lang))}
          </p>
          ${cfg.contact?.email ? `
            <a href="mailto:${esc(cfg.contact.email)}" class="link-arrow" style="margin-top:var(--sp-5);position:relative">
              ${esc(cfg.contact.email)} ${icon('arrow', 15)}
            </a>` : ''}
        </div>

        <div>
          <p class="footer-title">Catalogo</p>
          <div class="footer-list">
            ${cats.map((c) => `<a href="${href(`/creazioni/${c.id}`)}">${esc(loc(c.name, lang))}</a>`).join('')}
            <a href="${href('/creazioni')}">${esc(t('cta.allCategories'))}</a>
          </div>
        </div>

        <div>
          <p class="footer-title">Studio</p>
          <div class="footer-list">
            <a href="${href('/chi-sono')}">${esc(t('nav.chiSono'))}</a>
            <a href="${href('/materiali')}">${esc(t('nav.materiali'))}</a>
            <a href="${href('/tecnologie')}">${esc(t('nav.tecnologie'))}</a>
            <a href="${href('/portfolio')}">${esc(t('nav.portfolio'))}</a>
          </div>
        </div>

        <div>
          <p class="footer-title">Servizi</p>
          <div class="footer-list">
            <a href="${href('/come-acquistare')}">${esc(t('nav.comeAcquistare'))}</a>
            <a href="${href('/b2b')}">${esc(t('nav.b2b'))}</a>
            <a href="${href('/contatti')}">${esc(t('nav.contatti'))}</a>
          </div>
          ${socials.length ? `
            <div style="display:flex;gap:var(--sp-3);margin-top:var(--sp-4)">
              ${socials.map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener" style="font-size:var(--fs-xs);color:var(--text-3)">${esc(k)}</a>`).join('')}
            </div>` : ''}
        </div>
      </div>

      <div class="footer-bottom">
        <span>${esc(cfg.copyright || '© INGLY DESIGN')}</span>
        <span>${esc(cfg.legal || '')}</span>
      </div>
    </div>`;
}

/* ---- interazioni ------------------------------------------------------ */

let megaTimer = null;

function bind() {
  const header = $('#header');
  const mega = $('#mega-creazioni');
  const trigger = header?.querySelector('[data-mega]');

  // Mega-menu con intento: 120 ms evita l'apertura al passaggio accidentale.
  if (mega && trigger) {
    const open = () => { clearTimeout(megaTimer); mega.classList.add('is-open'); trigger.setAttribute('aria-expanded', 'true'); };
    const close = () => { megaTimer = setTimeout(() => { mega.classList.remove('is-open'); trigger.setAttribute('aria-expanded', 'false'); }, 140); };

    trigger.addEventListener('mouseenter', () => { megaTimer = setTimeout(open, 120); });
    trigger.addEventListener('mouseleave', () => { clearTimeout(megaTimer); close(); });
    trigger.addEventListener('focus', open);
    mega.addEventListener('mouseenter', () => clearTimeout(megaTimer));
    mega.addEventListener('mouseleave', close);
    header.addEventListener('focusout', (e) => {
      if (!header.contains(e.relatedTarget)) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mega.classList.contains('is-open')) { clearTimeout(megaTimer); mega.classList.remove('is-open'); trigger.setAttribute('aria-expanded', 'false'); trigger.focus(); }
    });
  }

  // Menu mobile
  const burger = $('#burger');
  const menu = $('#mobileMenu');
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.innerHTML = icon(open ? 'close' : 'menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-toggle]');
      if (toggle) {
        const panel = $(`#${toggle.dataset.toggle}`);
        const open = panel.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        return;
      }
      if (e.target.closest('a')) closeMobile();
    });
  }

  // Tema
  $('#themeBtn')?.addEventListener('click', toggleTheme);

  // Header al primo scroll
  const onScroll = () => $('#header')?.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

export function closeMobile() {
  const menu = $('#mobileMenu');
  const burger = $('#burger');
  if (!menu?.classList.contains('is-open')) return;
  menu.classList.remove('is-open');
  burger?.setAttribute('aria-expanded', 'false');
  if (burger) burger.innerHTML = icon('menu');
  document.body.style.overflow = '';
}

function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.mode === 'light' ? 'dark' : 'light';
  root.dataset.mode = next;
  try { localStorage.setItem('ingly-mode', next); } catch { /* storage non disponibile */ }
  const btn = $('#themeBtn');
  if (btn) {
    btn.innerHTML = icon(next === 'light' ? 'moon' : 'sun');
    btn.setAttribute('aria-label', next === 'light' ? t('common.darkMode') : t('common.lightMode'));
  }
}

export function restoreTheme() {
  let saved = null;
  try { saved = localStorage.getItem('ingly-mode'); } catch { /* ignorato */ }
  const mode = saved || (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.dataset.mode = mode;
}

/** Evidenzia la voce di menu corrispondente alla rotta attiva. */
export function markActive(path) {
  $$('#header .nav-link').forEach((a) => {
    const p = a.dataset.path;
    const active = p === '/' ? path === '/' : path.startsWith(p);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}
