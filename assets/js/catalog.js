/* ============================================================
   INGLY DESIGN — CATALOGO
   ------------------------------------------------------------
   Card prodotto (§23), filtri e ricerca (§22).
   I filtri sono riflessi nell'URL: una selezione è condivisibile
   e indicizzabile.
   ============================================================ */

import { $, $$, esc, loc, norm, icon, debounce } from './utils.js';
import { href, setQuery, go } from './router.js';
import { productImg, categoryImg, observeReveals } from './images.js';

let D = null, lang = 'it', t = () => '';

export function initCatalog(data, l, translate) { D = data; lang = l; t = translate; }

/* ---- visibilità ------------------------------------------------------- */

/** Regola unica di pubblicazione: gli archiviati non escono da qui. */
export function isPublic(p) {
  return p.migrationStatus !== 'archived' && !p.__orphan;
}

export const publicProducts = () => (D.PRODUCTS || []).filter(isPublic);

export const findProduct = (slug) =>
  publicProducts().find((p) => p.slug === slug || p.id === slug);

export const findCategory = (id) => (D.CATS || []).find((c) => c.id === id);

export const productsIn = (categoryId) =>
  publicProducts().filter((p) => p.category === categoryId);

const nameOf = (list, id) => {
  const x = (list || []).find((i) => i.id === id);
  return x ? loc(x.name, lang) : id;
};

export const materialName = (id) => nameOf(D.MATERIALS, id);
export const technologyName = (id) => nameOf(D.TECHNOLOGIES, id);
export const collectionName = (id) => nameOf(D.MIGRATION?.collections, id);

export function subcategoryName(categoryId, subId) {
  const cat = findCategory(categoryId);
  const sub = cat?.subcategories?.find((s) => s.id === subId);
  return sub ? loc(sub.name, lang) : subId;
}

/* ---- card ------------------------------------------------------------- */

export function productCard(p, { eager = false, index = 0 } = {}) {
  const cat = findCategory(p.category);
  const stagger = `stagger-${(index % 6) + 1}`;
  const material = p.materials?.[0] ? materialName(p.materials[0]) : '';
  const tech = p.technologies?.[0] ? technologyName(p.technologies[0]) : '';

  return `
  <article class="card reveal ${stagger}">
    <div class="card-media">
      <span class="mig-badge">${esc(p.id)} · ${esc(p.migrationStatus)}</span>
      ${productImg(p, { eager })}
    </div>
    <div class="card-body">
      <p class="card-eyebrow">${esc(loc(cat?.name, lang))}</p>
      <h3 class="card-title">${esc(p.name)}</h3>
      <p class="card-subtitle">${esc(p.subtitle)}</p>
      <p class="card-desc">${esc(p.shortDescription)}</p>
      ${(material || tech) ? `
        <div class="card-specs">
          ${material ? `<span>${esc(material)}</span>` : ''}
          ${tech ? `<span>${esc(tech)}</span>` : ''}
        </div>` : ''}
      <div class="card-foot">
        ${p.customizable ? `<span class="chip chip--accent">${esc(t('product.customizable'))}</span>` : '<span></span>'}
        <a class="link-arrow" href="${href(`/creazioni/${p.category}/${p.slug}`)}">
          ${esc(t('cta.discover'))} ${icon('arrow', 15)}
        </a>
      </div>
    </div>
  </article>`;
}

export function categoryCard(c, { large = false, index = 0 } = {}) {
  const count = productsIn(c.id).length;
  return `
  <a class="cat-card ${large ? 'cat-card--lg' : ''} reveal stagger-${(index % 6) + 1}" href="${href(`/creazioni/${c.id}`)}">
    ${categoryImg(c)}
    <h3>${esc(loc(c.name, lang))}</h3>
    <p>${esc(loc(c.tagline, lang))}</p>
    <span class="count">${count} ${count === 1 ? t('catalog.result') : t('catalog.results')}</span>
  </a>`;
}

/* ---- filtri ----------------------------------------------------------- */

const FILTER_KEYS = ['cat', 'sub', 'mat', 'tec', 'uso', 'pub', 'pers', 'q', 'ordina'];

export function readFilters(query) {
  const f = {};
  for (const k of FILTER_KEYS) {
    const v = query.get(k);
    if (v) f[k] = v;
  }
  return f;
}

