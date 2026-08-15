/* ============================================================
   INGLY DESIGN — ADMIN CATALOGO
   ------------------------------------------------------------
   Editor del catalogo che gira nel browser, senza backend.

   Modello di lavoro:
       carica data/*.json
         → modifichi (bozza salvata nel browser)
           → anteprima sul sito reale
             → esporti products.json e lo metti nel repository

   Regole del progetto applicate qui, non solo documentate:
   - gli id non si riusano MAI, nemmeno dopo l'archiviazione
   - non si cancella: si archivia
   - ogni immagine deve avere un alt
   - i nomi riservati del sito di riferimento sono rifiutati
   ============================================================ */

import { $, $$, esc, loc, norm, icon, debounce } from './utils.js';

const DRAFT_KEY = 'ingly-admin-draft';
const PREVIEW_KEY = 'ingly-admin-preview';

const FILES = [
  ['config', 'CONFIG'], ['texts', 'T'], ['categories', 'CATS'],
  ['products', 'PRODUCTS'], ['materials', 'MATERIALS'],
  ['technologies', 'TECHNOLOGIES'], ['portfolio', 'PORTFOLIO'],
  ['content', 'CONTENT'], ['migration', 'MIGRATION']
];

const S = {
  D: null,
  products: [],
  published: [],      // copia originale, per sapere cosa è cambiato
  selected: null,
  dirty: false,
  filters: { q: '', cat: '', status: '' },
  photos: new Map()   // id → { blob, url, name } in attesa di download
};

/* ============ AVVIO ============ */

init();

async function init() {
  const D = {};
  const res = await Promise.allSettled(
    FILES.map(([f]) => fetch(`data/${f}.json?t=${Date.now()}`).then((r) => {
      if (!r.ok) throw new Error(`${f}: ${r.status}`);
      return r.json();
    }))
  );
  res.forEach((r, i) => { if (r.status === 'fulfilled') D[FILES[i][1]] = r.value; });

  if (!D.PRODUCTS || !D.CATS) {
    $('#editor').innerHTML = `<div class="a-empty"><p>Dati non caricati. Apri l'admin da un server locale (<code>npm run serve</code>), non con un doppio clic sul file.</p></div>`;
    return;
  }

  S.D = D;
  S.published = JSON.parse(JSON.stringify(D.PRODUCTS));
  S.products = restoreDraft() || JSON.parse(JSON.stringify(D.PRODUCTS));

  buildFilters();
  renderList();
  bind();
  markDirty(hasChanges());
}

/* ============ BOZZA ============ */

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!Array.isArray(draft.products)) return null;
    return draft.products;
  } catch { return null; }
}

const saveDraft = debounce(() => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), products: S.products }));
  } catch (e) {
    console.warn('[admin] bozza non salvata:', e);
  }
}, 400);

function hasChanges() {
  return JSON.stringify(S.products) !== JSON.stringify(S.published);
}

function markDirty(on) {
  S.dirty = on;
  const el = $('#state');
  el.dataset.dirty = on ? '1' : '0';
  const n = on ? countChanges() : 0;
  el.textContent = on
    ? `${n} ${n === 1 ? 'creazione modificata' : 'creazioni modificate'}, non esportate`
    : 'nessuna modifica';
}

function countChanges() {
  const before = new Map(S.published.map((p) => [p.id, JSON.stringify(p)]));
  let n = 0;
  for (const p of S.products) if (before.get(p.id) !== JSON.stringify(p)) n++;
  return n;
}

function touch() {
  saveDraft();
  markDirty(hasChanges());
  renderList();
}

/* ============ ELENCO ============ */

function buildFilters() {
  $('#fCat').innerHTML = `<option value="">Tutte le categorie</option>`
    + S.D.CATS.map((c) => `<option value="${esc(c.id)}">${esc(loc(c.name))}</option>`).join('');
  $('#fStatus').innerHTML = `<option value="">Tutti gli stati</option>`
    + (S.D.MIGRATION?.migrationStates || []).map((s) => `<option value="${esc(s.id)}">${esc(loc(s.label))}</option>`).join('');
}

