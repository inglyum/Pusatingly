/* ============ IL GENERATORE DEL SITO ============
   Legge data/*.json e scrive tutte le pagine statiche.
   Nessuna pagina è scritta a mano: cambiare un dato e rilanciare basta.

   `--verifica` non scrive niente e fallisce se le pagine sul disco non
   corrispondono ai dati: è il controllo che in CI impedisce di pubblicare un
   sito disallineato dal proprio contenuto. */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { componi, esc, slug, VOCI } from './pagina.mjs';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERIFICA = process.argv.includes('--verifica');
const leggi = async f => JSON.parse(await readFile(join(RADICE,'data',f), 'utf8'));

const cfg        = await leggi('config.json');
const tecniche   = await leggi('tecniche.json');
const materiali  = await leggi('materiali.json');
const esclusi    = await leggi('materiali-esclusi.json');
const creazioni  = await leggi('creazioni.json');
const processo   = await leggi('processo.json');
const chiSono    = await leggi('chi-sono.json');
const faq        = await leggi('faq.json');

const base = (cfg.seo && cfg.seo.dominio || '').replace(/\/+$/,'');
const pagine = [];
const scrivi = (percorso, html) => pagine.push({ percorso, html });

/* ---------- entità condivise: dichiarate UNA volta e richiamate ovunque ----------
   È la differenza fra «esiste un'azienda» e «esiste un'azienda che offre questo
   servizio»: senza @id un motore legge fatti scollegati. */
const ID_ORG = base + '/#organizzazione';
const ID_PERSONA = base + '/#giuseppe-inglima';

const organizzazione = {
  '@type':'LocalBusiness','@id':ID_ORG,
  name:cfg.marchio, description:cfg.descrizione,
  founder:{'@id':ID_PERSONA}, url:base+'/',
  email:cfg.contatti.email, telephone:cfg.contatti.whatsapp,
  address:{'@type':'PostalAddress',addressLocality:cfg.sede.citta,
    addressRegion:cfg.sede.provincia,addressCountry:cfg.sede.paese},
  areaServed:{'@type':'Country',name:'Italia'},
  sameAs:Object.values(cfg.social||{}).filter(Boolean),
  knowsAbout:tecniche.map(t=>t.n),
};
const persona = {
  '@type':'Person','@id':ID_PERSONA,
  name:cfg.titolare, jobTitle:cfg.ruolo, worksFor:{'@id':ID_ORG},
  knowsAbout:tecniche.map(t=>t.n),
  address:{'@type':'PostalAddress',addressLocality:cfg.sede.citta,addressCountry:cfg.sede.paese},
};
const BASE_SCHEMA = [organizzazione, persona];

const schemaFaq = lista => ({
  '@type':'FAQPage',
  mainEntity: lista.map(f=>({'@type':'Question',name:f.q,
    acceptedAnswer:{'@type':'Answer',text:f.a}}))
});

/* Una descrizione troppo corta è uno spazio sprecato nei risultati di ricerca:
   Google ne mostra fino a ~155 caratteri, e sotto i 70 la riempie da sé
   pescando testo a caso dalla pagina. Qui si compone finché non è utile. */
function descrizione(...pezzi){
  let d = '';
  for(const p of pezzi){
    if(!p) continue;
    const t = String(p).trim().replace(/\s+/g,' ');
    if(!t) continue;
    if(d.length >= 120) break;
    d += (d ? ' ' : '') + (/[.!?]$/.test(t) ? t : t + '.');
  }
  return d.length > 155 ? d.slice(0,152).replace(/[\s,;:—-]+$/,'') + '…' : d;
}

const plurale = (n, uno, molti) => n === 1 ? uno : molti;

const htmlFaq = lista => lista.map(f =>
  `<details><summary>${esc(f.q)}</summary><div class="risposta"><p>${esc(f.a)}</p></div></details>`).join('\n');

const apertura = (occhiello, titolo, sommario, azioni='') => `
<div class="apertura">
  <div class="contenitore">
    <p class="occhiello">${esc(occhiello)}</p>
    <h1>${esc(titolo)}</h1>
    <p class="sommario">${esc(sommario)}</p>
    ${azioni}
  </div>
</div>`;

