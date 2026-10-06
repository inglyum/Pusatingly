/* ============================================================
   INGLY DESIGN — BOOTSTRAP
   ------------------------------------------------------------
   Carica i dati, monta header e footer, avvia il router e
   collega ogni rotta al suo renderer.
   ============================================================ */

import { $, $$, esc, loc } from './utils.js';
import { loadData } from './data-loader.js';
import * as router from './router.js';
import { initNav, markActive, restoreTheme, closeMobile } from './nav.js';
import { initSections, renderHome } from './sections.js';
import {
  initCatalog, renderCatalogPage, findCategory, findProduct,
  publicProducts, productsIn
} from './catalog.js';
import { initProduct, renderProductPage, PRODUCT_FAQ } from './product.js';
import {
  initPages, renderMaterials, renderTechnologies, renderAbout,
  renderXtool, renderXtoolMachine, findXtoolMachine,
  renderPortfolio, renderHow, renderB2b, renderNotFound
} from './pages.js';
import { initForms, renderContact } from './forms.js';
import {
  setSeo, organizationLd, breadcrumbLd, productLd, faqLd, personLd, serviceLd
} from './seo.js';

let D = null;
let lang = 'it';

const t = (key) => D?.T?.[lang]?.[key] ?? D?.T?.it?.[key] ?? key;

/* ---- avvio ------------------------------------------------------------ */

restoreTheme();

try {
  const saved = localStorage.getItem('ingly-lang');
  if (saved === 'it' || saved === 'en') lang = saved;
} catch { /* storage non disponibile */ }

init();

async function init() {
  const main = $('#main');
  try {
    D = await loadData();
  } catch (err) {
    main.innerHTML = `
      <div class="container">
        <div class="notfound">
          <h1>${esc(t('common.error'))}</h1>
          <p>${esc(err.message)}</p>
          <button type="button" class="btn btn--outline" onclick="location.reload()">${esc(t('common.retry'))}</button>
        </div>
      </div>`;
    console.error('[INGLY]', err);
    return;
  }

  // Debug del catalogo: ?debug=1 mostra id e stato di migrazione sulle card.
  if (new URLSearchParams(location.search).get('debug') === '1') {
    document.documentElement.dataset.debug = '1';
  }

  initCatalog(D, lang, t);
  initProduct(D, lang, t);
  initSections(D, lang, t);
  initPages(D, lang, t);
  initForms(D, lang, t);
  initNav(D, lang, t);

  bindLang();
  bindAccordions();

  router.init({
    redirects: D.MIGRATION?.redirects || [],
    onNavigate: render
  });
}

/* ---- rotte ------------------------------------------------------------ */

