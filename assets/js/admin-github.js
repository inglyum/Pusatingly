/* ============================================================
   INGLY DESIGN — PUBBLICAZIONE SU GITHUB
   ------------------------------------------------------------
   L'Admin non ha un server. Scrive direttamente sul repository
   con la Git Data API, in UN SOLO COMMIT ATOMICO: o entrano
   tutti i file, o non entra niente. Non esiste uno stato
   intermedio in cui products.json cita una foto che non c'è.

   Procedura, identica a quella dell'Admin di inglydesign.it:

       blob per ogni file  →  albero sull'albero del commit HEAD
         →  commit         →  avanzamento del ref del ramo

   Tre cose che questo modulo NON fa, di proposito:

   1. Non scrive il token da nessuna parte che finisca in un
      commit. Vive in sessionStorage, oppure in localStorage se
      lo chiedi esplicitamente. Non è mai un dato del sito.
   2. Non pubblica se qualcuno ha toccato gli stessi file dopo
      che l'Admin li ha letti: te lo dice e decidi tu. Una
      pubblicazione silenziosa che sovrascrive il lavoro di
      un'altra scheda è il modo più veloce di perdere ore.
   3. Non dichiara "pubblicato" finché il commit non esiste
      davvero su GitHub, e distingue «commit salvo» da «sito
      online aggiornato»: sono due momenti diversi.
   ============================================================ */

import { sitemapXml } from './sitemap.js';

const SET_KEY = 'ingly-admin-github';
const TOK_KEY = 'ingly-admin-token';

export const SET = {
  owner: '', repo: '', branch: 'main', remember: false,
  ...leggiImpostazioni()
};

function leggiImpostazioni() {
  try { return JSON.parse(localStorage.getItem(SET_KEY) || '{}') || {}; }
  catch { return {}; }
}

export function salvaImpostazioni(patch = {}) {
  Object.assign(SET, patch);
  try {
    localStorage.setItem(SET_KEY, JSON.stringify({
      owner: SET.owner, repo: SET.repo, branch: SET.branch, remember: SET.remember
    }));
  } catch { /* storage non disponibile: le impostazioni valgono per questa sessione */ }
}

/* ---- token ------------------------------------------------------------- */

export function token() {
  try {
    return sessionStorage.getItem(TOK_KEY) || (SET.remember ? localStorage.getItem(TOK_KEY) : '') || '';
  } catch { return ''; }
}

export function setToken(t) {
  try {
    const v = String(t || '').trim();
    if (!v) { sessionStorage.removeItem(TOK_KEY); localStorage.removeItem(TOK_KEY); return; }
    sessionStorage.setItem(TOK_KEY, v);
    /* In localStorage solo se l'hai chiesto: lì sopravvive alla chiusura
       del browser, ed è una scelta che deve essere esplicita. */
    if (SET.remember) localStorage.setItem(TOK_KEY, v); else localStorage.removeItem(TOK_KEY);
  } catch { /* storage negato: il token vale finché la pagina resta aperta */ }
}

export function dimenticaToken() {
  try { sessionStorage.removeItem(TOK_KEY); localStorage.removeItem(TOK_KEY); } catch { /* ignorato */ }
}

/* ---- rilevamento del repository ---------------------------------------- */

/** Su <utente>.github.io owner e repo si leggono dall'URL: un campo in meno. */
export function autodetect(host = location.hostname, path = location.pathname) {
  const h = String(host).toLowerCase();
  if (!/\.github\.io$/.test(h)) return null;
  const owner = h.split('.')[0];
  const parts = String(path).split('/').filter(Boolean);
  const primo = (parts[0] || '').replace(/\.html$/, '');
  const repo = (primo && primo !== 'admin' && primo !== 'index') ? parts[0] : h;
  return { owner, repo };
}

/* ---- chiamate ---------------------------------------------------------- */

const API = () => `https://api.github.com/repos/${SET.owner}/${SET.repo}`;

export async function gh(path, opt = {}) {
  const headers = { Accept: 'application/vnd.github+json', ...(opt.headers || {}) };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;

  const r = await fetch(API() + path, { ...opt, headers });
  if (!r.ok) {
    const corpo = await r.text().catch(() => '');
    if (r.status === 403 && r.headers.get('x-ratelimit-remaining') === '0') {
      throw new Error(`GitHub RATELIMIT su ${path}`);
    }
    throw new Error(`GitHub ${r.status} su ${path}${corpo ? ` — ${corpo.slice(0, 160)}` : ''}`);
  }
  return r.status === 204 ? null : r.json();
}