function visible() {
  const { q, cat, status } = S.filters;
  const nq = norm(q);
  return S.products.filter((p) => {
    if (cat && p.category !== cat) return false;
    if (status && p.migrationStatus !== status) return false;
    if (nq && !norm(`${p.name} ${p.subtitle} ${p.id}`).includes(nq)) return false;
    return true;
  });
}

function renderList() {
  const list = visible();
  $('#count').textContent = `${list.length} / ${S.products.length}`;
  $('#list').innerHTML = list.map((p) => `
    <button type="button" class="a-row" data-id="${esc(p.id)}" aria-current="${p.id === S.selected}">
      <img src="${esc(thumb(p))}" alt="" loading="lazy" onerror="${onMissing}">
      <span>
        <span class="a-row-name">${esc(p.name)}</span>
        <span class="a-row-sub">${esc(p.subtitle)}</span>
        <span class="a-row-id">${esc(p.id)}</span>
      </span>
      <span class="a-dot" data-status="${esc(p.migrationStatus)}" title="${esc(p.migrationStatus)}"></span>
    </button>`).join('') || `<p style="padding:var(--sp-5);color:var(--text-3);font-size:var(--fs-sm)">Nessun risultato.</p>`;
}

const thumb = (p) => S.photos.get(p.id)?.url || p.images?.[0]?.src || `assets/images/products/${p.id}.svg`;

/* Una creazione appena aggiunta non ha ancora il suo placeholder su disco
   (lo genera `npm run placeholders`). Nell'admin si mostra un segnaposto
   inline invece dell'icona di immagine rotta. */
const BLANK = 'data:image/svg+xml,'
  + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3">'
    + '<rect width="4" height="3" fill="%23222"/></svg>').replace(/%2523/g, '%23');

const onMissing = `this.onerror=null;this.src='${BLANK}'`;

/* ============ EDITOR ============ */

function select(id) {
  S.selected = id;
  renderList();
  renderEditor();
  $('#editor').scrollTop = 0;
}

