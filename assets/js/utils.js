/* ============================================================
   INGLY DESIGN — UTILITY
   ============================================================ */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Escape HTML: tutto ciò che finisce in innerHTML passa da qui. */
export function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Valore localizzato: accetta stringa o { it, en }. */
export function loc(value, lang = 'it') {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[lang] ?? value.it ?? Object.values(value)[0] ?? '';
}

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function debounce(fn, ms = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Normalizza per la ricerca: minuscole, senza accenti. */
export function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function toast(message, ms = 3200) {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('is-on'), ms);
}

/** Icona SVG inline dal set interno. */
const ICONS = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  close: '<path d="M18 6L6 18M6 6l12 12"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/>',
  whatsapp: '<path d="M21 11.5a8.4 8.4 0 01-12.6 7.3L3 20.5l1.8-5.3A8.5 8.5 0 1121 11.5z"/>'
};

export function icon(name, size = 20) {
  const path = ICONS[name] || '';
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

/** Unisce una lista in italiano: "a, b e c". */
export function joinIt(list, conj = 'e') {
  const arr = (list || []).filter(Boolean);
  if (!arr.length) return '';
  if (arr.length === 1) return arr[0];
  return `${arr.slice(0, -1).join(', ')} ${conj} ${arr[arr.length - 1]}`;
}

export const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