const AZIONI_PRINCIPALI = `<div class="azioni">
  <a class="btn btn-pieno" href="/contatti/">Chiedi un preventivo</a>
  <a class="btn btn-vuoto" href="/creazioni/">Guarda cosa faccio</a>
</div>`;

/* ================= HOME ================= */
{
  const tecnichePrime = tecniche.slice(0,6);
  const settori = [...new Map(creazioni.map(c=>[c.settore,c.settoreN])).entries()];
  const contenuto = `
${apertura(cfg.ruolo, cfg.claim, cfg.descrizione, AZIONI_PRINCIPALI)}

<section>
  <div class="contenitore">
    <p class="occhiello">Cosa faccio</p>
    <h2>Quattro tecniche che si completano</h2>
    <p class="prosa sommario">La forma la fa il laser, il colore la stampa UV, il metallo la marcatura,
      il tessile la pressa. Insieme coprono lavori che con una macchina sola non si possono nemmeno preventivare.</p>
    <div class="griglia g-3" style="margin-top:2rem">
      ${tecnichePrime.map(t=>`<a class="cella" href="/servizi/${t.id}/">
        <h3>${esc(t.n)}</h3><p>${esc(t.sommario)}</p>
        <span class="freccia">Vedi →</span></a>`).join('')}
    </div>
    <p style="margin-top:1.5rem"><a href="/servizi/">Tutti i servizi →</a></p>
  </div>
</section>

<section>
  <div class="contenitore">
    <p class="occhiello">Catalogo creazioni</p>
    <h2>Per chi lavoro</h2>
    <div class="griglia g-3" style="margin-top:2rem">
      ${settori.map(([id,n])=>{
        const q = creazioni.filter(c=>c.settore===id).length;
        return `<a class="cella" href="/creazioni/${id}/">
          <h3>${esc(n)}</h3><p>${q} ${q===1?'lavorazione':'lavorazioni'}</p>
          <span class="freccia">Vedi →</span></a>`}).join('')}
    </div>
  </div>
</section>

<section>
  <div class="contenitore prosa">
    <p class="occhiello">Come si lavora</p>
    <h2>${esc(processo.titolo)}</h2>
    <p class="sommario">${esc(processo.sommario)}</p>
    <ol class="passi">
      ${processo.passi.slice(0,3).map(p=>`<li class="passo">
        <span class="num">${p.n}</span>
        <div><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p>
        <span class="tempi">${esc(p.tempi)}</span></div></li>`).join('')}
    </ol>
    <p><a href="/come-ordinare/">Tutti e sei i passaggi →</a></p>
  </div>
</section>

<section>
  <div class="contenitore prosa">
    <p class="occhiello">Domande</p>
    <h2>Le più frequenti</h2>
    ${htmlFaq(faq.slice(0,5))}
    <p style="margin-top:1.5rem"><a href="/faq/">Tutte le domande →</a></p>
  </div>
</section>`;

  scrivi('/', componi({ cfg, attiva:null, percorso:'/',
    titolo:`${cfg.marchio} — ${cfg.claim}`,
    descrizione:cfg.descrizione,
    contenuto,
    schema:[...BASE_SCHEMA,
      {'@type':'WebSite','@id':base+'/#sito',name:cfg.marchio,url:base+'/',publisher:{'@id':ID_ORG}},
      schemaFaq(faq.slice(0,5))] }));
}

