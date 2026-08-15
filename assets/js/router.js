/* ============================================================
   INGLY DESIGN — ROUTER
   ------------------------------------------------------------
   URL puliti e gerarchici (master command §28).

   Due modalità, rilevate automaticamente:
   - history : server con rewrite (Netlify/Vercel/nginx) → /creazioni/...
   - hash    : GitHub Pages o file:// → #/creazioni/...

   In entrambe, l'URL canonico dichiarato alla SEO è sempre /creazioni/...
   I redirect da data/migration.json sono applicati prima del match.
   ============================================================ */

const ROUTES = [
  { id: 'home', pattern: /^\/?$/ },
  { id: 'catalog', pattern: /^\/creazioni\/?$/ },
  { id: 'category', pattern: /^\/creazioni\/([a-z0-9-]+)\/?$/ },
  { id: 'product', pattern: /^\/creazioni\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/ },
  { id: 'materials', pattern: /^\/materiali\/?$/ },
  { id: 'technologies', pattern: /^\/tecnologie\/?$/ },
  { id: 'portfolio', pattern: /^\/portfolio\/?$/ },
  { id: 'about', pattern: /^\/chi-sono\/?$/ },
  { id: 'how', pattern: /^\/come-acquistare\/?$/ },
  { id: 'b2b', pattern: /^\/b2b\/?$/ },
  { id: 'contact', pattern: /^\/contatti\/?$/ }
];

let mode = 'hash';
let basePath = '/';
let redirects = [];
let onNavigate = () => {};

/** history se il documento è servito da una radice che sa fare rewrite. */
function detectMode() {
  if (location.protocol === 'file:') return 'hash';
  // Se la pagina è stata aperta con un percorso non-file e senza hash-route,
  // si prova history; il fallback via 404.html riporta comunque qui.
  return document.documentElement.dataset.routing === 'history' ? 'history' : 'hash';
}

export function init({ redirects: r = [], onNavigate: cb } = {}) {
  redirects = r;
  onNavigate = cb || onNavigate;
  mode = detectMode();

  const path = location.pathname.replace(/\/index\.html$/, '/');
  basePath = mode === 'history' ? '/' : path;

  window.addEventListener('popstate', handle);
  window.addEventListener('hashchange', handle);

  // Delega globale: ogni link interno passa dal router.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || a.target === '_blank' || a.hasAttribute('download')) return;
    if (/^(https?:|mailto:|tel:|#(?!\/))/.test(href)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(href);
  });

  handle();
}

/** Percorso applicativo corrente, sempre nella forma /creazioni/... */
export function currentPath() {
  if (mode === 'hash') {
    const h = location.hash.replace(/^#/, '');
    return h || '/';
  }
  let p = location.pathname;
  if (basePath !== '/' && p.startsWith(basePath)) p = `/${p.slice(basePath.length)}`;
  return p || '/';
}

export function currentQuery() {
  if (mode === 'hash') {
    const q = location.hash.indexOf('?');
    return new URLSearchParams(q >= 0 ? location.hash.slice(q + 1) : '');
  }
  return new URLSearchParams(location.search);
}

/** URL canonico assoluto: identico nelle due modalità, per SEO e condivisione. */
export function canonical(path = currentPath(), origin = location.origin) {
  return origin + (path.startsWith('/') ? path : `/${path}`);
}

function toHref(path) {
  return mode === 'hash' ? `#${path}` : (basePath === '/' ? path : basePath.replace(/\/$/, '') + path);
}

export function go(path, { replace = false } = {}) {
  // Un href assoluto interno viene normalizzato a percorso applicativo.
  let target = path;
  if (/^https?:/.test(target)) {
    try { target = new URL(target).pathname; } catch { /* lasciato com'è */ }
  }
  if (target.startsWith('#')) target = target.slice(1);
  if (!target.startsWith('/')) target = `/${target}`;

  const href = toHref(target);
  if (replace) history.replaceState(null, '', href);
  else history.pushState(null, '', href);

  // pushState non emette popstate: si notifica a mano.
  handle();
  if (!replace) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

/** Aggiorna solo la query string, senza rimontare la pagina (usato dai filtri). */
export function setQuery(params) {
  const path = currentPath().split('?')[0];
  const qs = params.toString();
  const full = qs ? `${path}?${qs}` : path;
  history.replaceState(null, '', toHref(full));
}

function applyRedirect(path) {
  const clean = path.replace(/\/$/, '') || '/';
  const hit = redirects.find((r) => r.from.replace(/\/$/, '') === clean);
  return hit ? hit.to : null;
}

function handle() {
  let path = currentPath().split('?')[0];

  const redirected = applyRedirect(path);
  if (redirected) {
    go(redirected, { replace: true });
    return;
  }

  for (const route of ROUTES) {
    const m = path.match(route.pattern);
    if (m) {
      onNavigate({ route: route.id, params: m.slice(1), path, query: currentQuery() });
      return;
    }
  }
  onNavigate({ route: '404', params: [], path, query: currentQuery() });
}

/** href pronto per il markup, corretto nella modalità attiva. */
export const href = toHref;