function renderEditor() {
  const p = S.products.find((x) => x.id === S.selected);
  const root = $('#editor');
  if (!p) {
    root.innerHTML = `<div class="a-empty"><p>Scegli una creazione dall'elenco, oppure creane una nuova.</p></div>`;
    return;
  }

  const cat = S.D.CATS.find((c) => c.id === p.category);
  const subs = cat?.subcategories || [];
  const states = S.D.MIGRATION?.migrationStates || [];
  const collections = S.D.MIGRATION?.collections || [];
  const photo = S.photos.get(p.id);

  root.innerHTML = `
  <div class="a-editor-inner">
    <div class="a-head">
      <h1>${esc(p.name)}</h1>
      <span class="chip chip--mono">${esc(p.id)}</span>
      ${p.migrationStatus === 'archived' ? '<span class="chip">archiviata</span>' : ''}
      <button type="button" class="btn btn--ghost" id="btnDup">Duplica</button>
      <button type="button" class="btn btn--outline" id="btnArchive">
        ${p.migrationStatus === 'archived' ? 'Ripristina' : 'Archivia'}
      </button>
    </div>

    <section class="a-section">
      <h2>Identità</h2>
      <div class="a-grid a-grid--2">
        <div class="a-field">
          <label for="e-name">Nome proprio</label>
          <input id="e-name" data-k="name" value="${esc(p.name)}">
          <span class="hint">Nomenclatura INGLY. I nomi del sito di riferimento sono rifiutati.</span>
        </div>
        <div class="a-field">
          <label for="e-subtitle">Descrittore funzionale</label>
          <input id="e-subtitle" data-k="subtitle" value="${esc(p.subtitle)}">
        </div>
      </div>
      <div class="a-grid a-grid--2" style="margin-top:var(--sp-4)">
        <div class="a-field">
          <label for="e-slug">Slug (URL)</label>
          <input id="e-slug" data-k="slug" value="${esc(p.slug)}">
          <span class="hint">Cambiarlo rompe i link esistenti: fallo solo se la creazione non è ancora pubblica.</span>
        </div>
        <div class="a-field">
          <label for="e-id">Codice</label>
          <input id="e-id" value="${esc(p.id)}" readonly>
          <span class="hint">Non modificabile e mai riusato, nemmeno dopo l'archiviazione.</span>
        </div>
      </div>
    </section>

    <section class="a-section">
      <h2>Classificazione</h2>
      <div class="a-grid a-grid--3">
        <div class="a-field">
          <label for="e-category">Categoria</label>
          <select id="e-category" data-k="category">
            ${S.D.CATS.map((c) => `<option value="${esc(c.id)}" ${c.id === p.category ? 'selected' : ''}>${esc(loc(c.name))}</option>`).join('')}
          </select>
        </div>
        <div class="a-field">
          <label for="e-subcategory">Sottocategoria</label>
          <select id="e-subcategory" data-k="subcategory">
            ${subs.map((s) => `<option value="${esc(s.id)}" ${s.id === p.subcategory ? 'selected' : ''}>${esc(loc(s.name))}</option>`).join('')}
          </select>
        </div>
        <div class="a-field">
          <label for="e-audience">Pubblico</label>
          <select id="e-audience" data-k="audience">
            ${['b2b', 'b2c', 'both'].map((a) => `<option value="${a}" ${a === p.audience ? 'selected' : ''}>${a}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="a-grid a-grid--2" style="margin-top:var(--sp-4)">
        <div class="a-field">
          <label for="e-status">Stato di migrazione</label>
          <select id="e-status" data-k="migrationStatus">
            ${states.map((s) => `<option value="${esc(s.id)}" ${s.id === p.migrationStatus ? 'selected' : ''}>${esc(loc(s.label))}</option>`).join('')}
          </select>
        </div>
        <div class="a-field">
          <label for="e-featured">In evidenza in homepage</label>
          <select id="e-featured" data-k="featured">
            <option value="no" ${!p.featured ? 'selected' : ''}>No</option>
            <option value="si" ${p.featured ? 'selected' : ''}>Sì</option>
          </select>
        </div>
      </div>
    </section>

    <section class="a-section">
      <h2>Testi</h2>
      <div class="a-field">
        <label for="e-short">Descrizione breve <span class="hint">— usata nelle card e nella meta description</span></label>
        <textarea id="e-short" data-k="shortDescription" style="min-height:70px">${esc(p.shortDescription)}</textarea>
        <span class="a-counter" data-for="e-short"></span>
      </div>
      <div class="a-field" style="margin-top:var(--sp-4)">
        <label for="e-desc">Descrizione estesa <span class="hint">— riga vuota = nuovo paragrafo</span></label>
        <textarea id="e-desc" data-k="description">${esc(p.description)}</textarea>
      </div>
    </section>

    <section class="a-section">
      <h2>Materiali</h2>
      <div class="a-chips" data-multi="materials">
        ${S.D.MATERIALS.map((m) => `<button type="button" class="a-chip" data-v="${esc(m.id)}" aria-pressed="${p.materials.includes(m.id)}">${esc(loc(m.name))}</button>`).join('')}
      </div>
    </section>

    <section class="a-section">
      <h2>Tecnologie</h2>
      <div class="a-chips" data-multi="technologies">
        ${S.D.TECHNOLOGIES.map((x) => `<button type="button" class="a-chip" data-v="${esc(x.id)}" aria-pressed="${p.technologies.includes(x.id)}">${esc(loc(x.name))}</button>`).join('')}
      </div>
    </section>

    <section class="a-section">
      <h2>Destinazioni d'uso</h2>
      <div class="a-chips" data-multi="uses">
        ${collections.map((c) => `<button type="button" class="a-chip" data-v="${esc(c.id)}" aria-pressed="${p.uses.includes(c.id)}">${esc(loc(c.name))}</button>`).join('')}
      </div>
    </section>

    <section class="a-section">
      <h2>Dimensioni</h2>
      <div class="a-dims" id="dims">
        ${Object.entries(p.dimensions).map(([k, v], i) => `
          <div class="a-dim" data-i="${i}">
            <input placeholder="voce (es. larghezza)" data-dk value="${esc(k)}">
            <input placeholder="valore (es. 23 cm)" data-dv value="${esc(v)}">
            <button type="button" class="btn btn--ghost" data-drm aria-label="Rimuovi">✕</button>
          </div>`).join('')}
      </div>
      <button type="button" class="btn btn--ghost" id="btnDim" style="margin-top:var(--sp-3)">+ Aggiungi dimensione</button>
    </section>

    <section class="a-section">
      <h2>Personalizzazione</h2>
      <div class="a-field">
        <label for="e-custom">Voci personalizzabili <span class="hint">— separate da virgola. Vuoto = non personalizzabile.</span></label>
        <input id="e-custom" value="${esc(p.customization.join(', '))}">
      </div>
    </section>

    <section class="a-section">
      <h2>Fotografia</h2>
      <div class="a-photo">
        <div class="a-photo-frame"><img src="${esc(thumb(p))}" alt="" onerror="${onMissing}"></div>
        <div>
          <div class="a-field">
            <label for="e-photo">Carica una fotografia</label>
            <input type="file" id="e-photo" accept="image/*">
            <span class="hint">Viene ritagliata a 4:3, ridimensionata a 1600×1200 e convertita in WebP. Poi la scarichi già rinominata <code>${esc(p.id)}.webp</code>.</span>
          </div>
          ${photo ? `
            <button type="button" class="btn btn--primary" id="btnDlPhoto" style="margin-top:var(--sp-4)">
              Scarica ${esc(p.id)}.webp
            </button>` : ''}
          <div class="a-field" style="margin-top:var(--sp-4)">
            <label for="e-alt">Testo alternativo (obbligatorio)</label>
            <input id="e-alt" value="${esc(p.images?.[0]?.alt || '')}">
            <span class="hint">Descrive l'immagine a chi non la vede. Non è il nome del file.</span>
          </div>
          <p style="font-size:var(--fs-2xs);color:var(--text-3);margin-top:var(--sp-3);font-family:var(--font-mono)">
            stato: ${esc(p.images?.[0]?.status || '—')}
          </p>
        </div>
      </div>
    </section>

    <section class="a-section">
      <h2>SEO</h2>
      <div class="a-field">
        <label for="e-seotitle">Title</label>
        <input id="e-seotitle" value="${esc(p.seo?.title || '')}">
        <span class="a-counter" data-for="e-seotitle" data-max="60"></span>
      </div>
      <div class="a-field" style="margin-top:var(--sp-4)">
        <label for="e-seodesc">Meta description</label>
        <textarea id="e-seodesc" style="min-height:70px">${esc(p.seo?.description || '')}</textarea>
        <span class="a-counter" data-for="e-seodesc" data-max="160"></span>
      </div>
    </section>

    <section class="a-section">
      <h2>Controlli</h2>
      <div class="a-issues" id="issues"></div>
    </section>
  </div>`;

  bindEditor(p);
  updateCounters();
  renderIssues();
}

/* ============ EVENTI EDITOR ============ */

function bindEditor(p) {
  const root = $('#editor');

  // campi semplici legati a una chiave del prodotto
  root.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    p[k] = e.target.value;
    if (k === 'name' || k === 'subtitle') $('.a-head h1').textContent = p.name;
    afterEdit(p);
  });

  root.addEventListener('change', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    if (k === 'featured') p.featured = e.target.value === 'si';
    else p[k] = e.target.value;

    // Cambiare categoria invalida la sottocategoria: si riallinea alla prima valida.
    if (k === 'category') {
      const cat = S.D.CATS.find((c) => c.id === p.category);
      p.subcategory = cat?.subcategories?.[0]?.id || '';
      renderEditor();
    }
    afterEdit(p);
  });

  // chip multiselezione
  root.querySelectorAll('[data-multi]').forEach((box) => {
    box.addEventListener('click', (e) => {
      const chip = e.target.closest('.a-chip');
      if (!chip) return;
      const key = box.dataset.multi;
      const v = chip.dataset.v;
      const on = chip.getAttribute('aria-pressed') === 'true';
      p[key] = on ? p[key].filter((x) => x !== v) : [...p[key], v];
      chip.setAttribute('aria-pressed', String(!on));
      afterEdit(p);
    });
  });

  // dimensioni
  $('#btnDim').addEventListener('click', () => {
    p.dimensions = { ...p.dimensions, '': '' };
    renderEditor();
  });
  $('#dims').addEventListener('input', () => syncDims(p));
  $('#dims').addEventListener('click', (e) => {
    if (!e.target.closest('[data-drm]')) return;
    e.target.closest('.a-dim').remove();
    syncDims(p);
    renderEditor();
  });

  // personalizzazione
  $('#e-custom').addEventListener('input', (e) => {
    p.customization = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
    p.customizable = p.customization.length > 0;
    afterEdit(p);
  });

  // alt e SEO
  $('#e-alt').addEventListener('input', (e) => {
    p.images = p.images?.length ? p.images : [{ src: `assets/images/products/${p.id}.svg`, source: 'ingly-placeholder', status: 'placeholder', replacementRequired: true }];
    p.images[0].alt = e.target.value;
    afterEdit(p);
  });
  $('#e-seotitle').addEventListener('input', (e) => {
    p.seo = p.seo || {}; p.seo.title = e.target.value; afterEdit(p);
  });
  $('#e-seodesc').addEventListener('input', (e) => {
    p.seo = p.seo || {}; p.seo.description = e.target.value; afterEdit(p);
  });

  // foto
  $('#e-photo').addEventListener('change', (e) => handlePhoto(e, p));
  $('#btnDlPhoto')?.addEventListener('click', () => downloadPhoto(p));

  // azioni
  $('#btnArchive').addEventListener('click', () => toggleArchive(p));
  $('#btnDup').addEventListener('click', () => duplicate(p));
}

function afterEdit(p) {
  touch();
  updateCounters();
  renderIssues();
}

function syncDims(p) {
  const out = {};
  $$('#dims .a-dim').forEach((row) => {
    const k = row.querySelector('[data-dk]').value.trim();
    const v = row.querySelector('[data-dv]').value.trim();
    if (k) out[k] = v;
  });
  p.dimensions = out;
  touch();
}

function updateCounters() {
  $$('.a-counter').forEach((el) => {
    const src = $(`#${el.dataset.for}`);
    if (!src) return;
    const n = src.value.length;
    const max = Number(el.dataset.max || 0);
    el.textContent = max ? `${n} / ${max}` : `${n} caratteri`;
    el.dataset.over = max && n > max ? '1' : '0';
  });
}