/* ================= SERVIZI ================= */
{
  const contenuto = `
${apertura('Servizi','Cosa si può fare, e con che tecnica',
  'Ogni tecnica ha un uso in cui è imbattibile e uno in cui è la scelta sbagliata. Qui trovi tutti e due.')}
<section><div class="contenitore">
  <div class="griglia g-2">
    ${tecniche.map(t=>`<a class="cella" href="/servizi/${t.id}/">
      <h3>${esc(t.n)}</h3><p>${esc(t.sommario)}</p>
      <span class="freccia">Come funziona →</span></a>`).join('')}
  </div>
</div></section>`;
  scrivi('/servizi/', componi({ cfg, attiva:'servizi', percorso:'/servizi/',
    titolo:`Servizi di taglio, incisione e stampa — ${cfg.marchio}`,
    descrizione:'Taglio e incisione laser, marcatura metalli, stampa UV, personalizzazione tessile e prototipazione rapida a Cesena.',
    briciolePercorso:[{n:'Servizi',href:'/servizi/'}], contenuto,
    schema:[...BASE_SCHEMA, {'@type':'ItemList',name:'Servizi',
      itemListElement:tecniche.map((t,i)=>({'@type':'ListItem',position:i+1,name:t.n,url:base+'/servizi/'+t.id+'/'}))}] }));

  for(const t of tecniche){
    const usabili = materiali.filter(m => t.materiali.some(x => m.n.toLowerCase().includes(x) || m.id.includes(slug(x))));
    const lavori = creazioni.filter(c => c.tecniche.includes(t.id));
    const contenuto = `
${apertura('Servizio', t.n, t.sommario, AZIONI_PRINCIPALI)}
<section><div class="contenitore prosa">
  <h2>Quando conviene</h2><p>${esc(t.quandoConviene)}</p>
  <h2>I limiti, detti prima</h2><p>${esc(t.limiti)}</p>
  <div class="avviso"><p><strong>Attrezzatura:</strong> ${esc(t.macchina)}</p></div>
</div></section>
${usabili.length?`<section><div class="contenitore">
  <h2>Materiali che si lavorano così</h2>
  <div class="griglia g-3" style="margin-top:1.5rem">
    ${usabili.map(m=>`<a class="cella" href="/materiali/${m.id}/">
      <h3>${esc(m.n)}</h3><p>${esc(m.resa)}</p><span class="freccia">Scheda →</span></a>`).join('')}
  </div></div></section>`:''}
${lavori.length?`<section><div class="contenitore">
  <h2>Cosa ne esce</h2>
  <div class="griglia g-3" style="margin-top:1.5rem">
    ${lavori.slice(0,9).map(c=>`<a class="cella" href="/creazioni/${c.settore}/${c.id}/">
      <h3>${esc(c.n)}</h3><p>${esc(c.settoreN)}</p><span class="freccia">Vedi →</span></a>`).join('')}
  </div></div></section>`:''}`;
    scrivi(`/servizi/${t.id}/`, componi({ cfg, attiva:'servizi', percorso:`/servizi/${t.id}/`,
      titolo:`${t.n} a Cesena — ${cfg.marchio}`,
      descrizione:descrizione(t.sommario, t.quandoConviene),
      briciolePercorso:[{n:'Servizi',href:'/servizi/'},{n:t.n,href:`/servizi/${t.id}/`}],
      contenuto,
      schema:[...BASE_SCHEMA,{'@type':'Service',name:t.n,description:t.sommario,
        provider:{'@id':ID_ORG},areaServed:{'@type':'Country',name:'Italia'},
        serviceType:t.n,url:base+`/servizi/${t.id}/`}] }));
  }
}

