/* Controlla i dati PRIMA che diventino pagine. Un dato incoerente qui produce
   69 pagine sbagliate: è molto più economico fermarlo adesso. */
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
const leggi = async f => JSON.parse(await readFile(join(RADICE,'data',f),'utf8'));

const errori = [], avvisi = [];
const cfg = await leggi('config.json');
const tecniche = await leggi('tecniche.json');
const materiali = await leggi('materiali.json');
const creazioni = await leggi('creazioni.json');
const faq = await leggi('faq.json');

const unici = (lista, nome) => {
  const visti = new Set();
  for(const x of lista){
    if(!x.id) errori.push(`${nome}: una voce non ha id`);
    else if(visti.has(x.id)) errori.push(`${nome}: id ripetuto «${x.id}»`);
    visti.add(x.id);
    if(x.id && !/^[a-z][a-z0-9-]*$/.test(x.id))
      errori.push(`${nome}: l'id «${x.id}» non è utilizzabile in un indirizzo`);
  }
};
unici(tecniche,'tecniche'); unici(materiali,'materiali'); unici(creazioni,'creazioni');

/* ogni creazione deve puntare a tecniche che esistono davvero */
const idTecniche = new Set(tecniche.map(t=>t.id));
for(const c of creazioni)
  for(const t of (c.tecniche||[]))
    if(!idTecniche.has(t)) errori.push(`creazione «${c.id}»: tecnica sconosciuta «${t}»`);

for(const c of creazioni){
  if(!c.settore) errori.push(`creazione «${c.id}»: manca il settore`);
  if(!c.lavorazione) avvisi.push(`creazione «${c.id}»: manca la descrizione della lavorazione`);
  if(!c.foto || !c.foto.length) avvisi.push(`creazione «${c.id}»: nessuna fotografia`);
}
for(const t of tecniche)
  if(!t.limiti) avvisi.push(`tecnica «${t.id}»: manca la sezione sui limiti — è quella che fa fidare`);
for(const m of materiali)
  if(!m.attenzione) avvisi.push(`materiale «${m.id}»: manca «a cosa fare attenzione»`);

/* le cose senza le quali il sito non può funzionare in pubblico */
if(!cfg.seo || !cfg.seo.dominio) avvisi.push('config: seo.dominio vuoto — canonici, sitemap e dati strutturati restano incompleti');
if(!cfg.moduli || !cfg.moduli.formspreePreventivo) avvisi.push('config: modulo preventivo non collegato — le richieste dal sito si perdono');
if(faq.length < 5) avvisi.push('faq: meno di cinque domande — è la pagina che gli assistenti AI citano di più');

console.log(`Controllati: ${tecniche.length} tecniche, ${materiali.length} materiali, ${creazioni.length} creazioni.`);
if(avvisi.length){ console.log('\nDa sistemare quando puoi:'); avvisi.forEach(a=>console.log('  ⚠ '+a)) }
if(errori.length){ console.log('\nBloccanti:'); errori.forEach(e=>console.log('  ✖ '+e)); process.exit(1) }
console.log('\n✅ Dati validi.');