/** Un messaggio d'errore che dice cosa fare, non cosa è successo. */
export function spiegaErrore(e) {
  const m = String(e?.message || e);
  if (m.includes('RATELIMIT')) return 'Limite delle API di GitHub superato. Con un token il limite passa da 60 a 5000 richieste all\'ora.';
  if (m.includes(' 401 ')) return 'Token non valido o scaduto. Creane uno nuovo: GitHub → Settings → Developer settings → Fine-grained tokens.';
  if (m.includes(' 404 ')) return `Il token non vede ${SET.owner}/${SET.repo}. Rigeneralo selezionando esattamente questo repository, e controlla owner e nome nelle impostazioni.`;
  if (m.includes(' 409 ') || m.includes(' 422 ')) return 'Il ramo è avanzato mentre pubblicavi. Ricarica l\'Admin e ripubblica: i dati più recenti vanno riletti.';
  if (m.includes(' 403 ')) return `Permessi insufficienti su ${SET.owner}/${SET.repo}: al token serve Contents → Read and write per questo repository.`;
  if (m.includes('Failed to fetch')) return 'Rete non raggiungibile, o richiesta bloccata dal browser.';
  return m;
}

/* ---- codifica ---------------------------------------------------------- */

/** UTF-8 → base64. btoa() da solo si rompe sulle accentate. */
export function b64utf8(testo) {
  const bytes = new TextEncoder().encode(String(testo));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function daB64(b64) {
  const bin = atob(String(b64 || '').replace(/\s/g, ''));
  return new TextDecoder('utf-8').decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export const blobInB64 = (blob) => new Promise((ok, no) => {
  const fr = new FileReader();
  fr.onload = () => ok(String(fr.result).split(',')[1] || '');
  fr.onerror = () => no(fr.error);
  fr.readAsDataURL(blob);
});

/* ---- guardia anti-sovrascrittura --------------------------------------- */

/**
 * Confronta i file sul repository con la copia che l'Admin ha letto
 * all'avvio (`istantanee`). Un file cambiato nel frattempo — un commit a
 * mano, un'altra scheda dell'Admin — verrebbe sovrascritto senza un rumore.
 * @returns {Promise<string[]>} i percorsi che risulterebbero sovrascritti
 */
/**
 * Confronto normalizzato: di un JSON conta il contenuto, non l'indentazione.
 * Senza questo, un file riscritto con due spazi invece di uno risulterebbe
 * "cambiato" a ogni pubblicazione e l'avviso diventerebbe rumore da ignorare.
 */
export function impronta(percorso, testo) {
  if (!/\.json$/.test(percorso)) return String(testo);
  try { return JSON.stringify(JSON.parse(testo)); } catch { return String(testo); }
}

export async function derive(percorsi, istantanee, ref) {
  const fuori = [];
  for (const p of percorsi) {
    const atteso = istantanee[p];
    if (atteso === undefined) continue;                 /* file nuovo: niente da perdere */
    try {
      const r = await gh(`/contents/${p}?ref=${encodeURIComponent(ref)}`);
      if (!r || !r.content) continue;
      if (impronta(p, daB64(r.content)) !== atteso) fuori.push(p);
    } catch { /* assente o illeggibile: non è un motivo per bloccare */ }
  }
  return fuori;
}

/* ---- pubblicazione ------------------------------------------------------ */

/**
 * Un solo commit con tutto dentro.
 * @param {object} o
 * @param {Record<string,{text?:string,b64?:string}>} o.files percorso → contenuto
 * @param {string[]} [o.elimina] percorsi da rimuovere dal repository
 * @param {string}   o.messaggio messaggio di commit
 * @param {Record<string,string>} [o.istantanee] percorso → contenuto letto all'avvio
 * @param {(f:string[])=>boolean|Promise<boolean>} [o.suDeriva] decide se procedere
 * @param {(fase:string, info?:string)=>void} [o.passo] avanzamento per l'interfaccia
 */
export async function pubblica({ files, elimina = [], messaggio, istantanee = {}, suDeriva, passo = () => {} }) {
  const percorsi = Object.keys(files);
  if (!percorsi.length && !elimina.length) throw new Error('Niente da pubblicare.');
  if (!SET.owner || !SET.repo) throw new Error('Owner e repository non impostati.');
  if (!token()) throw new Error('GitHub 401 su /git/ref: manca il token.');

  passo('ref');
  const ref = await gh(`/git/ref/heads/${SET.branch}`);
  const head = ref.object.sha;

  const fuori = await derive(percorsi, istantanee, head);
  if (fuori.length) {
    const avanti = suDeriva ? await suDeriva(fuori) : false;
    if (!avanti) {
      const e = new Error('Pubblicazione annullata: sul repository ci sono dati più recenti.');
      e.deriva = fuori;
      throw e;
    }
  }

  const headCommit = await gh(`/git/commits/${head}`);

  passo('blob', `0/${percorsi.length}`);
  const voci = [];
  for (let i = 0; i < percorsi.length; i++) {
    const p = percorsi[i];
    const f = files[p];
    const corpo = f.text !== undefined
      ? { content: f.text, encoding: 'utf-8' }
      : { content: f.b64, encoding: 'base64' };
    const blob = await gh('/git/blobs', { method: 'POST', body: JSON.stringify(corpo) });
    voci.push({ path: p, mode: '100644', type: 'blob', sha: blob.sha });
    passo('blob', `${i + 1}/${percorsi.length}`);
  }
  /* sha: null in un albero significa «togli questo percorso». */
  for (const p of elimina) voci.push({ path: p, mode: '100644', type: 'blob', sha: null });

  passo('albero');
  const albero = await gh('/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: voci })
  });

  passo('commit');
  const commit = await gh('/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message: messaggio, tree: albero.sha, parents: [head] })
  });

  passo('ref-avanti');
  /* force: false — se il ramo è avanzato nel frattempo GitHub rifiuta,
     invece di scavalcare il commit di qualcun altro. */
  await gh(`/git/refs/heads/${SET.branch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false })
  });

  passo('fatto', commit.sha.slice(0, 7));
  return { sha: commit.sha, files: percorsi, eliminati: elimina };
}

/* ---- verifica della messa online --------------------------------------- */

/**
 * Il commit salvo e il sito online sono due cose diverse: GitHub Pages
 * ricostruisce con i suoi tempi. Qui si interroga data/version.json del
 * sito pubblico finché non riporta la versione appena pubblicata.
 */
export async function verificaOnline(origin, versione, { tentativi = 10, attesa = 6000, onTentativo } = {}) {
  const base = String(origin || '').replace(/\/$/, '');
  if (!base) return { ok: false, motivo: 'nessun indirizzo pubblico configurato' };

  for (let i = 1; i <= tentativi; i++) {
    onTentativo?.(i, tentativi);
    try {
      const r = await fetch(`${base}/data/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (r.ok) {
        const v = await r.json();
        if (String(v.v) === String(versione)) return { ok: true, tentativi: i };
      }
    } catch { /* ancora in costruzione, o CORS: si riprova */ }
    if (i < tentativi) await new Promise((r) => setTimeout(r, attesa));
  }
  return { ok: false, motivo: 'non ancora confermato' };
}

/* ---- il pacchetto di file --------------------------------------------- */

/**
 * Compone i file di una pubblicazione del catalogo.
 * Deve restare una funzione pura: è la parte che i test possono leggere.
 */
export function pacchetto({ products, config, categories, xtool, info, foto = [], versione = Date.now(), oggi }) {
  const files = {};
  const json = (o) => `${JSON.stringify(o, null, 1)}\n`;

  files['data/products.json'] = { text: json(products.map(({ __generated, ...r }) => ({ ...r, __generated: false }))) };
  files['data/version.json'] = {
    text: `${JSON.stringify({
      v: versione,
      products: products.filter((p) => p.migrationStatus !== 'archived').length,
      updated: (oggi || new Date().toISOString().slice(0, 10))
    }, null, 2)}\n`
  };
  files['sitemap.xml'] = { text: sitemapXml({ config, products, categories, xtool, info }, oggi) };

  for (const f of foto) files[f.path] = { b64: f.b64 };
  return files;
}