function render({ route, params, path, query }) {
  const main = $('#main');
  const origin = D.CONFIG?.site?.url || location.origin;
  const canonical = origin + path;

  closeMobile();
  markActive(path);

  switch (route) {
    case 'home': {
      renderHome(main);
      const c = D.CONTENT?.home || {};
      setSeo({
        title: null,
        description: D.CONFIG?.site?.description,
        canonical: origin + '/',
        image: 'assets/images/categories/soluzioni-menu.svg',
        lang,
        jsonLd: organizationLd(D.CONFIG, origin)
      });
      break;
    }

    case 'catalog': {
      renderCatalogPage(main, { categoryId: null, query });
      const c = D.CONTENT?.creazioni || {};
      setSeo({
        title: c.seo?.title || loc(c.title, lang),
        description: c.seo?.description || loc(c.lead, lang),
        canonical,
        lang,
        jsonLd: breadcrumbLd([
          { label: t('common.home'), path: '/' },
          { label: loc(c.title, lang), path: '/creazioni' }
        ], origin)
      });
      break;
    }

    case 'category': {
      const cat = findCategory(params[0]);
      if (!cat) return notFound(main, path, canonical);
      renderCatalogPage(main, { categoryId: cat.id, query });
      setSeo({
        title: cat.seo?.title || loc(cat.name, lang),
        description: cat.seo?.description || loc(cat.intro, lang).slice(0, 160),
        canonical,
        image: `assets/images/categories/${cat.id}.svg`,
        lang,
        jsonLd: breadcrumbLd([
          { label: t('common.home'), path: '/' },
          { label: t('catalog.title'), path: '/creazioni' },
          { label: loc(cat.name, lang), path: `/creazioni/${cat.id}` }
        ], origin)
      });
      break;
    }

    case 'product': {
      const product = findProduct(params[1]);
      const cat = findCategory(params[0]);
      if (!product || !cat || product.category !== cat.id) return notFound(main, path, canonical);
      renderProductPage(main, product);
      setSeo({
        title: product.seo?.title || `${product.name} — ${product.subtitle}`,
        description: product.seo?.description || product.shortDescription,
        canonical,
        image: product.images?.[0]?.src,
        lang,
        jsonLd: productLd(product, cat, origin, lang)
      });
      break;
    }

    case 'materials':
      renderMaterials(main);
      setSeoFromContent('materiali', canonical);
      break;

    case 'technologies':
      renderTechnologies(main);
      setSeoFromContent('tecnologie', canonical);
      break;

    case 'about': {
      renderAbout(main);
      const c = D.CONTENT?.chiSono || {};
      setSeo({
        title: c.seo?.title || loc(c.title, lang),
        description: c.seo?.description || loc(c.lead, lang),
        canonical, lang,
        jsonLd: personLd(D.CONFIG, D.CONTENT, origin, lang)
      });
      break;
    }

    case 'portfolio':
      renderPortfolio(main);
      setSeoFromContent('portfolio', canonical);
      break;

    case 'how': {
      renderHow(main);
      const c = D.CONTENT?.comeAcquistare || {};
      setSeo({
        title: c.seo?.title || loc(c.title, lang),
        description: c.seo?.description || loc(c.lead, lang),
        canonical, lang,
        jsonLd: faqLd(c.faq, lang)
      });
      break;
    }

    case 'b2b':
      renderB2b(main);
      setSeoFromContent('b2b', canonical);
      break;

    /* xTool — centro assistenza ufficiale.
       I dati strutturati dichiarano un Service, non un prodotto: quello che
       vendiamo qui è la riparazione, e «assistenza xTool» è la ricerca che
       porta qui. Le domande vanno in FAQPage perché sono quelle che un
       assistente AI cita quando qualcuno chiede se conviene riparare. */
    case 'xtool': {
      renderXtool(main);
      const X = D.XTOOL || {};
      const c = X.centro || {};
      setSeo({
        title: loc(c.titolo, lang),
        description: loc(c.sommario, lang),
        canonical, lang,
        jsonLd: [
          serviceLd({
            name: loc(c.titolo, lang),
            description: loc(c.sommario, lang),
            type: 'Servizio di assistenza e riparazione',
            url: canonical
          }),
          faqLd((X.faq || []).map((q) => ({ q: q.q, a: q.a })), lang)
        ].filter(Boolean)
      });
      break;
    }

    case 'xtoolMachine': {
      const m = findXtoolMachine(params[0]);
      if (!m) { renderNotFound(main, path); setSeo({ title: '404', description: '', canonical, lang }); break; }
      renderXtoolMachine(main, m);
      setSeo({
        title: m.n + ' — ' + (lang === 'en' ? 'service and repair' : 'assistenza e riparazione'),
        description: loc(m.tipo, lang) + '. ' + loc(m.perChi, lang),
        canonical, lang,
        jsonLd: serviceLd({
          name: (lang === 'en' ? 'Service and repair ' : 'Assistenza e riparazione ') + m.n,
          description: loc(m.perChi, lang),
          type: lang === 'en' ? 'Laser machine repair' : 'Riparazione macchine laser',
          url: canonical
        })
      });
      break;
    }

    case 'contact':
      renderContact(main, query);
      setSeoFromContent('contatti', canonical);
      break;

    default:
      notFound(main, path, canonical);
  }

  // Ancora interna (#materiale, #tecnologia): il contenuto è appena montato.
  const hashAnchor = location.hash.match(/#(?!\/)([\w-]+)$/);
  if (hashAnchor) {
    requestAnimationFrame(() => {
      document.getElementById(hashAnchor[1])?.scrollIntoView({ block: 'start' });
    });
  }
}

function setSeoFromContent(key, canonical) {
  const c = D.CONTENT?.[key] || {};
  const origin = D.CONFIG?.site?.url || location.origin;
  setSeo({
    title: c.seo?.title || loc(c.title, lang),
    description: c.seo?.description || loc(c.lead, lang),
    canonical,
    lang,
    jsonLd: breadcrumbLd([
      { label: t('common.home'), path: '/' },
      { label: loc(c.title, lang), path: canonical.replace(origin, '') }
    ], origin)
  });
}

function notFound(main, path, canonical) {
  renderNotFound(main, path);
  setSeo({
    title: t('common.notFound'),
    description: t('common.notFoundText'),
    canonical,
    lang
  });
  // La rotta inesistente non deve finire nell'indice.
  let robots = document.head.querySelector('meta[name="robots"]');
  if (!robots) {
    robots = document.createElement('meta');
    robots.name = 'robots';
    document.head.appendChild(robots);
  }
  robots.content = 'noindex';
}

/* ---- interazioni globali ---------------------------------------------- */

function bindLang() {
  $$('#header [data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.lang;
      if (next === lang) return;
      lang = next;
      try { localStorage.setItem('ingly-lang', next); } catch { /* ignorato */ }
      location.reload();
    });
  });
}

/** Accordion in delega: funziona anche sui pannelli montati dopo. */
function bindAccordions() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.accordion-trigger');
    if (!trigger) return;
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) return;
    const open = panel.classList.toggle('is-open');
    trigger.setAttribute('aria-expanded', String(open));
  });
}
