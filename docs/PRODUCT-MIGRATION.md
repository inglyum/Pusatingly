# PRODUCT MIGRATION — SISTEMA DI SOSTITUZIONE PRODOTTI

> **PHASE 3-4 — il meccanismo che permette di sostituire ogni prodotto
> senza rifare il sito.** (master command §6, §7, §10, §30, §32)

---

## 1. PRINCIPIO

Il catalogo è **data-driven al 100%**. Non esiste una sola pagina prodotto scritta
a mano: `data/products.json` è l'unica fonte, il front-end la rende.

```text
data/products.json  →  router  →  catalogo + pagina prodotto + SEO + sitemap
```

Conseguenza: **sostituire un prodotto = modificare un oggetto JSON.**
Nessun HTML da toccare, nessun URL che cambia, nessun link che si rompe.

---

## 2. SCHEMA PRODOTTO

Schema completo, conforme al master command §6 con le estensioni necessarie al
sistema di sostituzione (§30).

```jsonc
{
  "id": "sm-001",                    // stabile e immutabile — mai riusato
  "slug": "trinacria-portamenu-a4-anelli",
  "name": "Trinacria",               // nome proprio INGLY
  "subtitle": "Portamenù A4 ad anelli in betulla",
  "originalName": null,              // riferimento di origine, se esiste
  "category": "soluzioni-menu",
  "subcategory": "meccanismi-ad-anelli",
  "description": "…",                // originale INGLY
  "shortDescription": "…",
  "images": [ /* vedi IMAGE-MIGRATION.md */ ],
  "gallery": [],
  "materials": ["betulla", "mdf"],
  "technologies": ["laser-co2", "incisione"],
  "dimensions": { "larghezza": "23 cm", "altezza": "32 cm", "spessore": "6 mm" },
  "customizable": true,
  "customization": ["logo", "colore", "formato", "meccanismo"],
  "uses": ["ristorazione", "aziendale"],
  "tags": ["portamenu", "a4", "anelli"],
  "audience": "b2b",                 // b2b | b2c | both
  "sourceUrl": null,                 // URL di riferimento, solo tracciabilità
  "migrationStatus": "imported",     // vedi §3
  "replacementStatus": "pending",    // pending | in-progress | done
  "legacyReference": null,           // §30
  "currentProduct": null,            // §30
  "seo": { "title": "…", "description": "…" },
  "featured": false,
  "order": 1
}
```

### Campi del sistema di sostituzione (§30)

```jsonc
{
  "legacyReference": "product-001",   // cosa c'era prima
  "currentProduct": "ingly-product-001", // cosa c'è ora
  "replacementStatus": "replaced"
}
```

Questi tre campi rendono **reversibile** ogni migrazione: la storia non si perde
mai, in linea con §32.

---

## 3. CICLO DI VITA — `migrationStatus`

```text
IMPORTED ──→ REVIEW ──→ REDESIGN ──→ REPLACED ──→ ACTIVE
                 │                                   │
                 └──────────────→ ARCHIVED ←─────────┘
```

| Stato | Significato | Visibile sul sito |
| ----- | ----------- | ----------------- |
| `imported` | Struttura importata, contenuto da lavorare | Sì, con badge interno |
| `review` | In revisione redazionale | Sì |
| `redesign` | Prodotto INGLY in progettazione | Sì |
| `replaced` | Sostituito da prodotto INGLY reale | Sì |
| `active` | Prodotto INGLY definitivo, foto reali | Sì |
| `archived` | Fuori catalogo | **No** — escluso da catalogo, SEO e sitemap |

Il filtro è centralizzato in `assets/js/catalog.js` → `isPublic(product)`.
Cambiare la policy di visibilità è una riga sola.

### Stato attuale del catalogo

Il catalogo iniziale è popolato con prodotti in stato `imported`: struttura,
tipologie, materiali, tecnologie e SEO sono reali e definitivi; **nomi e
descrizioni sono originali INGLY** (non importati dal riferimento), le immagini
sono placeholder generati. Vedi `IMAGE-MIGRATION.md`.

Report live: `npm run report` → `docs/generated/catalog-report.md`.

---

