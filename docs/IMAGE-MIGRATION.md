# IMAGE MIGRATION — SISTEMA ASSET

> **PHASE 5 — gestione delle immagini di catalogo.**
> (master command §9, §10)

---

## 1. POSIZIONE — QUESTA PARTE È FONDAMENTALE

Il master command §9 stabilisce la regola, e questo progetto la applica senza
eccezioni:

> *"NON utilizzare automaticamente fotografie di terzi come asset definitivo se
> non esiste un diritto/licenza/autorizzazione."*

**Decisione operativa: nel repository non entra nessuna fotografia di terzi.**

Non si tratta solo di prudenza legale. Le fotografie di prodotto di un altro
artigiano ritraggono **i suoi oggetti, realizzati dalle sue mani**: pubblicarle
sotto il marchio INGLY DESIGN significherebbe attribuire a Giuseppe Inglima
lavori che non ha fatto — esattamente ciò che §8 vieta.

A questo si aggiunge il vincolo tecnico già documentato in
`PUSATERI-SITE-MAP.md §0`: il dominio di riferimento è **bloccato dalla network
policy**, quindi nessun asset è comunque scaricabile in questo environment.

### Cosa succede quindi

| Master command dice | Applicazione |
| ------------------- | ------------ |
| "Se gli asset possono essere utilizzati legittimamente, importarli" | Condizione non verificata: nessuna licenza, nessuna autorizzazione, host irraggiungibile → **non importati** |
| "Se non possono essere utilizzati: mantenere il riferimento tecnico nel catalogo" | ✅ `sourceUrl` conservato sul prodotto |
| "creare placeholder" | ✅ placeholder SVG generati, brandizzati INGLY |
| "contrassegnare `replacementRequired: true`" | ✅ su ogni immagine placeholder |
| "NON far fallire il catalogo" | ✅ il catalogo è completo e navigabile con i placeholder |
| "predisporre sostituzione 1-click" | ✅ vedi §5 |

Il risultato è che **il sito funziona al 100% oggi** e diventa fotografico man
mano che Giuseppe produce gli scatti reali.

---

## 2. CATENA DI SOSTITUZIONE (master command §9)

```text
source image        →  riferimento tecnico, mai scaricato   (sourceUrl)
migration asset     →  non applicabile in questo progetto
replacement asset   →  placeholder SVG INGLY                (status: placeholder)
final INGLY asset   →  fotografia reale di Giuseppe         (status: final)
```

Il progetto parte direttamente da **replacement asset**, saltando l'importazione
di materiale altrui.

---

## 3. SCHEMA IMMAGINE

Conforme al master command §9:

```jsonc
{
  "src": "assets/images/products/sm-001.svg",
  "alt": "Portamenù A4 in betulla con meccanismo ad anelli",
  "source": "ingly-placeholder",
  "status": "placeholder",
  "replacementRequired": true
}
```

| Campo | Valori | Nota |
| ----- | ------ | ---- |
| `src` | percorso relativo | mai un URL esterno |
| `alt` | testo descrittivo | **obbligatorio non vuoto** — validato, blocca la build |
| `source` | `ingly-placeholder` · `ingly-original` · `licensed` | provenienza |
| `status` | `placeholder` · `temporary` · `final` | stato dell'asset |
| `replacementRequired` | `true` / `false` | pilota il report e il badge admin |

---

## 4. PLACEHOLDER GENERATI

`scripts/generate-placeholders.mjs` produce un SVG per prodotto e per categoria.

Caratteristiche:
- **SVG, non bitmap** → ~1,5 KB l'uno (176 prodotti + 13 categorie = 764 KB in
  totale, meno di una singola fotografia non ottimizzata), nitidi a ogni densità
- deterministici: stesso prodotto = stesso placeholder a ogni rigenerazione
- brandizzati: palette INGLY (antracite + accento ciano), non blocchi grigi
- portano **categoria e nome prodotto** leggibili → il catalogo è comprensibile
  anche prima delle foto