/* ================= MATERIALI ================= */
{
  const righe = materiali.map(m=>`<tr>
    <td><a href="/materiali/${m.id}/"><b>${esc(m.n)}</b></a></td>
    <td class="c">${m.taglio?(typeof m.taglio==='string'?esc(m.taglio):'sì'):'—'}</td>
    <td class="c">${m.incisione?'sì':'—'}</td>
    <td class="c">${m.marcatura?'sì':'—'}</td>
    <td class="c">${m.stampaUv?'sì':'—'}</td>
    <td>${esc((m.usiTipici||[]).slice(0,3).join(', '))}</td></tr>`).join('');
  const contenuto = `
${apertura('Materiali & tecniche','Cosa si comporta bene, e cosa no',
  'La tabella dice cosa si può fare su ogni materiale. Le schede dicono come viene, e dove sta la fregatura.')}
<section><div class="contenitore">
  <div class="tabella-scorrevole"><table>
    <thead><tr><th>Materiale</th><th class="c">Taglio</th><th class="c">Incisione</th>
      <th class="c">Marcatura</th><th class="c">Stampa UV</th><th>Usi tipici</th></tr></thead>
    <tbody>${righe}</tbody></table></div>
</div></section>
<section><div class="contenitore prosa">
  <p class="occhiello">Sicurezza</p>
  <h2>${esc(esclusi.titolo)}</h2>
  <p>${esc(esclusi.premessa)}</p>
  <div class="avviso avviso-allarme">
    ${esclusi.materiali.map(m=>`<p><strong>${esc(m.m)}</strong> — ${esc(m.perche)}
      <em>Alternativa: ${esc(m.alternativa)}</em></p>`).join('')}
  </div>
</div></section>`;
  scrivi('/materiali/', componi({ cfg, attiva:'materiali', percorso:'/materiali/',
    titolo:`Materiali e tecniche per taglio e incisione laser — ${cfg.marchio}`,
    descrizione:'Legno, plexiglass, metalli, pelle, vetro, ardesia e tessuti: cosa si taglia, cosa si incide, cosa si stampa, e quali materiali non vanno mai lavorati al laser.',
    briciolePercorso:[{n:'Materiali & Tecniche',href:'/materiali/'}], contenuto,
    schema:[...BASE_SCHEMA] }));

  for(const m of materiali){
    const contenuto = `
${apertura('Materiale', m.n, m.resa, AZIONI_PRINCIPALI)}
<section><div class="contenitore prosa">
  <h2>Come viene</h2><p>${esc(m.resa)}</p>
  <h2>A cosa fare attenzione</h2>
  <div class="avviso"><p>${esc(m.attenzione)}</p></div>
  <h2>Lavorazioni possibili</h2>
  <div class="tabella-scorrevole"><table><tbody>
    <tr><th>Spessori</th><td>${esc(m.spessori)}</td></tr>
    <tr><th>Taglio</th><td>${m.taglio?(typeof m.taglio==='string'?esc(m.taglio):'sì'):'non si taglia'}</td></tr>
    <tr><th>Incisione</th><td>${m.incisione?'sì':'no'}</td></tr>
    <tr><th>Marcatura</th><td>${m.marcatura?'sì':'no'}</td></tr>
    <tr><th>Stampa UV</th><td>${m.stampaUv?'sì':'no'}</td></tr>
  </tbody></table></div>
  <h2>Usi tipici</h2>
  <ul>${(m.usiTipici||[]).map(u=>`<li>${esc(u)}</li>`).join('')}</ul>
</div></section>`;
    scrivi(`/materiali/${m.id}/`, componi({ cfg, attiva:'materiali', percorso:`/materiali/${m.id}/`,
      titolo:`${m.n}: taglio, incisione e stampa — ${cfg.marchio}`,
      descrizione:descrizione(`${m.n}: ${m.resa}`, m.attenzione),
      briciolePercorso:[{n:'Materiali & Tecniche',href:'/materiali/'},{n:m.n,href:`/materiali/${m.id}/`}],
      contenuto, schema:[...BASE_SCHEMA] }));
  }
}

