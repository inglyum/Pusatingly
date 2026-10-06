/* ============================================================
   INGLY DESIGN — NAVIGAZIONE
   Header, mega-menu (§25), menu mobile, tema, lingua.
   ============================================================ */

import { $, $$, esc, loc, icon, toast } from './utils.js';
import { href, go } from './router.js';

let D = null;
let lang = 'it';
let t = () => '';

const NAV_ITEMS = [
  { key: 'nav.creazioni', path: '/creazioni', mega: true },
  { key: 'nav.materiali', path: '/materiali' },
  { key: 'nav.tecnologie', path: '/tecnologie' },
  { key: 'nav.portfolio', path: '/portfolio' },
  { key: 'nav.b2b', path: '/b2b' },
  { key: 'nav.xtool', path: '/xtool' },
  { key: 'nav.chiSono', path: '/chi-sono' },
  { key: 'nav.contatti', path: '/contatti' }
];

export function initNav(data, l, translate) {
  D = data; lang = l; t = translate;
  renderAnnounce();
  renderHeader();
  renderPreFooter();
  renderFooter();
  bind();
}

/* ---- fascia annunci ---------------------------------------------------- */

/**
 * La barra in testa alla pagina. I messaggi stanno in config.json:
 * nessuno configurato o `attiva: false` e la barra resta nascosta,
 * invece di occupare spazio con una promessa vuota.
 */
function renderAnnounce() {
  const el = $('#announce');
  if (!el) return;
  const a = D.CONFIG?.announce || {};
  const messaggi = (a.messaggi || []).filter((m) => loc(m.testo, lang));
  if (a.attiva === false || !messaggi.length) { el.hidden = true; return; }

  el.innerHTML = `
    <div class="container announce-inner">
      <p class="announce-msg" aria-live="polite" aria-atomic="true">
        ${messaggi.map((m, i) => {
          const testo = esc(loc(m.testo, lang));
          const corpo = m.url
            ? `<a href="${esc(m.url)}" target="_blank" rel="noopener">${testo}</a>`
            : m.path ? `<a href="${href(m.path)}">${testo}</a>` : testo;
          return `<span class="announce-slide${i === 0 ? ' is-on' : ''}">${corpo}</span>`;
        }).join('')}
      </p>
    </div>`;
  el.hidden = false;

  if (messaggi.length < 2) return;
  // Rotazione lenta e senza animazione: chi legge non viene inseguito.
  const slides = $$('.announce-slide', el);
  let i = 0;
  setInterval(() => {
    slides[i].classList.remove('is-on');
    i = (i + 1) % slides.length;
    slides[i].classList.add('is-on');
  }, 6000);
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
        <form class="header-search" id="headerSearch" role="search" novalidate>
          <label class="sr-only" for="hdrSearch">${esc(t('catalog.searchLabel'))}</label>
          ${icon('search', 18)}
          <input type="search" id="hdrSearch" placeholder="${esc(t('catalog.search'))}" autocomplete="off">
        </form>
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

/* ---- fascia informativa e newsletter ---------------------------------- */

function renderPreFooter() {
  const el = $('#preFooter');
  if (!el) return;
  const band = D.CONTENT?.infoband;
  const news = D.CONTENT?.newsletter;

  const bandMarkup = !band?.voci?.length ? '' : `
    <section class="infoband">
      <div class="container infoband-grid">
        ${band.voci.map((v) => {
          const inner = `
            <span class="infoband-ic">${icon(v.icona || 'arrow', 20)}</span>
            <span class="infoband-text">
              <strong>${esc(loc(v.titolo, lang))}</strong>
              <span>${esc(loc(v.testo, lang))}</span>
            </span>`;
          if (v.url) return `<a class="infoband-item" href="${esc(v.url)}" target="_blank" rel="noopener">${inner}</a>`;
          if (v.path) return `<a class="infoband-item" href="${href(v.path)}">${inner}</a>`;
          return `<div class="infoband-item">${inner}</div>`;
        }).join('')}
      </div>
    </section>`;

  const newsMarkup = !news ? '' : `
    <section class="newsletter">
      <div class="container newsletter-inner">
        <div class="newsletter-copy">
          <p class="eyebrow">${esc(loc(news.eyebrow, lang))}</p>
          <h2 class="section-title">${esc(loc(news.title, lang))}</h2>
          <p class="section-lead">${esc(loc(news.lead, lang))}</p>
        </div>
        <form class="newsletter-form" id="newsletterForm" novalidate>
          <label class="sr-only" for="nlEmail">${esc(t('newsletter.email'))}</label>
          <input type="email" id="nlEmail" name="email" required autocomplete="email"
                 placeholder="${esc(t('newsletter.email'))}">
          <button type="submit" class="btn btn--primary">${esc(loc(news.cta, lang))}</button>
          <p class="newsletter-note">${esc(loc(news.nota, lang))}</p>
        </form>
      </div>
    </section>`;

  el.innerHTML = bandMarkup + newsMarkup;
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
          <p class="footer-title">${esc(t('footer.informazioni'))}</p>
          <div class="footer-list">
            ${(D.INFO?.pagine || []).map((p) =>
              `<a href="${href('/informazioni/' + p.id)}">${esc(loc(p.n, lang))}</a>`).join('')}
          </div>
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
            <a href="${href('/xtool')}">${esc(t('nav.xtool'))}</a>
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
      /* Il pannello parte da dove finisce l'header, misurato adesso: con la
         fascia annunci sopra, un valore fisso nel CSS lo faceva partire troppo
         in alto e copriva il logo e il pulsante stesso per chiuderlo. */
      const sotto = header?.getBoundingClientRect().bottom;
      if (sotto != null) menu.style.insetBlockStart = `${Math.max(0, Math.round(sotto))}px`;

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

  // Ricerca dall'header: porta al catalogo con il filtro già applicato.
  $('#headerSearch')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = ($('#hdrSearch')?.value || '').trim();
    go('/creazioni' + (v ? `?q=${encodeURIComponent(v)}` : ''));
  });

  // Newsletter: senza servizio di invio collegato apriamo un'email già
  // scritta, invece di simulare un'iscrizione che non avviene (come in forms.js).
  $('#newsletterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#nlEmail');
    const email = (input?.value || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      input?.focus();
      toast(t('common.error'));
      return;
    }
    const dest = D.CONFIG?.contact?.email;
    if (!dest) return;
    const body = `${t('newsletter.subject')}: ${email}`;
    window.location.href =
      `mailto:${dest}?subject=${encodeURIComponent(t('newsletter.subject'))}&body=${encodeURIComponent(body)}`;
  });

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
