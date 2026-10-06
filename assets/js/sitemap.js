/* ============================================================
   INGLY DESIGN — SITEMAP (funzioni pure)
   ------------------------------------------------------------
   Lo stesso elenco di URL serve a due posti che non si parlano:
   lo script `npm run sitemap` e l'Admin, che la rigenera nel
   browser al momento di pubblicare. Finché la logica stava solo
   nello script, pubblicare dall'Admin produceva una sitemap
   diversa da quella del repository. Qui è scritta una volta.
   Nessun accesso al disco, nessun DOM: si può testare.
   ============================================================ */

const PAGINE_FISSE = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/creazioni', priority: '0.9', changefreq: 'weekly' },
  { loc: '/materiali', priority: '0.7', changefreq: 'monthly' },
  { loc: '/tecnologie', priority: '0.7', changefreq: 'monthly' },
  { loc: '/portfolio', priority: '0.6', changefreq: 'monthly' },
  { loc: '/chi-sono', priority: '0.7', changefreq: 'monthly' },
  { loc: '/come-acquistare', priority: '0.7', changefreq: 'monthly' },
  { loc: '/b2b', priority: '0.8', changefreq: 'monthly' },
  { loc: '/contatti', priority: '0.8', changefreq: 'monthly' },
  { loc: '/xtool', priority: '0.9', changefreq: 'monthly' }
];

/** Una creazione archiviata non è in catalogo: non va dichiarata. */
export const pubblicati = (products = []) =>
  products.filter((p) => p.migrationStatus !== 'archived');

export function sitemapUrls({ products = [], categories = [], xtool = {}, info = {} } = {}) {
  const urls = [...PAGINE_FISSE];

  for (const c of categories) {
    urls.push({ loc: `/creazioni/${c.id}`, priority: '0.8', changefreq: 'weekly' });
  }
  for (const p of pubblicati(products)) {
    urls.push({ loc: `/creazioni/${p.category}/${p.slug}`, priority: '0.6', changefreq: 'monthly' });
  }
  for (const m of xtool.gamma || []) {
    urls.push({ loc: `/xtool/${m.id}`, priority: '0.7', changefreq: 'monthly' });
  }
  for (const p of info.pagine || []) {
    urls.push({ loc: `/informazioni/${p.id}`, priority: '0.4', changefreq: 'yearly' });
  }
  return urls;
}

export function sitemapXml(data = {}, today = new Date().toISOString().slice(0, 10)) {
  const origin = String(data.config?.site?.url || 'https://inglydesign.it').replace(/\/$/, '');
  const urls = sitemapUrls(data);
  const ns = 'http://www.sitemaps.org/schemas/sitemap/0.9';

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="${ns}">
${urls.map((u) => `  <url>
    <loc>${origin}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
}