/* ================= CREAZIONI ================= */
{
  const settori = [...new Map(creazioni.map(c=>[c.settore,c.settoreN])).entries()];
  const contenuto = `
${apertura('Catalogo creazioni','Cosa ho già fatto, e rifaccio su misura',
  'Non è un catalogo da cui comprare a scaffale: è l’elenco di quello che so fare, con la lavorazione dichiarata. Da qui si parte per il tuo pezzo.')}
<section><div class="contenitore">
  <div class="griglia g-3">
    ${settori.map(([id,n])=>{
      const q=creazioni.filter(c=>c.settore===id).length;
      return `<a class="cella" href="/creazioni/${id}/"><h3>${esc(n)}</h3>
        <p>${q} ${q===1?'lavorazione':'lavorazioni'}</p><span class="freccia">Vedi →</span></a>`}).join('')}
  </div>
</div></section>`;
  scrivi('/creazioni/', componi({ cfg, attiva:'creazioni', percorso:'/creazioni/',
    titolo:`Catalogo creazioni — ${cfg.marchio}`,
    descrizione:'Tutte le lavorazioni realizzabili: ristoranti e hotel, industria, aziende, matrimoni, bambini, animali, regali. Con la tecnica dichiarata per ognuna.',
    briciolePercorso:[{n:'Catalogo Creazioni',href:'/creazioni/'}], contenuto,
    schema:[...BASE_SCHEMA] }));

  for(const [sid,sn] of settori){
    const lista = creazioni.filter(c=>c.settore===sid);
    const contenuto = `
${apertura('Catalogo', sn, `${lista.length} ${plurale(lista.length,'lavorazione realizzabile','lavorazioni realizzabili')} per questo settore.`, AZIONI_PRINCIPALI)}
<section><div class="contenitore">
  <div class="griglia g-2">
    ${lista.map(c=>`<a class="cella" href="/creazioni/${sid}/${c.id}/">
      <div class="etichette">
        ${c.esclusiva?'<span class="eti eti-laser">più lavorazioni</span>':''}
        ${c.daPezzoSingolo?'<span class="eti eti-ok">da 1 pezzo</span>':`<span class="eti">da ${c.quantitaMinima} pezzi</span>`}
      </div>
      <h3>${esc(c.n)}</h3><p>${esc(c.lavorazione)}</p>
      <span class="freccia">Scheda →</span></a>`).join('')}
  </div>
</div></section>`;
    scrivi(`/creazioni/${sid}/`, componi({ cfg, attiva:'creazioni', percorso:`/creazioni/${sid}/`,
      titolo:`${sn}: lavorazioni personalizzate — ${cfg.marchio}`,
      descrizione:descrizione(
        `${lista.length} ${plurale(lista.length,'lavorazione personalizzata','lavorazioni personalizzate')} per ${sn.toLowerCase()}`,
        lista.slice(0,4).map(c=>c.n.toLowerCase()).join(', '),
        `Preventivo entro 48 ore, produzione a ${cfg.sede.citta}`),
      briciolePercorso:[{n:'Catalogo Creazioni',href:'/creazioni/'},{n:sn,href:`/creazioni/${sid}/`}],
      contenuto, schema:[...BASE_SCHEMA,{'@type':'ItemList',name:sn,
        itemListElement:lista.map((c,i)=>({'@type':'ListItem',position:i+1,name:c.n,url:base+`/creazioni/${sid}/${c.id}/`}))}] }));

    for(const c of lista){
      const tec = c.tecniche.map(id=>tecniche.find(t=>t.id===id)).filter(Boolean);
      const contenuto = `
${apertura(sn, c.n, c.lavorazione, AZIONI_PRINCIPALI)}
<section><div class="contenitore prosa">
  <div class="etichette">
    ${c.esclusiva?'<span class="eti eti-laser">richiede più lavorazioni</span>':''}
    ${c.daPezzoSingolo?'<span class="eti eti-ok">anche un pezzo solo</span>':`<span class="eti eti-ottone">minimo ${c.quantitaMinima} pezzi</span>`}
  </div>
  <h2>Come si fa</h2><p>${esc(c.lavorazione)}</p>
  ${c.nota?`<div class="richiamo"><p>${esc(c.nota)}</p></div>`:''}
  ${c.materiali.length?`<h2>Materiali disponibili</h2><ul>${c.materiali.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
  ${c.personalizzazione.length?`<h2>Cosa si personalizza</h2><ul>${c.personalizzazione.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
  <h2>Prezzo</h2>
  <p>${c.prezzoDa
      ? `Si parte da ${String(c.prezzoDa).replace('.',',')} € a pezzo, e scende con la quantità. Il prezzo esatto dipende da materiale, misura e complessità della grafica: il preventivo scritto arriva entro 48 ore.`
      : 'Si lavora su preventivo: dipende da materiale, misura, quantità e complessità. Risposta entro 48 ore con il prezzo e la data di consegna.'}</p>
</div></section>
${tec.length?`<section><div class="contenitore">
  <h2>Tecniche impiegate</h2>
  <div class="griglia g-2" style="margin-top:1.5rem">
    ${tec.map(t=>`<a class="cella" href="/servizi/${t.id}/"><h3>${esc(t.n)}</h3>
      <p>${esc(t.sommario)}</p><span class="freccia">Come funziona →</span></a>`).join('')}
  </div></div></section>`:''}`;
      scrivi(`/creazioni/${sid}/${c.id}/`, componi({ cfg, attiva:'creazioni',
        percorso:`/creazioni/${sid}/${c.id}/`,
        titolo:`${c.n} personalizzati — ${cfg.marchio}`,
        descrizione:descrizione(
          c.n + ' su misura',
          c.lavorazione,
          c.materiali.length ? 'Materiali: ' + c.materiali.slice(0,3).join(', ') : '',
          c.daPezzoSingolo ? 'Anche un pezzo solo' : `Da ${c.quantitaMinima} pezzi`),
        briciolePercorso:[{n:'Catalogo Creazioni',href:'/creazioni/'},{n:sn,href:`/creazioni/${sid}/`},{n:c.n,href:`/creazioni/${sid}/${c.id}/`}],
        contenuto,
        schema:[...BASE_SCHEMA,{'@type':'Service',name:c.n,description:c.lavorazione,
          provider:{'@id':ID_ORG},areaServed:{'@type':'Country',name:'Italia'},
          url:base+`/creazioni/${sid}/${c.id}/`}] }));
    }
  }
}

/* ================= COME ORDINARE ================= */
{
  const contenuto = `
${apertura('Come si lavora', processo.titolo, processo.sommario)}
<section><div class="contenitore prosa">
  <ol class="passi">
    ${processo.passi.map(p=>`<li class="passo"><span class="num">${p.n}</span>
      <div><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p>
      <span class="tempi">${esc(p.tempi)}</span></div></li>`).join('')}
  </ol>
</div></section>
<section><div class="contenitore prosa">
  <h2>${esc(processo.pagamenti.titolo)}</h2>
  <ul>${processo.pagamenti.voci.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>
  <div class="azioni"><a class="btn btn-pieno" href="/contatti/">Inizia da qui</a></div>
</div></section>`;
  scrivi('/come-ordinare/', componi({ cfg, attiva:'come-ordinare', percorso:'/come-ordinare/',
    titolo:`Come ordinare: dal preventivo alla consegna — ${cfg.marchio}`,
    descrizione:'Sei passaggi con i tempi dichiarati: richiesta, scelta del materiale, preventivo entro 48 ore, prova grafica da approvare, produzione, consegna.',
    briciolePercorso:[{n:'Come ordinare',href:'/come-ordinare/'}], contenuto,
    schema:[...BASE_SCHEMA,{'@type':'HowTo',name:processo.titolo,description:processo.sommario,
      step:processo.passi.map(p=>({'@type':'HowToStep',position:p.n,name:p.t,text:p.d}))}] }));
}

/* ================= CHI SONO ================= */
{
  const contenuto = `
${apertura('Chi sono', chiSono.nome, chiSono.sommario, AZIONI_PRINCIPALI)}
<section><div class="contenitore prosa">
  ${chiSono.racconto.map(p=>`<p>${esc(p)}</p>`).join('')}
</div></section>
<section><div class="contenitore">
  <h2>Come lavoro</h2>
  <div class="griglia g-2" style="margin-top:1.5rem">
    ${chiSono.principi.map(p=>`<div class="cella"><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p></div>`).join('')}
  </div>
</div></section>`;
  scrivi('/chi-sono/', componi({ cfg, attiva:'chi-sono', percorso:'/chi-sono/',
    titolo:`${chiSono.nome} — ${chiSono.ruolo} a ${chiSono.sede}`,
    descrizione:chiSono.sommario,
    briciolePercorso:[{n:'Chi sono',href:'/chi-sono/'}], contenuto,
    schema:[...BASE_SCHEMA,{'@type':'AboutPage',mainEntity:{'@id':ID_PERSONA}}] }));
}

/* ================= FAQ ================= */
{
  const contenuto = `
${apertura('Domande','Quello che mi chiedono più spesso',
  'Risposte vere, compresi i no. Se la tua domanda non c’è, scrivimi: la aggiungo.')}
<section><div class="contenitore prosa">${htmlFaq(faq)}</div></section>`;
  scrivi('/faq/', componi({ cfg, attiva:null, percorso:'/faq/',
    titolo:`Domande frequenti su taglio e incisione laser — ${cfg.marchio}`,
    descrizione:'Si può ordinare un pezzo solo? Quanto costa? Che file serve? Si può incidere il PVC? Le risposte, compresi i no.',
    briciolePercorso:[{n:'Domande frequenti',href:'/faq/'}], contenuto,
    schema:[...BASE_SCHEMA, schemaFaq(faq)] }));
}

/* ================= CONTATTI ================= */
{
  const modulo = cfg.moduli.formspreePreventivo;
  const contenuto = `
${apertura('Contatti','Raccontami cosa ti serve',
  'Va bene anche una foto storta o uno schizzo. Rispondo entro 24 ore lavorative, con il preventivo entro 48.')}
<section><div class="contenitore">
  <div class="griglia g-2">
    <a class="cella" href="https://wa.me/${esc(cfg.contatti.whatsappNumero)}" rel="noopener">
      <h3>WhatsApp</h3><p>${esc(cfg.contatti.whatsapp)} — il modo più veloce, anche per mandare una foto.</p>
      <span class="freccia">Scrivi →</span></a>
    <a class="cella" href="mailto:${esc(cfg.contatti.email)}">
      <h3>Email</h3><p>${esc(cfg.contatti.email)} — per allegati pesanti e file tecnici.</p>
      <span class="freccia">Scrivi →</span></a>
  </div>
</div></section>
<section><div class="contenitore prosa">
  <h2>Modulo preventivo</h2>
  ${modulo ? '' : `<div class="avviso avviso-allarme"><p><strong>Modulo non ancora collegato.</strong>
    Compila <code>moduli.formspreePreventivo</code> in <code>data/config.json</code>, altrimenti le
    richieste inviate da qui non arrivano a nessuno.</p></div>`}
  <form ${modulo?`action="${esc(modulo)}" method="POST"`:''} class="modulo">
    <p><label for="c_nome">Nome e cognome</label><br>
      <input id="c_nome" name="nome" type="text" required autocomplete="name"></p>
    <p><label for="c_email">Email</label><br>
      <input id="c_email" name="email" type="email" required autocomplete="email"></p>
    <p><label for="c_tipo">Sei un privato o un'azienda?</label><br>
      <select id="c_tipo" name="tipo"><option>Privato</option><option>Azienda</option></select></p>
    <p><label for="c_qta">Quanti pezzi ti servono?</label><br>
      <input id="c_qta" name="quantita" type="text" placeholder="anche «non lo so ancora»"></p>
    <p><label for="c_data">Per quando?</label><br>
      <input id="c_data" name="data" type="text" placeholder="es. entro fine mese"></p>
    <p><label for="c_msg">Cosa ti serve</label><br>
      <textarea id="c_msg" name="messaggio" rows="6" required
        placeholder="Descrivi il pezzo, l'uso e il materiale se ce l'hai in mente."></textarea></p>
    <p><button class="btn btn-pieno" type="submit"${modulo?'':' disabled'}>Invia la richiesta</button></p>
  </form>
</div></section>`;
  scrivi('/contatti/', componi({ cfg, attiva:'contatti', percorso:'/contatti/',
    titolo:`Contatti e preventivi — ${cfg.marchio}, Cesena`,
    descrizione:`Scrivi a ${cfg.titolare} per un preventivo: WhatsApp, email o modulo. Risposta entro 24 ore, preventivo entro 48.`,
    briciolePercorso:[{n:'Contatti',href:'/contatti/'}], contenuto,
    schema:[...BASE_SCHEMA,{'@type':'ContactPage',mainEntity:{'@id':ID_ORG}}] }));
}

/* ================= SCRITTURA / VERIFICA ================= */
let diverse = 0;
for(const p of pagine){
  const file = join(RADICE, p.percorso === '/' ? 'index.html' : p.percorso.replace(/^\/|\/$/g,'') + '/index.html');
  if(VERIFICA){
    const attuale = existsSync(file) ? await readFile(file,'utf8') : null;
    if(attuale !== p.html){ diverse++; if(diverse<=5) console.log('  ✖ disallineata:', p.percorso) }
  } else {
    await mkdir(dirname(file), { recursive:true });
    await writeFile(file, p.html);
  }
}

if(VERIFICA){
  if(diverse){ console.log(`\n  ✖ ${diverse} pagine non corrispondono ai dati. Esegui: node scripts/genera.mjs`); process.exit(1) }
  console.log(`  ✔ ${pagine.length} pagine allineate ai dati.`); process.exit(0);
}

console.log(`  ✔ ${pagine.length} pagine generate`);
console.log(`    servizi ${tecniche.length} · materiali ${materiali.length} · creazioni ${creazioni.length}`);
if(!base) console.log('  ⚠ seo.dominio vuoto: canonici e dati strutturati sono incompleti finché non lo compili.');

export { pagine };
