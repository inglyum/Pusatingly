# INGLY DESIGN — sito servizi

Sito di **Giuseppe Inglima**, laboratorio di taglio laser, incisione, stampa UV
e personalizzazione a Cesena.

**69 pagine statiche generate dai dati.** Nessuna dipendenza, nessun build tool,
nessun framework: Node puro.

## Comandi

```bash
npm run genera   # rigenera tutte le pagine + sitemap
npm test         # valida i dati, verifica l'allineamento, 39 controlli sul sito
npm run dev      # server locale
```

## Come si modifica

Si modifica **solo** `data/*.json`, poi `npm run genera`.
Nessuna pagina va scritta a mano: verrebbe sovrascritta.

Aggiungere una lavorazione al catalogo = una voce in `data/creazioni.json`,
e nascono da sole la scheda, il collegamento dal settore, la voce in sitemap
e i dati strutturati.

## Struttura del sito

```
/                          home
/servizi/                  + 8 schede tecnica
/materiali/                + 12 schede materiale, e i materiali che non si lavorano
/creazioni/                + 10 settori + 31 schede lavorazione
/come-ordinare/            i 6 passaggi, con i tempi
/chi-sono/                 Giuseppe Inglima
/faq/                      10 domande, comprese quelle con risposta «no»
/contatti/                 WhatsApp, email, modulo preventivo
```

## Prima di andare online

Tre cose, in `data/config.json`:

1. **`seo.dominio`** — un dominio **diverso** da `inglydesign.it`, che appartiene
   all'altro repository. Due repository che dichiarano lo stesso dominio lo
   staccano da entrambi.
2. **`moduli.formspreePreventivo`** — senza, le richieste inviate dal modulo non
   arrivano a nessuno.
3. **Le fotografie** — `foto: []` è vuoto su tutte e 31 le creazioni.

`npm test` segnala tutte e tre finché non sono a posto.