## 4. COME SOSTITUIRE UN PRODOTTO — PROCEDURA

Obiettivo (§10): passare da placeholder a prodotto reale **senza cambiare**
URL, layout, SEO, categoria, struttura o componenti.

### Passo 1 — sostituire l'immagine
```bash
# il nome file è già previsto dal catalogo
cp ~/foto/portamenu.webp assets/images/products/sm-001.webp
```

### Passo 2 — aggiornare il record
```jsonc
{
  "id": "sm-001",                    // ← NON cambia mai
  "slug": "trinacria-portamenu-a4-anelli", // ← NON cambia (o si aggiunge redirect)
  "images": [{
    "src": "assets/images/products/sm-001.webp",
    "alt": "Portamenù A4 in betulla con meccanismo ad anelli",
    "source": "ingly-original",
    "status": "final",               // ← era "placeholder"
    "replacementRequired": false     // ← era true
  }],
  "migrationStatus": "active",       // ← era "imported"
  "replacementStatus": "done",
  "legacyReference": "sm-001-placeholder",
  "currentProduct": "sm-001"
}
```

### Passo 3 — validare
```bash
npm test
```

Fatto. URL identico, SEO identica, catalogo aggiornato, sitemap rigenerata.

---

## 5. AGGIUNGERE UN PRODOTTO NUOVO

```bash
npm run add-product
```
Lo script guida la creazione del record, assegna un `id` libero, genera slug e
placeholder, e valida. In alternativa si aggiunge l'oggetto a mano a
`data/products.json` e si lancia `npm test`.

**Regola sugli id:** progressivi per categoria (`sm-001`, `tc-014`, `gd-007`).
Un id **non viene mai riutilizzato**, nemmeno dopo l'archiviazione: garantisce che
i permalink restino stabili per sempre.

---

## 6. PRODOTTI FUTURI INGLY (master command §11)

Il catalogo è già predisposto per queste linee: i valori sono censiti in
`data/technologies.json` e `data/materials.json` e selezionabili sul prodotto.

**Tecnologie:** laser CO₂ · laser MOPA · laser fibra · UV printing · DTF ·
stampa 3D · incisione · taglio · marcatura · verniciatura · assemblaggio

**Materiali:** legno · MDF · betulla · plexiglass · acrilico · metallo ·
alluminio · acciaio · pelle · carta · cartone · tessuto · PLA · PETG · speciali

**Mercati:** B2B · ristorazione · wedding · corporate · turismo · retail · casa ·
Sicilia

Un prodotto nuovo che usa laser MOPA su alluminio è già rappresentabile oggi:
nessuna modifica al codice.

---

## 7. GARANZIE ANTI-PERDITA (master command §32)

| Rischio | Protezione |
| ------- | ---------- |
| Perdita di un prodotto in migrazione | `id` immutabili + `legacyReference` + storia Git |
| Rottura del catalogo per dato imperfetto | `healData()` ripara in memoria e logga, il sito non crolla |
| Cancellazione accidentale | `archived` invece di `delete`; nulla viene rimosso dal JSON |
| Link rotti dopo rinomina | `data/migration.json` → `redirects[]` gestito dal router |
| Dato non valido in produzione | `npm test` blocca: schema, id duplicati, slug duplicati, riferimenti orfani |
| Regressione non vista | Report di catalogo versionato a ogni modifica |

---

## 8. VALIDAZIONI ATTIVE

`scripts/validate-data.mjs` verifica:

- [x] `id` unici, `slug` unici
- [x] campi obbligatori presenti
- [x] `category` esistente in `categories.json`
- [x] `subcategory` appartenente alla categoria dichiarata
- [x] `materials[]` esistenti in `materials.json`
- [x] `technologies[]` esistenti in `technologies.json`
- [x] `uses[]` esistenti in `migration.json` → `collections`
- [x] `migrationStatus` / `replacementStatus` fra i valori ammessi
- [x] ogni immagine con `alt` non vuoto (accessibilità)
- [x] nessuna collisione con la nomenclatura del riferimento
- [x] SEO title ≤ 60 caratteri, description ≤ 160

---

*Documento generato in PHASE 3 — INGLY DESIGN / Giuseppe Inglima*