export function applyFilters(products, f) {
  let out = products;

  if (f.cat) out = out.filter((p) => p.category === f.cat);
  if (f.sub) out = out.filter((p) => p.subcategory === f.sub);
  if (f.mat) out = out.filter((p) => p.materials?.includes(f.mat));
  if (f.tec) out = out.filter((p) => p.technologies?.includes(f.tec));
  if (f.uso) out = out.filter((p) => p.uses?.includes(f.uso));
  if (f.pers === '1') out = out.filter((p) => p.customizable);
  if (f.pub) out = out.filter((p) => p.audience === f.pub || p.audience === 'both');

  if (f.q) {
    const q = norm(f.q);
    out = out.filter((p) => {
      const haystack = norm([
        p.name, p.subtitle, p.shortDescription,
        ...(p.tags || []),
        ...(p.materials || []).map(materialName),
        ...(p.technologies || []).map(technologyName)
      ].join(' '));
      return haystack.includes(q);
    });
  }

  const sort = f.ordina;
  if (sort === 'nome') out = [...out].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  else if (sort === 'categoria') out = [...out].sort((a, b) => a.category.localeCompare(b.category) || a.order - b.order);
  else if (sort === 'evidenza') out = [...out].sort((a, b) => (b.featured === true) - (a.featured === true));

  return out;
}

/* ---- rendering catalogo ----------------------------------------------- */

export function renderCatalogPage(root, { categoryId = null, query }) {
  const f = readFilters(query);
  if (categoryId) f.cat = categoryId;

  const cat = categoryId ? findCategory(categoryId) : null;
  const content = D.CONTENT?.creazioni || {};

  const title = cat ? loc(cat.name, lang) : loc(content.title, lang);
  const lead = cat ? loc(cat.intro, lang) : loc(content.lead, lang);

  state.root = root;
  root.innerHTML = `
    <div class="container">
      ${breadcrumb(cat)}
      <header class="page-head">
        <p class="eyebrow">${esc(cat ? loc(content.eyebrow, lang) : loc(content.eyebrow, lang))}</p>
        <h1>${esc(title)}</h1>
        <p>${esc(lead)}</p>
      </header>

      ${filtersMarkup(f, cat)}

      <div class="catalog-bar">
        <p class="result-count" id="resultCount" role="status" aria-live="polite"></p>
        <label class="sr-only" for="sortSel">${esc(t('catalog.sort'))}</label>
        <select id="sortSel">
          <option value="">${esc(t('catalog.sortDefault'))}</option>
          <option value="nome" ${f.ordina === 'nome' ? 'selected' : ''}>${esc(t('catalog.sortName'))}</option>
          <option value="categoria" ${f.ordina === 'categoria' ? 'selected' : ''}>${esc(t('catalog.sortCategory'))}</option>
          <option value="evidenza" ${f.ordina === 'evidenza' ? 'selected' : ''}>${esc(t('catalog.sortFeatured'))}</option>
        </select>
      </div>

      <div id="productGrid" class="product-grid"></div>
    </div>`;

  bindFilters(root, { categoryId });
  paint(f);
}

function breadcrumb(cat) {
  const items = [
    { label: t('common.home'), path: '/' },
    { label: t('catalog.title'), path: '/creazioni' }
  ];
  if (cat) items.push({ label: loc(cat.name, lang), path: `/creazioni/${cat.id}` });

  return `<nav aria-label="${esc(t('common.breadcrumb'))}">
    <ol class="breadcrumb">
      ${items.map((i, n) => n === items.length - 1
        ? `<li aria-current="page">${esc(i.label)}</li>`
        : `<li><a href="${href(i.path)}">${esc(i.label)}</a></li>`).join('')}
    </ol>
  </nav>`;
}

function chipRow(label, key, options, active) {
  if (!options.length) return '';
  return `
  <div class="filter-row">
    <p class="filter-label" id="fl-${key}">${esc(label)}</p>
    <div class="filter-chips" role="group" aria-labelledby="fl-${key}">
      <button type="button" class="filter-chip filter-chip--all" data-filter="${key}" data-value=""
        aria-pressed="${!active}">${esc(t('catalog.all'))}</button>
      ${options.map((o) => `
        <button type="button" class="filter-chip" data-filter="${key}" data-value="${esc(o.id)}"
          aria-pressed="${active === o.id}">${esc(o.label)}</button>`).join('')}
    </div>
  </div>`;
}