/* ============ FOTO ============ */

/* Ritaglia a 4:3 e converte in WebP: le foto reali devono avere le stesse
   proporzioni dei placeholder, altrimenti la griglia salta al momento
   della sostituzione. */
async function handlePhoto(e, p) {
  const file = e.target.files?.[0];
  if (!file) return;

  const bitmap = await createImageBitmap(file);
  const W = 1600, H = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const scale = Math.max(W / bitmap.width, H / bitmap.height);
  const w = bitmap.width * scale, h = bitmap.height * scale;
  ctx.drawImage(bitmap, (W - w) / 2, (H - h) / 2, w, h);

  const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.85));
  if (!blob) { alert('Conversione WebP non riuscita in questo browser.'); return; }

  S.photos.get(p.id) && URL.revokeObjectURL(S.photos.get(p.id).url);
  S.photos.set(p.id, { blob, url: URL.createObjectURL(blob), name: `${p.id}.webp` });

  // Il dato punta alla foto: sync-images correggerà se il file non viene messo.
  p.images = [{
    src: `assets/images/products/${p.id}.webp`,
    alt: p.images?.[0]?.alt || p.subtitle,
    source: 'ingly-original',
    status: 'final',
    replacementRequired: false
  }];
  if (['imported', 'review', 'redesign'].includes(p.migrationStatus)) p.migrationStatus = 'active';
  p.replacementStatus = 'done';

  touch();
  renderEditor();
}

