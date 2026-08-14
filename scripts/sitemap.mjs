/* Sitemap generata dalle stesse pagine che il generatore scrive: se le due
   liste divergono, Google riceve indirizzi che non esistono o non riceve
   pagine che esistono. Nascendo dalla stessa sorgente non può succedere. */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'node:fs/promises';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(await readFile(join(RADICE,'data','config.json'),'utf8'));
const base = (cfg.seo && cfg.seo.dominio || '').replace(/\/+$/,'');
const VERIFICA = process.argv.includes('--verifica');

const percorsi = [];
for await (const f of glob('**/index.html', { cwd: RADICE, exclude: ['node_modules/**'] })){
  percorsi.push('/' + f.replace(/index\.html$/,'').replace(/\\/g,'/'));
}
percorsi.sort();

const oggi = new Date().toISOString().slice(0,10);
const priorita = p => p === '/' ? '1.0'
  : (p.split('/').filter(Boolean).length === 1 ? '0.8' : '0.6');

const out = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${percorsi.map(p => `  <url>
    <loc>${base}${p}</loc>
    <lastmod>${oggi}</lastmod>
    <priority>${priorita(p)}</priority>
  </url>`).join('\n')}
</urlset>
`;

const file = join(RADICE,'sitemap.xml');
if(VERIFICA){
  const attuale = existsSync(file) ? await readFile(file,'utf8') : '';
  const norm = s => s.replace(/<lastmod>[^<]*<\/lastmod>/g,'');
  if(norm(attuale) !== norm(out)){
    console.log('  ✖ sitemap.xml non è allineata alle pagine. Esegui: node scripts/sitemap.mjs');
    process.exit(1);
  }
  console.log(`  ✔ sitemap allineata — ${percorsi.length} indirizzi.`); process.exit(0);
}
await writeFile(file, out);
await writeFile(join(RADICE,'robots.txt'),
`User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`);
console.log(`  ✔ sitemap.xml — ${percorsi.length} indirizzi puliti`);
if(!base) console.log('  ⚠ seo.dominio vuoto: la sitemap contiene percorsi relativi e Google la rifiuterà.');
