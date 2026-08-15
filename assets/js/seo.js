/* ============================================================
   INGLY DESIGN — SEO
   ------------------------------------------------------------
   Title, meta description, canonical, Open Graph, hreflang e
   JSON-LD aggiornati a ogni cambio di rotta (master command §27).
   ============================================================ */

import { esc, loc } from './utils.js';

const BRAND = 'INGLY DESIGN';

function meta(selector, attr, value) {
  if (!value) return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [, key, val] = selector.match(/\[(\w+)="([^"]+)"\]/) || [];
    if (key && val) el.setAttribute(key, val);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function link(rel, hrefValue, extra = {}) {
  if (!hrefValue) return;
  const sel = `link[rel="${rel}"]${extra.hreflang ? `[hreflang="${extra.hreflang}"]` : ''}`;
  let el = document.head.querySelector(sel);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    if (extra.hreflang) el.hreflang = extra.hreflang;
    document.head.appendChild(el);
  }
  el.href = hrefValue;
}

/**
 * @param {object} o
 * @param {string} o.title     titolo pagina, senza brand
 * @param {string} o.description
 * @param {string} o.canonical URL assoluto canonico
 * @param {string} [o.image]   percorso relativo immagine social
 * @param {string} [o.lang]
 * @param {object} [o.jsonLd]  dato strutturato della pagina
 */
export function setSeo({ title, description, canonical: url, image, lang = 'it', jsonLd }) {
  const full = title ? `${title} | ${BRAND}` : BRAND;
  document.title = full;
  document.documentElement.lang = lang;

  meta('meta[name="description"]', 'content', description);
  link('canonical', url);

  meta('meta[property="og:title"]', 'content', full);
  meta('meta[property="og:description"]', 'content', description);
  meta('meta[property="og:url"]', 'content', url);
  meta('meta[property="og:type"]', 'content', 'website');
  meta('meta[property="og:site_name"]', 'content', BRAND);
  meta('meta[property="og:locale"]', 'content', lang === 'en' ? 'en_GB' : 'it_IT');

  meta('meta[name="twitter:card"]', 'content', 'summary_large_image');
  meta('meta[name="twitter:title"]', 'content', full);
  meta('meta[name="twitter:description"]', 'content', description);

  if (image) {
    const abs = /^https?:/.test(image) ? image : new URL(image, location.origin).href;
    meta('meta[property="og:image"]', 'content', abs);
    meta('meta[name="twitter:image"]', 'content', abs);
  }

  setJsonLd(jsonLd);
}

function setJsonLd(data) {
  let el = document.getElementById('ld-page');
  if (!data) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'ld-page';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/* ---- costruttori di dati strutturati ---------------------------------- */

export function organizationLd(config, origin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND,
    url: origin,
    description: config?.site?.description || '',
    founder: { '@type': 'Person', name: config?.brand?.person || 'Giuseppe Inglima' },
    ...(config?.contact?.email ? { email: config.contact.email } : {}),
    ...(config?.contact?.city
      ? { address: { '@type': 'PostalAddress', addressRegion: config.contact.city, addressCountry: config.contact.country || 'IT' } }
      : {}),
    sameAs: Object.values(config?.social || {}).filter(Boolean)
  };
}

export function breadcrumbLd(items, origin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      item: origin + it.path
    }))
  };
}

export function productLd(product, category, origin, lang = 'it') {
  const img = product.images?.[0]?.src;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.name} — ${product.subtitle}`,
    sku: product.id,
    description: product.shortDescription,
    category: loc(category?.name, lang),
    ...(img ? { image: new URL(img, origin).href } : {}),
    brand: { '@type': 'Brand', name: BRAND },
    manufacturer: { '@type': 'Organization', name: BRAND },
    material: (product.materials || []).join(', '),
    // Nessun prezzo esposto: il modello è la richiesta di preventivo.
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/MadeToOrder',
      priceCurrency: 'EUR',
      url: `${origin}/creazioni/${product.category}/${product.slug}`,
      seller: { '@type': 'Organization', name: BRAND }
    }
  };
}

export function faqLd(items, lang = 'it') {
  if (!items?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: loc(f.q, lang),
      acceptedAnswer: { '@type': 'Answer', text: loc(f.a, lang) }
    }))
  };
}

export function personLd(config, content, origin, lang = 'it') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: config?.brand?.person || 'Giuseppe Inglima',
    jobTitle: loc(config?.brand?.role, lang),
    worksFor: { '@type': 'Organization', name: BRAND },
    url: `${origin}/chi-sono`,
    description: loc(content?.chiSono?.lead, lang)
  };
}

export { esc };
