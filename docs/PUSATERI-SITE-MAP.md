# PUSATERI SITE MAP → INGLY DESIGN

> **Documento di riferimento — PHASE 2**
> Mappa della struttura informativa del sito di riferimento `https://www.pusaterimaker.it/`
> e sua traduzione nell'architettura **INGLY DESIGN**.

```text
PUSATERI MAKER
      ↓
 INGLY DESIGN
```

---

## 0. NOTA METODOLOGICA — COME È STATA COSTRUITA QUESTA MAPPA

**Importante e da leggere prima di tutto il resto.**

L'ambiente di esecuzione di questo progetto applica una *network egress policy*
che **blocca il dominio `www.pusaterimaker.it`**. Il tentativo di crawling diretto
ha restituito:

```text
curl  https://www.pusaterimaker.it/sitemap_index.xml
      → HTTP 403 — request blocked: no rule allows host "www.pusaterimaker.it"

WebFetch https://www.pusaterimaker.it/
      → EGRESS_BLOCKED — blocked by the network egress proxy
```

Non è stato quindi possibile effettuare la scansione automatica pagina-per-pagina
richiesta al punto 4 del master command. La mappa che segue è stata ricostruita da
**tre fonti verificabili**, e ogni voce è etichettata con la propria provenienza:

| Sigla | Fonte | Affidabilità |
| ----- | ----- | ------------ |
| `[S]` | **Specifica utente** — tassonomia fornita esplicitamente nel master command (§5, §29) | Autoritativa |
| `[R]` | **Ricerca web** — URL reali emersi da motori di ricerca su `pusaterimaker.it` | Verificata (URL reale) |
| `[I]` | **Inferenza** — struttura dedotta per coerenza con `[S]` e `[R]` | Da confermare |

**Conseguenza operativa:** le voci `[I]` e ogni conteggio prodotto non vanno
considerati un inventario reale del sito di riferimento. Il catalogo INGLY nasce
come **struttura completa con prodotti propri**, non come copia di un inventario
altrui — vedi `PRODUCT-MIGRATION.md`.

**Per completare la scansione reale** servono, in alternativa:
1. l'abilitazione del dominio nella network policy dell'environment, oppure
2. un export della sitemap (`sitemap_index.xml`) fornito manualmente, oppure
3. l'esecuzione del crawler in locale.

Lo script `scripts/crawl-reference.mjs` è già predisposto per (1) e (3): quando il
dominio diventa raggiungibile, produce `docs/generated/reference-crawl.json`
senza altre modifiche al progetto.

---

## 1. URL REALI RILEVATI `[R]`

URL confermati da ricerca pubblica. Costituiscono la prova della *forma* della
struttura (pagine-indice "lista completa", categorie WP, pagine prodotto flat).

### Pagine indice di categoria
| URL | Ruolo |
| --- | ----- |
| `/porta-menu-lista-completa/` | Indice categoria Portamenù |
| `/tavola-cucina-lista-completa/` | Indice categoria Tavola & Cucina |
| `/wood-design-lista-completa/` | Indice categoria Wood Art & Design |
| `/per-la-casa/` | Indice categoria Casa |
| `/insegne-di-legno-2/` | Indice Insegne & Targhe |
| `/insegne-di-legno-interni-ed-esterni/` | Sotto-indice insegne |
| `/giocattoli-di-legno/` | Indice Giocattoli (PusaToys) |
| `/le-nuove-creazioni-pusateri-maker/` | Novità / nuovi arrivi |

### Pagine istituzionali
| URL | Ruolo |
| --- | ----- |
| `/pusateri-maker-artigiano-creativo-legno/` | Chi Sono |
| `/portfolio-clienti/` | Portfolio clienti |
| `/contattami-pusateri-maker/` | Contatti |
| `/servizio-realizzazione-prototipo/` | Servizio prototipazione |

### Tassonomia WordPress
| URL | Ruolo |
| --- | ----- |
| `/category/oggettistica-di-legno/segnaletica-per-la-ristorazione/` | Categoria annidata a 2 livelli |

