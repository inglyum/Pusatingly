# INGLY DESIGN — sito servizi
# Giuseppe Inglima · Cesena
# Repository: inglyum/pusatingly

> Documento di contesto caricato all'avvio. In caso di conflitto vince su tutto il resto.

## 1. COS'È QUESTO SITO

Il sito **servizi** di INGLY DESIGN: prototipazione, taglio e incisione laser,
marcatura metalli, stampa UV, personalizzazione tessile. Si lavora su
**preventivo**, non a listino.

È un progetto **separato** da `inglyum/il-sito-ai` (l'ecommerce su inglydesign.it),
che non va toccato. Condividono il marchio e il laboratorio, non il codice.

## 2. ARCHITETTURA

```
data/*.json          ← unica sorgente di verità
   ↓  node scripts/genera.mjs
69 pagine statiche   ← index.html in ogni cartella
   ↓  node scripts/sitemap.mjs
sitemap.xml + robots.txt
```

**Statico-primo, non SPA.** Il contenuto è già nell'HTML: i motori che non
eseguono JavaScript — GPTBot, ClaudeBot, PerplexityBot — leggono la pagina
intera. Il JavaScript fa solo tema e menu del telefono: se non arriva, il sito
funziona lo stesso.

**Nessuna dipendenza.** Node puro, zero pacchetti. `npm install` non serve.

| File | Ruolo |
|---|---|
| `scripts/pagina.mjs` | Il guscio: testata, menu, briciole, piede, JSON-LD. Funzioni pure |
| `scripts/genera.mjs` | Legge i dati, scrive le 69 pagine. `--verifica` non scrive e fallisce se il disco è disallineato |
| `scripts/sitemap.mjs` | Sitemap dalle stesse pagine generate: non possono divergere |
| `scripts/valida.mjs` | Controlla i dati PRIMA che diventino pagine |
| `tests/test-sito.mjs` | Controlla le pagine SCRITTE SUL DISCO, non una simulazione |

## 3. REGOLE

1. **Non si scrive HTML a mano.** Ogni pagina nasce da `data/*.json`. Una
   modifica diretta a un `index.html` viene cancellata alla prossima
   generazione — e il test `--verifica` la segnala prima.

2. **Dopo ogni modifica ai dati: `npm run genera`.** Altrimenti il sito
   pubblicato non corrisponde ai propri dati e la CI blocca il push.

3. **Ogni entità è dichiarata una volta e richiamata con `@id`.** Azienda e
   persona sono un'entità sola per tutto il sito. Duplicarle significa dire a
   Google che esistono due aziende.

4. **Ogni tecnica dichiara i propri limiti.** Il campo `limiti` non è
   facoltativo: è la sezione che fa fidare, e quella che gli assistenti AI
   citano. Un servizio senza limiti dichiarati sembra pubblicità.

5. **La lista dei materiali da non lavorare è pubblica.** `materiali-esclusi.json`
   è contenuto, non una nota interna: chi cerca «si può incidere il PVC» va
   aiutato con una risposta vera.

6. **Mai riprodurre marchi o personaggi di terzi.** Nemmeno ridisegnati:
   è opera derivata. L'alternativa a margine migliore è il pezzo costruito sul
   disegno del cliente.

7. **Nessun colore grezzo nei componenti.** Tutto passa dalle variabili in cima
   a `sito.css`. Chiaro e scuro hanno la stessa cura, e la scelta esplicita
   dell'utente vince sul tema di sistema in entrambe le direzioni.

8. **Un solo dominio per repository.** Questo sito NON può dichiarare
   `inglydesign.it`: quel dominio è di `il-sito-ai`. Due repository che
   dichiarano lo stesso dominio lo staccano da tutti e due.

## 4. PRIMA DI PUBBLICARE

- [ ] `data/config.json` → `seo.dominio` compilato (dominio **diverso** da inglydesign.it)
- [ ] `data/config.json` → `moduli.formspreePreventivo` collegato, altrimenti le richieste si perdono
- [ ] Fotografie nelle creazioni (`foto: []` è vuoto su tutte e 31)
- [ ] `npm test` verde
- [ ] GitHub Pages: Deploy from branch → main → / (root)

## 5. DATI

| File | Contiene |
|---|---|
| `config.json` | Identità, contatti, dominio, moduli |
| `tecniche.json` | 8 tecniche: sommario, quando conviene, **limiti**, macchina, materiali |
| `materiali.json` | 12 materiali: spessori, lavorazioni possibili, resa, **a cosa fare attenzione** |
| `materiali-esclusi.json` | 6 materiali pericolosi, con il perché e l'alternativa |
| `creazioni.json` | 31 lavorazioni: settore, tecniche, materiali, quantità minima, prezzo |
| `processo.json` | I 6 passaggi dell'ordine, con i tempi dichiarati |
| `chi-sono.json` | Racconto e principi di lavoro |
| `faq.json` | 10 domande, **comprese quelle con risposta negativa** |
