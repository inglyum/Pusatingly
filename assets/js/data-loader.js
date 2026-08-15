/* ============================================================
   INGLY DESIGN — DATA LOADER
   ------------------------------------------------------------
   Fonte di verità: /data/*.json, con cache-busting da version.json.

   Principio ereditato dal sistema INGLY esistente:
   IL SITO NON DEVE MAI CROLLARE PER UN DATO IMPERFETTO.
   heal() ripara in memoria e segnala in console; un materiale scritto
   male degrada una card, non l'intero catalogo.
   ============================================================ */

const FILES = [
  ['config', 'CONFIG'],
  ['texts', 'T'],
  ['categories', 'CATS'],
  ['products', 'PRODUCTS'],
  ['materials', 'MATERIALS'],
  ['technologies', 'TECHNOLOGIES'],
  ['portfolio', 'PORTFOLIO'],
  ['content', 'CONTENT'],
  ['migration', 'MIGRATION']
];

export const dataStatus = { version: null, missing: [], repaired: [] };

/* ---- auto-guarigione -------------------------------------------------- */

function heal(D) {
  const fixed = [];
  try {
    D.CATS ||= [];
    D.PRODUCTS ||= [];
    D.MATERIALS ||= [];
    D.TECHNOLOGIES ||= [];
    D.PORTFOLIO ||= { projects: [], archetypes: [] };
    D.MIGRATION ||= { collections: [], redirects: [], migrationStates: [] };
    D.CONTENT ||= {};
    D.CONFIG ||= {};

    const catIds = new Set(D.CATS.map((c) => c.id));
    const matIds = new Set(D.MATERIALS.map((m) => m.id));
    const techIds = new Set(D.TECHNOLOGIES.map((t) => t.id));

    D.PRODUCTS = D.PRODUCTS.filter((p) => {
      if (!p || !p.id) { fixed.push('prodotto senza id: scartato'); return false; }
      return true;
    });

    for (const p of D.PRODUCTS) {
      if (!catIds.has(p.category)) {
        fixed.push(`${p.id}: categoria "${p.category}" inesistente`);
        p.__orphan = true;
      }
      if (Array.isArray(p.materials)) {
        const bad = p.materials.filter((m) => !matIds.has(m));
        if (bad.length) {
          fixed.push(`${p.id}: materiali sconosciuti ${bad.join(', ')}`);
          p.materials = p.materials.filter((m) => matIds.has(m));
        }
      } else p.materials = [];

      if (Array.isArray(p.technologies)) {
        const bad = p.technologies.filter((t) => !techIds.has(t));
        if (bad.length) {
          fixed.push(`${p.id}: tecnologie sconosciute ${bad.join(', ')}`);
          p.technologies = p.technologies.filter((t) => techIds.has(t));
        }
      } else p.technologies = [];

      p.uses ||= [];
      p.tags ||= [];
      p.customization ||= [];
      p.gallery ||= [];
      p.dimensions ||= {};
      p.name ||= p.id;
      p.slug ||= p.id;
      p.migrationStatus ||= 'imported';
      p.seo ||= { title: p.name, description: p.shortDescription || '' };

      if (!Array.isArray(p.images) || !p.images.length) {
        fixed.push(`${p.id}: nessuna immagine, generato riferimento placeholder`);
        p.images = [{
          src: `assets/images/products/${p.id}.svg`,
          alt: p.subtitle || p.name,
          source: 'ingly-placeholder',
          status: 'placeholder',
          replacementRequired: true
        }];
      }
      // alt mancante: l'immagine resta, ma non deve essere muta per gli screen reader.
      for (const img of p.images) {
        if (!img.alt) {
          img.alt = p.subtitle || p.name;
          fixed.push(`${p.id}: alt mancante, ricostruito dal sottotitolo`);
        }
      }
    }

    for (const c of D.CATS) {
      c.subcategories ||= [];
      c.name ||= { it: c.id, en: c.id };
    }
  } catch (err) {
    console.warn('[INGLY] heal():', err);
  }

  if (fixed.length) {
    dataStatus.repaired = fixed;
    console.warn(`[INGLY] dati riparati in memoria (${fixed.length}):\n  ${fixed.join('\n  ')}`);
  }
  return D;
}

/* ---- caricamento ------------------------------------------------------ */

export async function loadData() {
  if (window.INGLY?.PRODUCTS) return window.INGLY;

  let v = null;
  try {
    const r = await fetch(`data/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (r.ok) v = (await r.json()).v;
  } catch { /* nessuna versione: si carica comunque, senza cache-busting */ }

  const query = v != null ? `?v=${v}` : '';
  const results = await Promise.allSettled(
    FILES.map(([file]) =>
      fetch(`data/${file}.json${query}`).then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
    )
  );

  const D = {};
  results.forEach((res, i) => {
    const [file, key] = FILES[i];
    if (res.status === 'fulfilled') D[key] = res.value;
    else dataStatus.missing.push(`${file}.json`);
  });

  if (dataStatus.missing.length) {
    console.warn(`[INGLY] file non caricati: ${dataStatus.missing.join(', ')}`);
  }

  // Senza catalogo o categorie non c'è sito: è l'unico errore fatale.
  if (!D.PRODUCTS || !D.CATS) {
    throw new Error(`Dati del sito non disponibili (${dataStatus.missing.join(', ') || 'risposta vuota'}).`);
  }

  heal(D);
  D.__version = v;
  D.__status = dataStatus;
  window.INGLY = D;
  return D;
}
