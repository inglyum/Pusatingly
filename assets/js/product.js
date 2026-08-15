/* ============================================================
   INGLY DESIGN — SCHEDA PRODOTTO
   ------------------------------------------------------------
   Ordine delle sezioni imposto dal master command §24:
   Gallery → Titolo → Descrizione → Applicazioni → Materiali →
   Tecnologia → Dimensioni → Personalizzazione → Correlati → FAQ → CTA
   ============================================================ */

import { esc, loc, icon, joinIt } from './utils.js';
import { href } from './router.js';
import { productImg, observeReveals, isPlaceholder } from './images.js';
import {
  findCategory, publicProducts, productCard, subcategoryName,
  materialName, technologyName, collectionName
} from './catalog.js';

let D = null, lang = 'it', t = () => '';

export function initProduct(data, l, translate) { D = data; lang = l; t = translate; }

const DIM_LABELS = {
  larghezza: 'Larghezza', altezza: 'Altezza', profondita: 'Profondità',
  spessore: 'Spessore', diametro: 'Diametro', lato: 'Lato', base: 'Base',
  sporgenza: 'Sporgenza', grammatura: 'Grammatura', pezzi: 'Pezzi'
};

/** Correlati: stessa sottocategoria, poi stessa categoria. Mai il prodotto stesso. */
function related(p, limit = 3) {
  const pool = publicProducts().filter((x) => x.id !== p.id);
  const sameSub = pool.filter((x) => x.category === p.category && x.subcategory === p.subcategory);
  const sameCat = pool.filter((x) => x.category === p.category && x.subcategory !== p.subcategory);
  return [...sameSub, ...sameCat].slice(0, limit);
}

const PRODUCT_FAQ = [
  {
    q: { it: 'Posso personalizzare misure e materiale?', en: 'Can I change size and material?' },
    a: { it: 'Sì. Le misure indicate sono lo standard di catalogo, ma ogni creazione viene prodotta su commessa: variarle non comporta costi di attrezzaggio. Il materiale si sceglie in base a dove starà l\'oggetto e a quanto deve durare.', en: 'Yes. Listed dimensions are the catalogue standard; every creation is made to order.' }
  },
  {
    q: { it: 'Quanto tempo serve per riceverla?', en: 'How long does it take?' },
    a: { it: 'Da 4 a 20 giorni lavorativi dall\'approvazione del progetto, secondo complessità e quantità. La stima esatta arriva insieme al preventivo.', en: '4–20 working days from design approval, depending on complexity and quantity.' }
  },
  {
    q: { it: 'In che formato devo inviare il logo?', en: 'What logo format do you need?' },
    a: { it: 'Preferibilmente vettoriale (SVG, PDF, AI, EPS). Se hai solo un\'immagine raster la ricostruisco io: è un servizio incluso, non una voce a parte del preventivo.', en: 'Vector preferred. If you only have a raster image, I redraw it — included in the service.' }
  },
  {
    q: { it: 'C\'è un ordine minimo?', en: 'Is there a minimum order?' },
    a: { it: 'No. Si produce anche un pezzo solo. Sulle serie il costo unitario scende in modo sensibile a partire da cinquanta pezzi.', en: 'No. Single pieces are fine; unit cost drops noticeably from fifty pieces.' }
  }
];

