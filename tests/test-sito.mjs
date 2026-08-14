/* Il sito è generato: i controlli guardano le pagine SCRITTE SUL DISCO, non una
   simulazione. È l'unico modo di accorgersi che una pagina è rimasta indietro
   rispetto ai dati, o che un collegamento punta a una pagina che non esiste. */
import { readFileSync, existsSync } from 'fs';
import { globSync } from 'fs';

let pass = 0, fail = 0;
const check = (n, c, x='') => { if(c){pass++;console.log('  ✔ '+n)} else {fail++;console.log('  ✖ '+n+(x?' → '+x:''))} };

const pagine = globSync('**/index.html', { exclude:['node_modules/**'] })
  .map(f => ({ percorso:'/'+f.replace(/index\.html$/,''), html:readFileSync(f,'utf8') }));

console.log('\n=== LE PAGINE ESISTONO ===');
check('sono state generate almeno 60 pagine', pagine.length >= 60, pagine.length+'');
for(const attesa of ['/','/servizi/','/materiali/','/creazioni/','/come-ordinare/','/chi-sono/','/contatti/','/faq/'])
  check('esiste ' + attesa, pagine.some(p => p.percorso === attesa));

console.log('\n=== OGNI PAGINA È COMPLETA PER CHI NON ESEGUE JAVASCRIPT ===');
/* GPTBot, ClaudeBot e PerplexityBot non eseguono JavaScript: se il contenuto
   arrivasse dal client, per loro il sito sarebbe bianco. */
for(const p of pagine.slice(0,8)){
  const soloTesto = p.html.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ');
  check(p.percorso + ' ha testo vero nell\'HTML', soloTesto.replace(/\s+/g,' ').trim().length > 400);
}
check('ogni pagina ha un titolo', pagine.every(p => /<title>[^<]{15,}<\/title>/.test(p.html)));
check('ogni pagina ha una descrizione', pagine.every(p => /<meta name="description" content="[^"]{50,}"/.test(p.html)));
check('ogni pagina ha esattamente un h1', pagine.every(p => (p.html.match(/<h1[\s>]/g)||[]).length === 1),
  (pagine.find(p => (p.html.match(/<h1[\s>]/g)||[]).length !== 1)||{}).percorso);
check('nessun titolo supera i 70 caratteri',
  pagine.every(p => (p.html.match(/<title>([^<]*)<\/title>/)||[,''])[1].length <= 70),
  (pagine.find(p => (p.html.match(/<title>([^<]*)<\/title>/)||[,''])[1].length > 70)||{}).percorso);

console.log('\n=== DATI STRUTTURATI ===');
for(const p of pagine){
  const m = p.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if(!m){ check(p.percorso+': ha i dati strutturati', false); break }
}
check('tutte le pagine hanno un grafo JSON-LD valido', pagine.every(p => {
  const m = p.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if(!m) return false;
  try{ const j = JSON.parse(m[1]); return Array.isArray(j['@graph']) && j['@graph'].length > 0 }catch(e){ return false }
}));
/* UNA sola entità azienda, richiamata da tutto il resto: è così che un motore
   capisce che il servizio è offerto da quell'azienda e non sono fatti scollegati. */
check('l\'azienda è dichiarata una volta sola per pagina', pagine.every(p => {
  const j = JSON.parse(p.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  return j['@graph'].filter(e => e['@type'] === 'LocalBusiness').length === 1;
}));
check('la persona è collegata all\'azienda', pagine.every(p => {
  const j = JSON.parse(p.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const per = j['@graph'].find(e => e['@type'] === 'Person');
  return per && per.worksFor;
}));
check('la pagina «come ordinare» dichiara una procedura', (() => {
  const p = pagine.find(x => x.percorso === '/come-ordinare/');
  const j = JSON.parse(p.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  return j['@graph'].some(e => e['@type'] === 'HowTo' && e.step && e.step.length === 6);
})());
check('la pagina delle domande dichiara le FAQ', (() => {
  const p = pagine.find(x => x.percorso === '/faq/');
  const j = JSON.parse(p.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const f = j['@graph'].find(e => e['@type'] === 'FAQPage');
  return f && f.mainEntity.length >= 8;
})());

console.log('\n=== I COLLEGAMENTI PORTANO DA QUALCHE PARTE ===');
/* Un link interno rotto è una pagina che il visitatore non trova e che Google
   segnala. Sono generati, quindi o sono tutti giusti o sono tutti sbagliati. */
const esistenti = new Set(pagine.map(p => p.percorso));
const rotti = [];
for(const p of pagine){
  for(const m of p.html.matchAll(/href="(\/[^"#?]*)"/g)){
    const t = m[1];
    if(t.startsWith('/assets/')) continue;
    if(!esistenti.has(t.endsWith('/') ? t : t + '/')) rotti.push(p.percorso + ' → ' + t);
  }
}
check('nessun collegamento interno rotto', rotti.length === 0, [...new Set(rotti)].slice(0,4).join(' | '));

console.log('\n=== ACCESSIBILITÀ DI BASE ===');
check('la lingua è dichiarata', pagine.every(p => /<html lang="it"/.test(p.html)));
check('ogni pagina ha una navigazione con nome', pagine.every(p => /<nav class="menu" aria-label=/.test(p.html)));
check('il pulsante del tema ha un\'etichetta', pagine.every(p => /id="tema"[^>]*aria-label=|aria-label="[^"]*"[^>]*id="tema"/.test(p.html)));
check('chi chiede meno animazioni le riceve ferme',
  /prefers-reduced-motion/.test(readFileSync('assets/css/sito.css','utf8')));
check('il fuoco da tastiera si vede', /:focus-visible/.test(readFileSync('assets/css/sito.css','utf8')));

console.log('\n=== IL SITO REGGE SENZA JAVASCRIPT ===');
const home = pagine.find(p => p.percorso === '/');
check('il foglio di stile non dipende dal JavaScript', /<link rel="stylesheet"/.test(home.html));
check('il JavaScript è differito, non bloccante', /<script src="\/assets\/js\/sito\.js" defer>/.test(home.html));
/* tutte le voci di menu sono anche nel piede: senza JS il menu del telefono
   non si apre, ma nessuno resta senza navigazione */
check('la navigazione è ripetuta nel piede', ['/servizi/','/materiali/','/creazioni/','/come-ordinare/','/chi-sono/','/contatti/']
  .every(v => home.html.split('<footer')[1].includes('href="'+v+'"')));

console.log('\n=== TEMA CHIARO E SCURO ===');
const css = readFileSync('assets/css/sito.css','utf8');
check('il tema di sistema è rispettato', /@media \(prefers-color-scheme:dark\)/.test(css.replace(/\s+/g,' ').replace(/: /g,':')));
check('la scelta esplicita vince in tutte e due le direzioni',
  /\[data-tema="scuro"\]/.test(css) && /\[data-tema="chiaro"\]/.test(css));
check('nessun colore grezzo nei componenti',
  !/^\s*(color|background(-color)?):\s*#[0-9a-f]{3,8}/im.test(css.slice(css.indexOf('*{box-sizing'))));
check('il tema si applica prima del disegno, senza lampeggio',
  /localStorage\.getItem\("ingly_tema"\)/.test(home.html));

console.log(`\n=========== SITO: ${pass} passati, ${fail} falliti ===========`);
process.exit(fail ? 1 : 0);
