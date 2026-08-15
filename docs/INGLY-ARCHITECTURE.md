# INGLY DESIGN — ARCHITETTURA

> **PHASE 6 — architettura tecnica del progetto Pusatingly.**
> (master command §3, §31)

---

## 1. EREDITÀ DAL SISTEMA INGLY ESISTENTE

Il master command §3 chiede di riutilizzare l'architettura già sviluppata nel
sistema INGLY DESIGN, **adattandola**, non copiandola.

### Audit del progetto INGLY fornito

| Aspetto | Rilevato | Decisione |
| ------- | -------- | --------- |
| Framework | Nessuno — HTML/CSS/JS vanilla, ES modules | **Mantenuto** (§31: non cambiare framework senza motivo) |
| Dati | `data/*.json` + fallback `data/*.js`, cache-busting via `version.json` | **Ereditato e potenziato** |
| Robustezza dati | `healData()` — ripara in memoria, non fa crollare il sito | **Ereditato** — principio chiave |
| Routing | SPA a sezioni, `show()` / `go()` | **Riscritto**: URL reali gerarchici (§28) |
| i18n | IT/EN con `data-i18n` | **Ereditato** |
| SEO | Modulo `seo.js`, meta dinamiche | **Ereditato e ampliato** (JSON-LD) |
| CSS | 7 file, custom properties, dark/light | **Riscritto** con palette brand §20 |
| Build | `esbuild`, script Node | **Semplificato** — nessun bundling necessario |
| Governance `.claude/` | agents, rules, standards, checklists | **Adattato** al nuovo progetto |
| `admin.html` | Editor catalogo da browser (247 KB) | **Non portato in questa fase** — vedi §7 |

### Cosa è stato scartato e perché

- **`INGLY-OS-v*-STANDALONE.html` (6.8 MB + 7.2 MB)**: monoliti autoconsistenti,
  incompatibili con un progetto multi-pagina mantenibile. Il loro valore
  (interazioni, animazioni) è stato riletto, non importato.
- **Tema blu/oro del sito esistente**: il master command §20 impone una palette
  diversa (antracite + ciano). Design system nuovo.
- **Catalogo esistente (170 immagini, prodotti INGLY attuali)**: appartiene al
  progetto `Ingly-standalone-html`, che per §2 **non va toccato**. Il nuovo
  catalogo parte dalla tassonomia del master command.

---

## 2. STRUTTURA DEL REPOSITORY

Il master command §31 propone una struttura `src/` + `public/`, tipica di un
progetto con build step, e chiede esplicitamente di **adattarla al framework
effettivamente presente**. Trattandosi di un sito statico servito così com'è, la
mappa è questa:

```text
Pusatingly/
├── index.html                  Shell dell'applicazione
├── 404.html                    Fallback statico
├── manifest.webmanifest        PWA
├── robots.txt · sitemap.xml    SEO
│
├── data/                       ← §31 "src/data" — FONTE DI VERITÀ
│   ├── version.json              cache-busting
│   ├── config.json               brand, contatti, social, statistiche
│   ├── categories.json           14 categorie + sottocategorie
│   ├── products.json             catalogo (schema in PRODUCT-MIGRATION.md)
│   ├── materials.json            15 materiali
│   ├── technologies.json         11 tecnologie
│   ├── portfolio.json            progetti
│   ├── content.json              testi delle pagine editoriali
│   ├── texts.json                i18n IT/EN
│   └── migration.json            mappa categorie, collezioni, redirect
│
├── assets/
│   ├── css/                    ← §31 "src/components|layouts"
│   │   ├── reset.css
│   │   ├── variables.css         design tokens (§20)
│   │   ├── layout.css            griglie, container, header, footer
│   │   ├── components.css        card, bottoni, filtri, mega-menu
│   │   ├── pages.css             stili per pagina
│   │   ├── animations.css
│   │   └── responsive.css
│   │
│   ├── js/                     ← §31 "src/utils|catalog|seo"
│   │   ├── app.js                bootstrap
│   │   ├── data-loader.js        caricamento + healData()
│   │   ├── router.js             routing URL reali + redirect
│   │   ├── catalog.js            filtri, ricerca, ordinamento
│   │   ├── product.js            pagina prodotto
│   │   ├── sections.js           rendering sezioni homepage
│   │   ├── pages.js              pagine editoriali
│   │   ├── nav.js                header, mega-menu, mobile
│   │   ├── seo.js                meta + JSON-LD
│   │   ├── forms.js              form contatti / preventivo
│   │   ├── images.js             lazy load + fallback placeholder
│   │   └── utils.js
│   │
│   └── images/                 ← §31 "public/images"
│       ├── products/ · categories/ · materials/
│       ├── technologies/ · portfolio/ · brand/
│
├── scripts/                    Tooling Node
├── tests/                      Test automatici
└── docs/                       Documentazione — fonte di verità
```

