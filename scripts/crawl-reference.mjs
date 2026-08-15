#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — CRAWLER DEL SITO DI RIFERIMENTO
   ------------------------------------------------------------
   Predisposto per completare la scansione descritta in
   docs/PUSATERI-SITE-MAP.md §0, quando il dominio diventa
   raggiungibile.

   NOTA IMPORTANTE
   Nell'environment in cui il progetto è stato costruito il dominio
   è bloccato dalla network policy:

       curl https://www.pusaterimaker.it/sitemap_index.xml
       → 403 request blocked: no rule allows host

   Questo script NON è mai stato eseguito con successo: è
   infrastruttura pronta, non un risultato già ottenuto.

   Raccoglie SOLO metadati di struttura (URL, title, h1, breadcrumb,
   link interni) per ricostruire la mappa del sito. Non scarica
   immagini né copia testi editoriali: gli asset di terzi non
   entrano nel repository (docs/IMAGE-MIGRATION.md §1).

   Uso:
     node scripts/crawl-reference.mjs [--base https://esempio.it] [--max 400]
   Output:
     docs/generated/reference-crawl.json
   ============================================================ */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 && args[i + 1] ? args[i + 1] : fallback;
};

const BASE = arg('base', 'https://www.pusaterimaker.it');
const MAX = Number(arg('max', 400));
const DELAY = Number(arg('delay', 700)); // cortesia verso il server

const origin = new URL(BASE).origin;
const seen = new Set();
const queue = [`${origin}/`];
const pages = [];
const errors = [];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pick = (html, re) => {
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
};

function internalLinks(html) {
  const out = new Set();
  for (const m of html.matchAll(/href="([^"#?]+)/g)) {
    let href = m[1];
    if (/^(mailto:|tel:|javascript:)/i.test(href)) continue;
    if (/\.(jpe?g|png|gif|webp|svg|pdf|zip|css|js|ico)$/i.test(href)) continue;
    try {
      const url = new URL(href, origin);
      if (url.origin !== origin) continue;
      out.add(url.origin + url.pathname.replace(/\/+$/, '/'));
    } catch { /* href malformato: ignorato */ }
  }
  return [...out];
}

async function crawl() {
  console.log(`\n  Crawl di ${origin} (max ${MAX} pagine)\n`);

  while (queue.length && pages.length < MAX) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);

    let res;
    try {
      res = await fetch(url, {
        headers: { 'User-Agent': 'INGLY-DESIGN-structure-mapper/1.0' },
        redirect: 'follow'
      });
    } catch (e) {
      errors.push({ url, error: e.message });
      // Il blocco di rete è la condizione attesa: si esce subito con
      // un messaggio utile invece di ritentare 400 volte.
      if (/blocked|ENOTFOUND|EAI_AGAIN|403/.test(e.message)) {
        console.error(`  ✗ ${url}\n    ${e.message}`);
        console.error(`\n  Il dominio non è raggiungibile da questo ambiente.`);
        console.error(`  Vedi docs/PUSATERI-SITE-MAP.md §0.\n`);
        break;
      }
      continue;
    }

    if (!res.ok) { errors.push({ url, status: res.status }); continue; }
    if (!(res.headers.get('content-type') || '').includes('text/html')) continue;

    const html = await res.text();

    pages.push({
      url,
      path: new URL(url).pathname,
      title: pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
      h1: pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)?.replace(/<[^>]+>/g, ''),
      description: pick(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i),
      // Solo il conteggio: le immagini di terzi non vengono raccolte né scaricate.
      imageCount: (html.match(/<img\b/gi) || []).length,
      isCategory: /lista-completa|\/category\//.test(url)
    });

    for (const link of internalLinks(html)) {
      if (!seen.has(link)) queue.push(link);
    }

    if (pages.length % 10 === 0) console.log(`  ${pages.length} pagine…`);
    await sleep(DELAY);
  }

  mkdirSync(join(ROOT, 'docs/generated'), { recursive: true });
  writeFileSync(
    join(ROOT, 'docs/generated/reference-crawl.json'),
    `${JSON.stringify({
      base: BASE,
      crawledAt: new Date().toISOString(),
      pageCount: pages.length,
      errorCount: errors.length,
      pages,
      errors
    }, null, 2)}\n`,
    'utf8'
  );

  console.log(`\n  Pagine raccolte: ${pages.length}`);
  console.log(`  Errori:          ${errors.length}`);
  console.log(`  Output:          docs/generated/reference-crawl.json`);
  console.log(`\n  Passo successivo: node scripts/reconcile-catalog.mjs\n`);
}

crawl();