function downloadPhoto(p) {
  const ph = S.photos.get(p.id);
  if (!ph) return;
  saveAs(ph.blob, ph.name);
}

/* ============ AZIONI ============ */

function nextId(categoryId) {
  const prefix = {
    'soluzioni-menu': 'sm', 'tavola-cucina': 'tc', 'wood-art-design': 'wd',
    'oggettistica': 'og', 'targhe-insegne': 'ti', 'gadget': 'gd', 'casa': 'cs',
    'kids': 'kd', 'arte-movimento': 'am', 'tech': 'th', 'carta-packaging': 'cp',
    'plexi-metallo': 'pm', 'eventi': 'ev'
  }[categoryId] || categoryId.slice(0, 2);

  // Il massimo si calcola su TUTTI i prodotti, archiviati inclusi:
  // è così che si garantisce che un id non venga mai riusato.
  const used = [...S.products, ...S.published]
    .filter((p) => p.id.startsWith(`${prefix}-`))
    .map((p) => Number(p.id.split('-')[1]) || 0);
  const n = (used.length ? Math.max(...used) : 0) + 1;
  return `${prefix}-${String(n).padStart(3, '0')}`;
}

function createProduct(from = null) {
  const cat = from?.category || S.filters.cat || S.D.CATS[0].id;
  const category = S.D.CATS.find((c) => c.id === cat);
  const id = nextId(cat);

  const p = from ? JSON.parse(JSON.stringify(from)) : {
    name: 'Nuova creazione',
    subtitle: '',
    description: '',
    shortDescription: '',
    materials: [], technologies: [], uses: [],
    dimensions: {}, customization: [], customizable: false,
    audience: 'both', featured: false,
    subcategory: category.subcategories[0]?.id || ''
  };

  Object.assign(p, {
    id,
    slug: slugify(`${p.name} ${p.subtitle}`) || id,
    category: cat,
    originalName: null,
    sourceUrl: null,
    migrationStatus: 'redesign',
    replacementStatus: 'pending',
    legacyReference: from ? from.id : null,
    currentProduct: null,
    gallery: [],
    tags: [...new Set([cat, p.subcategory, ...p.materials, ...p.technologies, ...p.uses])],
    images: [{
      src: `assets/images/products/${id}.svg`,
      alt: p.subtitle || p.name,
      source: 'ingly-placeholder',
      status: 'placeholder',
      replacementRequired: true
    }],
    seo: { title: `${p.name} — ${p.subtitle}`.slice(0, 60), description: p.shortDescription },
    order: S.products.filter((x) => x.category === cat).length + 1,
    __generated: false
  });

  S.products.push(p);
  touch();
  select(id);
}