### Esempi di pagina prodotto (slug flat, senza prefisso categoria)
```text
/sperone-portamenu-in-legno-per-buste-a4/
/portamenu-di-legno-liberta/
/identitas-cartellini-identificativi-legno-incisi-personalizzati/
/nassa-cassettina-in-legno-ad-incastro-personalizzabile/
/giostrina-artigianale-in-legno-arcoiris/
/gettone-di-benvenuto-personalizzato-approdo/
/targa-laminato-plastico-bb-personalizzata/
/totem-informativo-da-tavolo-personalizzato-bussola/
/dittico-scirocco-portatovaglioli-bar-doppia-estrazione/
/porta-spezie-in-fusione/
/lettere-intagliate-legno-artigianali/
```

**Pattern rilevato — prodotti con nome proprio.** Ogni prodotto ha un *nome
battesimale* (Sperone, Libertà, Nassa, Arcoiris, Approdo, Bussola, Scirocco,
In-Fusione, Identitas) accanto alla descrizione funzionale.

> **Decisione INGLY:** il *pattern* (nome proprio + descrittore funzionale) è una
> convenzione editoriale e viene adottato. I *nomi specifici* appartengono al
> progetto di riferimento e **non** vengono riutilizzati: INGLY usa una propria
> nomenclatura di matrice siciliana/mediterranea. Vedi `MIGRATION-MAP.md §4`.

---

## 2. ARCHITETTURA INFORMATIVA RILEVATA

```text
HOME
├── CATALOGO CREAZIONI            [S] — mega-lista categorie
│   ├── Portamenù                 [S][R]
│   ├── Tavola & Cucina           [S][R]
│   ├── Wood Art & Design         [S][R]
│   ├── Oggettistica & Complementi[S]
│   ├── Targhe & Insegne          [S][R]
│   ├── Gadget                    [S]
│   ├── Per la casa               [S][R]
│   ├── Giocattoli (PusaToys)     [S][R]
│   ├── Automata                  [S]
│   ├── PusaTeck (tecnologia)     [S]
│   ├── Carta & Cartone           [S]
│   ├── Plexi & Metal             [S]
│   └── Eventi & Fiere            [S]
├── CHI SONO                      [S][R]
├── MATERIALI & TECNICHE          [S]
├── COME ACQUISTARE               [S]
├── PORTFOLIO CLIENTI             [R]
└── CONTATTAMI                    [S][R]
```

### Osservazioni strutturali

| # | Osservazione | Impatto sulla ricostruzione INGLY |
| - | ------------ | --------------------------------- |
| 1 | Menu principale a **4 voci** + un catalogo molto largo appeso alla prima | INGLY adotta un **mega-menu** a colonne con raggruppamento per *destinazione d'uso*, non solo per oggetto |
| 2 | Il menu di riferimento espone **~50 voci piatte** sotto Catalogo | INGLY raggruppa in **13 categorie + 11 collezioni d'uso** (Ristorazione, Casa, Regali, Aziendale, Eventi, Wedding, Turismo, Sicilia, Gadget, Tecnologia, Custom) |
| 3 | URL prodotto **flat** (`/nome-prodotto/`), senza gerarchia | INGLY usa URL **gerarchici e parlanti**: `/creazioni/<categoria>/<slug>` |
| 4 | Nessuna faccettatura: la scoperta avviene solo per lista | INGLY introduce **filtri** per categoria, materiale, tecnologia, uso, B2B/B2C |
| 5 | Pagine "lista completa" separate dalle categorie WP | INGLY unifica: una categoria = una pagina, con filtri |
| 6 | Forte monomaterialità (legno) | INGLY estende a **15 materiali** e **11 tecnologie** — vedi §12/§13 del master command |
| 7 | Nessun e-commerce: contatto/preventivo | INGLY mantiene il modello **richiesta preventivo**, ma con configuratore guidato in 8 step |

---

## 3. TASSONOMIA COMPLETA DA PRESERVARE `[S]`

Fonte autoritativa: master command §5. Questa è la struttura che il nuovo catalogo
**deve poter rappresentare integralmente**.