- variazione cromatica per categoria, così la griglia non è monotona
- `aspect-ratio` fisso 4:3 → **nessun layout shift** quando arriva la foto reale

Rigenerazione:
```bash
npm run placeholders
```

---

## 5. SOSTITUZIONE DI UNA FOTO (master command §10)

Il requisito è che l'URL, il layout, la SEO, la categoria, la struttura e i
componenti **non cambino** quando arriva la foto reale.

La sostituzione è **due comandi**:

```bash
cp foto-reale.webp assets/images/products/sm-001.webp
npm run sync-images
```

`sync-images` fa tutto il resto da solo: trova la foto sul disco, aggiorna
`images[0]` (`src`, `source: ingly-original`, `status: final`,
`replacementRequired: false`), promuove `migrationStatus` a `active`,
`replacementStatus` a `done`, e registra `legacyReference`. Le viste
aggiuntive `sm-001-2.webp`, `sm-001-3.webp`… diventano automaticamente
gallery.

Se una foto viene rimossa, lo stesso comando riporta il prodotto al
placeholder invece di lasciare un'immagine rotta.

### Perché non un solo comando

Il front-end potrebbe tentare `<id>.webp` e ricadere sul `.svg` via `onerror`,
rendendo superfluo il secondo comando. È stato provato e **scartato**: finché le
foto non ci sono, ogni card genera una richiesta fallita — su una pagina di
catalogo sono **176 richieste 404 a ogni visita**, con la console piena di
errori e banda sprecata sul mobile.

La sorgente arriva quindi sempre dal dato, e il disallineamento fra disco e dato
si risolve una volta sola in fase di build. È anche l'unico modo perché il
report di copertura del §6 dica il vero.

### Formati consigliati per le foto reali

| Uso | Formato | Dimensione | Note |
| --- | ------- | ---------- | ---- |
| Card catalogo | WebP | 800×600 | qualità 82 |
| Gallery prodotto | WebP | 1600×1200 | qualità 85 |
| Open Graph | JPG | 1200×630 | richiesto dai social |

`aspect-ratio` 4:3 per card e gallery: rispettarlo evita il layout shift.

---

## 6. REPORT DI COPERTURA

```bash
npm run report
```

Genera `docs/generated/image-report.md`:

```text
COPERTURA IMMAGINI INGLY DESIGN
────────────────────────────────
Prodotti totali          148
Con foto reale             0   (0%)
Con placeholder          148   (100%)
Da sostituire            148

Per categoria:
  soluzioni-menu      0/24   ░░░░░░░░░░  0%
  tavola-cucina       0/26   ░░░░░░░░░░  0%
  …
```

È lo strumento con cui si pianifica il lavoro fotografico: si vede subito quale
categoria conviene scattare per prima.

---

## 7. ACCESSIBILITÀ E PERFORMANCE

| Requisito | Implementazione |
| --------- | --------------- |
| `alt` su ogni immagine | Validato in `validate-data.mjs` — build rossa se manca |
| Lazy loading | `loading="lazy"` + `IntersectionObserver` in `assets/js/images.js` |
| Niente layout shift | `width`/`height` espliciti + `aspect-ratio` CSS |
| Decode asincrono | `decoding="async"` |
| Immagine hero | `loading="eager"` + `fetchpriority="high"` |

---

## 8. CHECKLIST PRIMA DI PUBBLICARE UNA FOTO REALE

- [ ] La foto ritrae un oggetto **realizzato da Giuseppe Inglima**
- [ ] Formato WebP, 4:3, ≤ 200 KB
- [ ] Nome file = `<id-prodotto>.webp`
- [ ] `alt` descrittivo scritto (non il nome del file)
- [ ] `status` → `final`, `replacementRequired` → `false`
- [ ] `npm test` verde

---

*Documento generato in PHASE 5 — INGLY DESIGN / Giuseppe Inglima*
