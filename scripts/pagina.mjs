/* ============ IL GUSCIO DI OGNI PAGINA ============
   Una sola funzione costruisce l'HTML completo di qualunque pagina: testata,
   menu, briciole, contenuto, piede, dati strutturati.

   Perché conta: il sito è generato tutto qui, quindi una correzione al menu o
   ai dati strutturati vale per tutte le pagine insieme. E il contenuto è già
   nell'HTML, non arriva col JavaScript — i motori che non lo eseguono
   (GPTBot, ClaudeBot, PerplexityBot) leggono la pagina intera.

   Funzioni pure: nessun DOM, nessun filesystem. */

export const esc = t => String(t == null ? '' : t)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

/* Da testo a indirizzo: usato per i percorsi delle pagine. */
export const slug = t => String(t||'')
  .normalize('NFD').replace(/[̀-ͯ]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

export const VOCI = [
  { id:'servizi',      href:'/servizi/',      n:'Servizi' },
  { id:'materiali',    href:'/materiali/',    n:'Materiali & Tecniche' },
  { id:'creazioni',    href:'/creazioni/',    n:'Catalogo Creazioni' },
  { id:'come-ordinare',href:'/come-ordinare/',n:'Come ordinare' },
  { id:'chi-sono',     href:'/chi-sono/',     n:'Chi sono' },
  { id:'contatti',     href:'/contatti/',     n:'Contatti' },
];

function menu(attiva){
  return VOCI.map(v =>
    `<a href="${v.href}"${v.id===attiva?' aria-current="page"':''}>${esc(v.n)}</a>`).join('');
}

function briciole(percorso, base){
  if(!percorso || !percorso.length) return '';
  const html = ['<a href="/">Home</a>'];
  percorso.forEach((p,i) => {
    html.push('<span>›</span>');
    html.push(i === percorso.length-1
      ? `<span aria-current="page">${esc(p.n)}</span>`
      : `<a href="${p.href}">${esc(p.n)}</a>`);
  });
  const lista = {
    '@type':'BreadcrumbList',
    itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:base+'/'}].concat(
      percorso.map((p,i)=>({'@type':'ListItem',position:i+2,name:p.n,item:base+p.href})))
  };
  return { html:`<nav class="briciole contenitore" aria-label="Percorso">${html.join('')}</nav>`, schema:lista };
}

function piede(cfg){
  const c = cfg.contatti||{};
  return `<footer class="piede">
  <div class="piede-griglia">
    <div>
      <h4>${esc(cfg.marchio)}</h4>
      <p style="font-size:.875rem;color:var(--ink-2);margin:0">${esc(cfg.titolare)}<br>
        ${esc(cfg.sede.citta)} (${esc(cfg.sede.provincia)}) · ${esc(cfg.sede.regione)}</p>
    </div>
    <div><h4>Cosa faccio</h4><ul>
      <li><a href="/servizi/">Servizi</a></li>
      <li><a href="/materiali/">Materiali &amp; tecniche</a></li>
      <li><a href="/creazioni/">Catalogo creazioni</a></li>
    </ul></div>
    <div><h4>Lavorare insieme</h4><ul>
      <li><a href="/come-ordinare/">Come ordinare</a></li>
      <li><a href="/faq/">Domande frequenti</a></li>
      <li><a href="/chi-sono/">Chi sono</a></li>
    </ul></div>
    <div><h4>Scrivimi</h4><ul>
      <li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>
      <li><a href="https://wa.me/${esc(c.whatsappNumero)}" rel="noopener">WhatsApp</a></li>
      <li><a href="/contatti/">Modulo preventivo</a></li>
    </ul></div>
  </div>
  <div class="piede-coda contenitore">
    © ${new Date().getFullYear()} ${esc(cfg.marchio)} — ${esc(cfg.titolare)} · Cesena, Italia
  </div>
</footer>`;
}

/* Costruisce la pagina completa.
   `schema` è un array di entità JSON-LD: vengono unite in un solo grafo, che è
   il modo in cui un motore capisce che quel servizio è offerto da quell'azienda
   e non sono due fatti scollegati. */
export function componi({ cfg, titolo, descrizione, percorso='/', attiva=null,
                          briciolePercorso=null, contenuto, schema=[] }){
  const base = (cfg.seo && cfg.seo.dominio || '').replace(/\/+$/,'');
  const canonico = base + percorso;
  const br = briciolePercorso ? briciole(briciolePercorso, base) : null;
  const grafo = [...schema];
  if(br && br.schema) grafo.push(br.schema);

  return `<!doctype html>
<html lang="it" prefix="og: https://ogp.me/ns#">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titolo)}</title>
<meta name="description" content="${esc(descrizione)}">
${base?`<link rel="canonical" href="${esc(canonico)}">`:'<!-- canonico assente: compilare seo.dominio in data/config.json -->'}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(titolo)}">
<meta property="og:description" content="${esc(descrizione)}">
<meta property="og:locale" content="it_IT">
<meta property="og:site_name" content="${esc(cfg.marchio)}">
${base?`<meta property="og:url" content="${esc(canonico)}">`:''}
<meta name="twitter:card" content="summary_large_image">
<meta name="author" content="${esc(cfg.titolare)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<!-- il tema si applica prima del disegno: niente lampeggio di bianco -->
<script>(function(){try{var t=localStorage.getItem("ingly_tema");
 if(t)document.documentElement.setAttribute("data-tema",t)}catch(e){}})();</script>
<link rel="stylesheet" href="/assets/css/sito.css">
<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':grafo})}</script>
</head>
<body>
<header class="testata">
  <div class="testata-in contenitore">
    <a class="marchio" href="/">${esc(cfg.marchio)}<small>${esc(cfg.titolare)}</small></a>
    <nav class="menu" aria-label="Principale">${menu(attiva)}</nav>
    <button class="tema" id="tema" type="button" aria-label="Cambia tema chiaro o scuro">◐</button>
  </div>
</header>
${br ? `<div class="contenitore">${br.html}</div>` : ''}
<main>
${contenuto}
</main>
${piede(cfg)}
<script src="/assets/js/sito.js" defer></script>
</body>
</html>`;
}