function filtersMarkup(f, cat) {
  const cats = (D.CATS || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const subs = cat?.subcategories || [];

  // Materiali e tecnologie mostrati sono solo quelli realmente presenti
  // nell'insieme corrente: un filtro che non produce risultati è rumore.
  const pool = cat ? productsIn(cat.id) : publicProducts();
  const usedMats = new Set(pool.flatMap((p) => p.materials || []));
  const usedTechs = new Set(pool.flatMap((p) => p.technologies || []));
  const usedUses = new Set(pool.flatMap((p) => p.uses || []));

  return `
  <div class="filters">
    <div class="search-box">
      <label class="sr-only" for="catSearch">${esc(t('catalog.searchLabel'))}</label>
      ${icon('search')}
      <input type="search" id="catSearch" placeholder="${esc(t('catalog.search'))}" value="${esc(f.q || '')}">
    </div>

    ${!cat ? chipRow(t('catalog.category'), 'cat', cats.map((c) => ({ id: c.id, label: loc(c.name, lang) })), f.cat) : ''}
    ${subs.length ? chipRow(t('catalog.subcategory'), 'sub', subs.map((s) => ({ id: s.id, label: loc(s.name, lang) })), f.sub) : ''}
    ${chipRow(t('catalog.material'), 'mat', (D.MATERIALS || []).filter((m) => usedMats.has(m.id)).map((m) => ({ id: m.id, label: loc(m.name, lang) })), f.mat)}
    ${chipRow(t('catalog.technology'), 'tec', (D.TECHNOLOGIES || []).filter((x) => usedTechs.has(x.id)).map((x) => ({ id: x.id, label: loc(x.name, lang) })), f.tec)}
    ${chipRow(t('catalog.use'), 'uso', (D.MIGRATION?.collections || []).filter((c) => usedUses.has(c.id)).map((c) => ({ id: c.id, label: loc(c.name, lang) })), f.uso)}

    <div class="filter-row">
      <div class="filter-chips">
        <button type="button" class="filter-chip" data-filter="pers" data-value="1"
          aria-pressed="${f.pers === '1'}">${esc(t('catalog.customizable'))}</button>
        <button type="button" class="filter-chip" data-filter="pub" data-value="b2b"
          aria-pressed="${f.pub === 'b2b'}">${esc(t('product.audience.b2b'))}</button>
        <button type="button" class="filter-chip" data-filter="pub" data-value="b2c"
          aria-pressed="${f.pub === 'b2c'}">${esc(t('product.audience.b2c'))}</button>
        <button type="button" class="filter-chip" id="clearFilters">${esc(t('catalog.clear'))}</button>
      </div>
    </div>
  </div>`;
}

/* Il catalogo lavora sempre dentro il proprio nodo di montaggio: le query
   sono scoped a `state.root`, mai al documento. Evita che due istanze (o un
   frammento residuo) si contendano gli stessi id. */
let state = { categoryId: null, root: null };

function bindFilters(root, { categoryId }) {
  state.categoryId = categoryId;
  state.root = root;

  root.addEventListener('click', (e) => {
    const clear = e.target.closest('#clearFilters');
    if (clear) {
      const q = new URLSearchParams();
      setQuery(q);
      repaintFrom(q);
      return;
    }

    const chip = e.target.closest('.filter-chip[data-filter]');
    if (!chip) return;

    const q = currentParams();
    const key = chip.dataset.filter;
    const value = chip.dataset.value;

    // Ripremere un filtro attivo lo rimuove: è il comportamento atteso.
    if (!value || q.get(key) === value) q.delete(key);
    else q.set(key, value);

    // Cambiare categoria invalida la sottocategoria precedente.
    if (key === 'cat') q.delete('sub');

    setQuery(q);
    repaintFrom(q);
    syncChips(root, q);
  });

  const search = $('#catSearch', root);
  search?.addEventListener('input', debounce((e) => {
    const q = currentParams();
    const v = e.target.value.trim();
    if (v) q.set('q', v); else q.delete('q');
    setQuery(q);
    repaintFrom(q);
  }, 220));

  $('#sortSel', root)?.addEventListener('change', (e) => {
    const q = currentParams();
    if (e.target.value) q.set('ordina', e.target.value); else q.delete('ordina');
    setQuery(q);
    repaintFrom(q);
  });
}

function currentParams() {
  const hashQ = location.hash.indexOf('?');
  return new URLSearchParams(hashQ >= 0 ? location.hash.slice(hashQ + 1) : location.search);
}

function syncChips(root, q) {
  $$('.filter-chip[data-filter]', root).forEach((chip) => {
    const key = chip.dataset.filter;
    const value = chip.dataset.value;
    const active = value ? q.get(key) === value : !q.get(key);
    chip.setAttribute('aria-pressed', String(active));
  });
}

function repaintFrom(q) {
  const f = readFilters(q);
  if (state.categoryId) f.cat = state.categoryId;
  paint(f);
}

function paint(f) {
  const scope = state.root || document;
  const grid = $('#productGrid', scope);
  const counter = $('#resultCount', scope);
  if (!grid) return;

  const list = applyFilters(publicProducts(), f);

  if (counter) {
    counter.innerHTML = `<b>${list.length}</b> ${esc(list.length === 1 ? t('catalog.result') : t('catalog.results'))}`;
  }

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <h3>${esc(t('catalog.empty'))}</h3>
        <p>${esc(t('catalog.emptyHint'))}</p>
        <button type="button" class="btn btn--outline" id="clearFilters">${esc(t('catalog.clear'))}</button>
      </div>`;
    return;
  }

  grid.innerHTML = list.map((p, i) => productCard(p, { eager: i < 4, index: i })).join('');
  observeReveals(grid);
}