**Corrispondenza con §31:** ogni cartella richiesta esiste, con il nome adatto a
un sito statico. `src/components`, `src/layouts`, `src/sections` diventano moduli
CSS/JS; `src/pages` diventa il router più `content.json`; `public/*` diventa
`assets/images/*`.

---

## 3. FLUSSO APPLICATIVO

```text
index.html
    ↓
app.js  ──→ data-loader.js ──→ data/version.json  (no-store)
                            └→ data/*.json?v=N    (cacheable)
                                    ↓
                              healData()  ripara e segnala
                                    ↓
                              window.INGLY
    ↓
router.js  legge location.pathname
    ↓
    ├── /                        → sections.js       homepage
    ├── /creazioni               → catalog.js        catalogo + filtri
    ├── /creazioni/:cat          → catalog.js        categoria filtrata
    ├── /creazioni/:cat/:slug    → product.js        pagina prodotto
    ├── /materiali · /tecnologie → pages.js
    ├── /portfolio · /chi-sono   → pages.js
    ├── /come-acquistare · /b2b  → pages.js
    ├── /contatti                → forms.js
    └── redirect da migration.json
    ↓
seo.js  aggiorna title, meta, canonical, OG, JSON-LD
```

### Principio ereditato: il sito non deve mai crollare

`healData()` interviene su ogni anomalia dei dati — materiale sconosciuto,
sottocategoria fuori scala, chiave mancante — riparando **in memoria** e
scrivendo un warning in console. Un dato imperfetto degrada la qualità di una
card, non la disponibilità del sito.

---

## 4. ROUTING

URL puliti e gerarchici come da §28. Il sito è servito staticamente, quindi il
router funziona in due modalità:

| Contesto | Modalità | Meccanismo |
| -------- | -------- | ---------- |
| Server con rewrite (Netlify, Vercel, nginx) | History API | `pushState` + rewrite a `index.html` |
| GitHub Pages / apertura locale | Hash fallback | `#/creazioni/…`, redirect da `404.html` |

Il rilevamento è automatico (`router.js` → `detectMode()`). Gli URL prodotti sono
sempre canonici nella forma `/creazioni/...` lato SEO, indipendentemente dalla
modalità di navigazione.

---

## 5. MODELLO DATI — RELAZIONI

```text
categories.json ──┬──< products.json >──┬── materials.json
                  │                     ├── technologies.json
                  │                     └── migration.json (collections/uses)
                  │
portfolio.json ───┴──> products.json (progetti correlati)
```

Integrità referenziale verificata da `scripts/validate-data.mjs` a ogni `npm test`.

---

## 6. PERFORMANCE

| Scelta | Effetto |
| ------ | ------- |
| Zero dipendenze runtime, zero framework | ~35 KB JS totali, non minificati |
| ES modules nativi | nessun bundler, nessun transpile |
| Placeholder SVG ~1 KB | catalogo completo con banda trascurabile |
| `aspect-ratio` ovunque | CLS ≈ 0 |
| Lazy loading immagini | LCP protetto |
| Cache-busting via `version.json` | cache lunga sicura sugli altri asset |
| CSS in cascata senza runtime | nessun FOUC |

Budget in `.lighthousebudget.json`.

---

## 7. ROADMAP TECNICA

| Fase | Intervento |
| ---- | ---------- |
| Ora | Catalogo data-driven, placeholder, 20 route, SEO completa |
| Prossima | Fotografie reali → `status: final` progressivo |
| Poi | Porting dell'admin da browser (eredità `admin.html`) per editare il catalogo senza toccare JSON |
| Futuro | Configuratore prodotto avanzato; preventivo automatico |

---

*Documento generato in PHASE 6 — INGLY DESIGN / Giuseppe Inglima*