export function renderProductPage(root, product) {
  const cat = findCategory(product.category);
  const cfg = D.CONFIG || {};
  const rel = related(product);
  const placeholder = isPlaceholder(product);

  const dims = Object.entries(product.dimensions || {});
  const audienceLabel = t(`product.audience.${product.audience || 'both'}`);

  root.innerHTML = `
    <div class="container">
      <nav aria-label="${esc(t('common.breadcrumb'))}">
        <ol class="breadcrumb">
          <li><a href="${href('/')}">${esc(t('common.home'))}</a></li>
          <li><a href="${href('/creazioni')}">${esc(t('catalog.title'))}</a></li>
          <li><a href="${href(`/creazioni/${product.category}`)}">${esc(loc(cat?.name, lang))}</a></li>
          <li aria-current="page">${esc(product.name)}</li>
        </ol>
      </nav>

      <div class="product-layout">
        <!-- GALLERY -->
        <div class="product-media">
          <figure class="product-media-main">
            ${productImg(product, { eager: true, sizes: '(max-width:1023px) 100vw, 50vw' })}
          </figure>
          ${placeholder ? `<p class="media-note">${esc(t('product.imagePlaceholder'))}</p>` : ''}
        </div>

        <div>
          <!-- TITOLO -->
          <p class="eyebrow">${esc(loc(cat?.name, lang))} · ${esc(subcategoryName(product.category, product.subcategory))}</p>
          <h1 class="product-title">${esc(product.name)}</h1>
          <p class="product-subtitle">${esc(product.subtitle)}</p>

          <div class="product-chips">
            ${product.customizable ? `<span class="chip chip--accent">${esc(t('product.customizable'))}</span>` : ''}
            <span class="chip">${esc(audienceLabel)}</span>
            <span class="chip chip--mono">${esc(product.id.toUpperCase())}</span>
          </div>

          <!-- DESCRIZIONE -->
          <section class="product-section">
            ${product.description.split('\n\n').map((para) => `<p>${esc(para)}</p>`).join('')}
          </section>

          <!-- APPLICAZIONI -->
          ${product.uses?.length ? `
          <section class="product-section">
            <h2>${esc(t('product.applications'))}</h2>
            <div class="tag-list">
              ${product.uses.map((u) => `<a class="chip" href="${href(`/creazioni?uso=${u}`)}">${esc(collectionName(u))}</a>`).join('')}
            </div>
          </section>` : ''}

          <!-- MATERIALI -->
          ${product.materials?.length ? `
          <section class="product-section">
            <h2>${esc(t('product.materials'))}</h2>
            <div class="tag-list">
              ${product.materials.map((m) => `<a class="chip" href="${href(`/materiali#${m}`)}">${esc(materialName(m))}</a>`).join('')}
            </div>
          </section>` : ''}

          <!-- TECNOLOGIA -->
          ${product.technologies?.length ? `
          <section class="product-section">
            <h2>${esc(t('product.technologies'))}</h2>
            <div class="tag-list">
              ${product.technologies.map((x) => `<a class="chip" href="${href(`/tecnologie#${x}`)}">${esc(technologyName(x))}</a>`).join('')}
            </div>
          </section>` : ''}

          <!-- DIMENSIONI -->
          ${dims.length ? `
          <section class="product-section">
            <h2>${esc(t('product.dimensions'))}</h2>
            <table class="data-table">
              <tbody>
                ${dims.map(([k, v]) => `
                  <tr><th scope="row">${esc(DIM_LABELS[k] || k)}</th><td>${esc(v)}</td></tr>`).join('')}
                <tr><th scope="row">${esc(t('product.leadTime'))}</th><td>${esc(loc(cfg.business?.leadTime, lang))}</td></tr>
              </tbody>
            </table>
          </section>` : ''}

          <!-- PERSONALIZZAZIONE -->
          ${product.customization?.length ? `
          <section class="product-section">
            <h2>${esc(t('product.customization'))}</h2>
            <p>${esc(`Questa creazione è personalizzabile su ${joinIt(product.customization)}.`)}</p>
          </section>` : ''}

          <!-- CTA -->
          <div class="product-cta">
            <a class="btn btn--primary btn--lg" href="${href(`/contatti?prodotto=${encodeURIComponent(product.id)}`)}">
              ${esc(t('cta.requestThis'))} ${icon('arrow', 16)}
            </a>
            ${cfg.contact?.whatsapp ? `
              <a class="btn btn--outline btn--lg" href="${esc(cfg.contact.whatsapp)}" target="_blank" rel="noopener">
                ${icon('whatsapp', 16)} ${esc(t('cta.whatsapp'))}
              </a>` : ''}
          </div>
        </div>
      </div>

      <!-- CORRELATI -->
      ${rel.length ? `
      <section class="section section--tight">
        <div class="section-head">
          <p class="eyebrow">${esc(t('product.related'))}</p>
          <h2 class="section-title" style="font-size:var(--fs-2xl)">${esc(loc(cat?.name, lang))}</h2>
        </div>
        <div class="product-grid">
          ${rel.map((p, i) => productCard(p, { index: i })).join('')}
        </div>
      </section>` : ''}

      <!-- FAQ -->
      <section class="section section--tight">
        <div class="section-head">
          <p class="eyebrow">${esc(t('product.faq'))}</p>
        </div>
        <div class="accordion" data-accordion>
          ${PRODUCT_FAQ.map((f, i) => `
            <div class="accordion-item">
              <h3>
                <button type="button" class="accordion-trigger" aria-expanded="false" aria-controls="pf-${i}">
                  ${esc(loc(f.q, lang))} ${icon('plus', 18)}
                </button>
              </h3>
              <div class="accordion-panel" id="pf-${i}">
                <p>${esc(loc(f.a, lang))}</p>
              </div>
            </div>`).join('')}
        </div>
      </section>
    </div>`;

  observeReveals(root);
}

export { PRODUCT_FAQ };