const duplicate = (p) => createProduct(p);

function toggleArchive(p) {
  if (p.migrationStatus === 'archived') {
    p.migrationStatus = 'review';
  } else {
    if (!confirm(`Archiviare "${p.name}"?\n\nNon viene cancellata: sparisce dal catalogo pubblico e dalla sitemap, ma resta nel file e può essere ripristinata.`)) return;
    p.migrationStatus = 'archived';
  }
  touch();
  renderEditor();
}

function slugify(s) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* ============ VALIDAZIONE ============ */

function validate() {
  const issues = [];
  const reserved = (S.D.MIGRATION?.reservedNames?.list || []).map((n) => n.toLowerCase());
  const ids = new Map(), slugs = new Map(), names = new Map();

  for (const p of S.products) {
    ids.set(p.id, (ids.get(p.id) || 0) + 1);
    slugs.set(p.slug, (slugs.get(p.slug) || 0) + 1);
    names.set(p.name.toLowerCase(), (names.get(p.name.toLowerCase()) || 0) + 1);
  }

  for (const p of S.products) {
    const at = `${p.id} · ${p.name}`;
    if (ids.get(p.id) > 1) issues.push(['error', at, 'codice duplicato']);
    if (slugs.get(p.slug) > 1) issues.push(['error', at, `slug duplicato: ${p.slug}`]);
    if (names.get(p.name.toLowerCase()) > 1) issues.push(['error', at, 'nome duplicato']);

    if (!p.name.trim()) issues.push(['error', at, 'nome mancante']);
    if (!p.subtitle.trim()) issues.push(['error', at, 'descrittore funzionale mancante']);
    if (!p.shortDescription.trim()) issues.push(['error', at, 'descrizione breve mancante']);
    if (!/^[a-z0-9-]+$/.test(p.slug)) issues.push(['error', at, `slug non valido: ${p.slug}`]);
    if (!p.images?.[0]?.alt?.trim()) issues.push(['error', at, 'testo alternativo dell\'immagine mancante']);

    const low = p.name.toLowerCase();
    const hit = reserved.find((r) => low === r || low.includes(r));
    if (hit) issues.push(['error', at, `"${hit}" è nomenclatura riservata al sito di riferimento`]);

    const cat = S.D.CATS.find((c) => c.id === p.category);
    if (!cat) issues.push(['error', at, `categoria inesistente: ${p.category}`]);
    else if (!cat.subcategories.some((s) => s.id === p.subcategory)) {
      issues.push(['error', at, `sottocategoria "${p.subcategory}" non appartiene a ${p.category}`]);
    }

    if (!p.materials.length) issues.push(['warn', at, 'nessun materiale selezionato']);
    if (!p.technologies.length) issues.push(['warn', at, 'nessuna tecnologia selezionata']);
    if ((p.seo?.title || '').length > 65) issues.push(['warn', at, `SEO title lungo (${p.seo.title.length})`]);
    if ((p.seo?.description || '').length > 160) issues.push(['warn', at, `meta description lunga (${p.seo.description.length})`]);
  }
  return issues;
}