### 3.1 Portamenù → *Soluzioni Menu*
Portamenù catalogo completo · meccanismi ad anelli · meccanismi a vite ·
meccanismi a pinza · espositori da tavolo · QR · NFC · formato A4 · formato A5 ·
formati personalizzati

### 3.2 Tavola & Cucina
Apribottiglie · segnatavoli · segnaposto · poggia-posate · poggia-bacchette ·
porta conto · porta resto · portatovaglioli · porta zucchero · sottobicchieri ·
vassoi · menage · taglieri

### 3.3 Wood Art & Design
Cassette · cofanetti · porta biglietti da visita · espositori · QR · NFC ·
creazioni NFC · targhe · segnaletica · matrimoni · eventi

### 3.4 Oggettistica & Complementi d'Arredo
Catalogo completo da costruire.

### 3.5 Targhe & Insegne
Catalogo completo da costruire.

### 3.6 Gadget
Gadget di legno · calamite · portachiavi · targhe sagomate · altri gadget

### 3.7 Casa
Catalogo completo da costruire.

### 3.8 Giocattoli → *INGLY Kids*
Sezione dedicata.

### 3.9 Automata → *Arte & Movimento*
Sezione dedicata.

### 3.10 Tecnologia → *INGLY Tech*
QR · NFC · prodotti tecnologici

### 3.11 Carta & Cartone → *Carta & Packaging*

### 3.12 Plexi & Metal → *Plexi & Metallo*

### 3.13 Eventi & Fiere → *Eventi & B2B*

---

## 4. STRUTTURA URL — CONFRONTO

| Riferimento | INGLY DESIGN |
| ----------- | ------------ |
| `/porta-menu-lista-completa/` | `/creazioni/soluzioni-menu` |
| `/tavola-cucina-lista-completa/` | `/creazioni/tavola-cucina` |
| `/wood-design-lista-completa/` | `/creazioni/wood-art-design` |
| `/per-la-casa/` | `/creazioni/casa` |
| `/insegne-di-legno-2/` | `/creazioni/targhe-insegne` |
| `/giocattoli-di-legno/` | `/creazioni/kids` |
| `/category/oggettistica-di-legno/segnaletica-per-la-ristorazione/` | `/creazioni/targhe-insegne?uso=ristorazione` |
| `/nome-prodotto/` (flat) | `/creazioni/<categoria>/<slug>` (gerarchico) |
| `/pusateri-maker-artigiano-creativo-legno/` | `/chi-sono` |
| `/portfolio-clienti/` | `/portfolio` |
| `/contattami-pusateri-maker/` | `/contatti` |
| — (assente) | `/materiali` |
| — (assente) | `/tecnologie` |
| — (assente) | `/b2b` |
| — (assente) | `/come-acquistare` |

Mappa di redirect completa e machine-readable: `data/migration.json` → `redirects`.

---

## 5. COPERTURA DEL MASTER COMMAND

| Richiesta | Stato | Dove |
| --------- | ----- | ---- |
| Mappa homepage / menu / categorie | Ricostruita `[S][R]` | §2, §3 |
| Sottocategorie e tipologie | Completa `[S]` | §3 |
| Pagine informative e tecniche | Mappate | §2 |
| Chi Sono / Portfolio / Contatti | Mappate `[R]` | §1 |
| Breadcrumb / CTA / footer / nav mobile | Ridisegnate per INGLY | `INGLY-ARCHITECTURE.md` |
| **Inventario prodotti 1:1 del riferimento** | **Non ottenibile** — egress bloccato | §0 |
| Inventario immagini del riferimento | **Non ottenibile** — egress bloccato | §0, `IMAGE-MIGRATION.md` |

---

## 6. PROSSIMI PASSI

1. Sbloccare il dominio o fornire la sitemap → eseguire `scripts/crawl-reference.mjs`
2. Il crawler popola `docs/generated/reference-crawl.json`
3. `scripts/reconcile-catalog.mjs` confronta il crawl con `data/products.json`
   e produce un report di *gap* (categorie o tipologie non ancora coperte)
4. Nessuna riscrittura del sito è necessaria: il catalogo è data-driven

---

*Documento generato in PHASE 2 — INGLY DESIGN / Giuseppe Inglima*
