/* ============================================================
   INGLY DESIGN — IMMAGINI
   ------------------------------------------------------------
   Sostituzione 1-click (docs/IMAGE-MIGRATION.md §5):
   il front-end prova prima la foto reale, poi ricade sul placeholder.

       assets/images/products/<id>.webp   ← se esiste, vince
       assets/images/products/<id>.svg    ← altrimenti

   Basta copiare il file .webp: nessuna modifica al codice, nessun
   cambio di URL, nessun layout shift (aspect-ratio fisso a monte).
   ============================================================ */

import { esc } from './utils.js';

/* La sorgente arriva SEMPRE dal dato (`images[0].src`), mai da un tentativo
   a runtime. Sondare l'esistenza della foto con un onerror costerebbe una
   404 per ogni prodotto a ogni visita — 176 richieste fallite su una pagina
   di catalogo. Il disallineamento fra disco e dato è invece risolto una
   volta sola, in fase di build, da `npm run sync-images`. */

const fallback = (product) => `assets/images/products/${product.id}.svg`;

/** Markup di una immagine di prodotto. */
export function productImg(product, { eager = false, sizes = '(max-width:600px) 100vw, 33vw' } = {}) {
  const img = product.images?.[0] || {};
  const src = img.src || fallback(product);
  const alt = img.alt || product.subtitle || product.name;

  return `<img src="${esc(src)}"
    alt="${esc(alt)}"
    width="800" height="600"
    loading="${eager ? 'eager' : 'lazy'}"
    ${eager ? 'fetchpriority="high"' : ''}
    decoding="async"
    sizes="${esc(sizes)}"
    ${img.status === 'final' ? '' : 'data-placeholder="1"'}>`;
}

export function categoryImg(category, { eager = false } = {}) {
  const src = category.image || `assets/images/categories/${category.id}.svg`;
  return `<img src="${esc(src)}"
    alt=""
    width="800" height="600"
    loading="${eager ? 'eager' : 'lazy'}"
    decoding="async">`;
}

/** true se il prodotto è ancora servito da un placeholder. */
export function isPlaceholder(product) {
  return product.images?.[0]?.status !== 'final';
}

/* ---- reveal allo scroll ------------------------------------------------ */

let observer = null;

export function observeReveals(root = document) {
  const targets = [...root.querySelectorAll('.reveal:not(.is-in)')];
  if (!targets.length) return;

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  observer ||= new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      observer.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  targets.forEach((el) => observer.observe(el));
}
