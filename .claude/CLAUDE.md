# INGLY DESIGN — Pusatingly · istruzioni di progetto

Sito e catalogo di **INGLY DESIGN** (Giuseppe Inglima).
Statico: HTML + CSS + moduli ES. Nessun framework, nessuna dipendenza runtime.

## Prima di toccare qualcosa

La documentazione in `docs/` è la fonte di verità, non un riassunto a posteriori.
Se una modifica contraddice un documento, si aggiorna prima il documento.

| Cosa stai per fare | Leggi |
| ------------------ | ----- |
| Aggiungere/modificare un prodotto | `docs/PRODUCT-MIGRATION.md` |
| Toccare immagini o asset | `docs/IMAGE-MIGRATION.md` |
| Cambiare colori, spazi, componenti | `docs/INGLY-DESIGN-SYSTEM.md` |
| Cambiare rotte o struttura | `docs/INGLY-ARCHITECTURE.md` |
| Rinominare categorie o sezioni | `docs/MIGRATION-MAP.md` |

## Regole non negoziabili

Verificate da `npm test`. Se un test le blocca, il test ha ragione.

1. **Nessun contenuto di terzi.** Niente foto, biografie, clienti, referenze o
   nomi di prodotto dal sito di riferimento. La struttura editoriale è un
   modello riusabile; il contenuto è originale INGLY.
2. **Nessun numero inventato.** Statistiche, recensioni e conteggi senza fonte
   reale restano `null` e il front-end li nasconde.
3. **Gli `id` prodotto non si riusano mai**, nemmeno dopo l'archiviazione.
4. **Non si cancella: si archivia** (`migrationStatus: "archived"`).
5. **Ogni immagine ha un `alt`** non vuoto.
6. **Nessun URL esterno negli asset.** Tutto vive nel repository.
7. **Il ciano è un accento**, non un colore di riempimento. Budget: ≤5% della
   superficie visibile. Mai sfondi, titoli o bordi generici.
8. **Il progetto `Ingly-standalone-html` non si tocca.**

## Come si lavora

- **I dati comandano.** Nessuna pagina prodotto è scritta a mano: si modifica
  `data/*.json` e il sito segue. Se serve HTML statico per un prodotto,
  probabilmente la soluzione è sbagliata.
- **Il catalogo si rigenera dal seed** (`scripts/seed/catalog-seed.mjs`), non si
  edita `products.json` a mano per aggiungere voci. Gli edit manuali su campi
  esistenti sono preservati da `build-catalog` (merge conservativo).
- **I token stanno in `variables.css`.** Nessun colore o dimensione sciolta
  altrove: `tests/test-css.mjs` fallisce.
- **Il sito non deve mai crollare per un dato imperfetto.** `heal()` in
  `data-loader.js` ripara in memoria e logga. Un materiale sbagliato degrada una
  card, non la disponibilità del sito.

## Comandi

```bash
npm test              # sempre, prima di committare
npm run build         # pipeline completa
npm run add-product   # nuova creazione, guidata e validata
npm run sync-images   # dopo aver aggiunto fotografie
npm run report        # stato migrazione e copertura foto
```

## Stile del codice

- Italiano nei commenti e nei contenuti; inglese negli identificatori.
- Commenti solo dove spiegano **perché**, non cosa fa la riga.
- Tutto ciò che finisce in `innerHTML` passa da `esc()`.
- Le query DOM sono scoped al nodo di montaggio, mai al documento.