function renderIssues() {
  const all = validate();
  const p = S.products.find((x) => x.id === S.selected);
  const mine = p ? all.filter((i) => i[1].startsWith(p.id)) : [];
  const box = $('#issues');
  if (!box) return;

  box.innerHTML = mine.length
    ? mine.map(([lvl, , msg]) => `<div class="a-issue" data-level="${lvl}">${esc(msg)}</div>`).join('')
    : `<div class="a-issue" data-level="ok">Nessun problema su questa creazione.</div>`;

  const errors = all.filter((i) => i[0] === 'error').length;
  const btn = $('#btnExport');
  btn.disabled = errors > 0;
  btn.title = errors ? `${errors} errori da risolvere prima di esportare` : '';
  $('#globalIssues').textContent = errors ? `${errors} errori nel catalogo` : '';
}

/* ============ ANTEPRIMA ED ESPORTAZIONE ============ */

function preview() {
  try {
    localStorage.setItem(PREVIEW_KEY, JSON.stringify({ savedAt: Date.now(), products: S.products }));
  } catch (e) {
    alert('Bozza troppo grande per l\'anteprima. Esporta il file e ricarica il sito.');
    return;
  }
  window.open('index.html?anteprima=1', '_blank', 'noopener');
}

function exportJson() {
  const clean = S.products.map((p) => {
    const { __generated, ...rest } = p;
    return { ...rest, __generated: false };
  });
  saveAs(new Blob([`${JSON.stringify(clean, null, 1)}\n`], { type: 'application/json' }), 'products.json');
  showHowTo();
}

function saveAs(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showHowTo() {
  const photos = [...S.photos.values()];
  $('#howtoPhotos').innerHTML = photos.length
    ? `<li>Metti le <b>${photos.length} fotografie</b> scaricate in <code>assets/images/products/</code></li>`
    : '';
  $('#howto').showModal();
}

/* ============ BARRA E FILTRI ============ */

function bind() {
  $('#list').addEventListener('click', (e) => {
    const row = e.target.closest('.a-row');
    if (row) select(row.dataset.id);
  });

  $('#fQ').addEventListener('input', debounce((e) => { S.filters.q = e.target.value; renderList(); }, 180));
  $('#fCat').addEventListener('change', (e) => { S.filters.cat = e.target.value; renderList(); });
  $('#fStatus').addEventListener('change', (e) => { S.filters.status = e.target.value; renderList(); });

  $('#btnNew').addEventListener('click', () => createProduct());
  $('#btnPreview').addEventListener('click', preview);
  $('#btnExport').addEventListener('click', exportJson);
  $('#btnReset').addEventListener('click', () => {
    if (!confirm('Scartare tutte le modifiche non esportate e tornare al catalogo pubblicato?')) return;
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(PREVIEW_KEY);
    S.products = JSON.parse(JSON.stringify(S.published));
    S.photos.clear();
    touch();
    renderEditor();
  });

  $$('#howto [data-close]').forEach((b) => b.addEventListener('click', () => $('#howto').close()));

  // Non si perde il lavoro chiudendo la scheda per sbaglio.
  window.addEventListener('beforeunload', (e) => {
    if (S.dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  renderEditor();
}
