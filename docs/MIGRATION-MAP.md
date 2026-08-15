# MIGRATION MAP — PUSATERI → INGLY DESIGN

> **PHASE 2 — fonte di verità per la corrispondenza delle sezioni.**
> Versione machine-readable: `data/migration.json`.

---

## 1. MAPPA CATEGORIE (da master command §29)

| Pusateri | INGLY DESIGN | Slug INGLY | Stato |
| -------- | ------------ | ---------- | ----- |
| Catalogo Creazioni | Catalogo Creazioni | `/creazioni` | `active` |
| Portamenù | Soluzioni Menu | `/creazioni/soluzioni-menu` | `active` |
| Tavola & Cucina | Tavola & Cucina | `/creazioni/tavola-cucina` | `active` |
| Wood Art & Design | Wood Art & Design | `/creazioni/wood-art-design` | `active` |
| Gadget di legno | Gadget & Personalizzati | `/creazioni/gadget` | `active` |
| Targhe & Insegne | Targhe & Insegne | `/creazioni/targhe-insegne` | `active` |
| Per la casa | Casa & Arredamento | `/creazioni/casa` | `active` |
| PusaToys | INGLY Kids | `/creazioni/kids` | `active` |
| Automata | Arte & Movimento | `/creazioni/arte-movimento` | `active` |
| PusaTeck | INGLY Tech | `/creazioni/tech` | `active` |
| Carta & Cartone | Carta & Packaging | `/creazioni/carta-packaging` | `active` |
| Plexi & Metal | Plexi & Metallo | `/creazioni/plexi-metallo` | `active` |
| Eventi & Fiere | Eventi & B2B | `/creazioni/eventi` | `active` |
| Oggettistica & Complementi | Oggettistica & Complementi | `/creazioni/oggettistica` | `active` |
| Chi Sono | Giuseppe Inglima | `/chi-sono` | `active` |
| Materiali | Materiali INGLY | `/materiali` | `active` |
| Tecniche | Tecnologie & Tecniche | `/tecnologie` | `active` |
| Come acquistare | Come acquistare | `/come-acquistare` | `active` |
| Contattami | Contattami | `/contatti` | `active` |
| Portfolio clienti | Portfolio | `/portfolio` | `active` |

**Regola §29 rispettata:** nessuna categoria del riferimento è stata eliminata.
Tutte le 13 macro-categorie di prodotto esistono nel catalogo INGLY (più il
contenitore *Catalogo Creazioni* e le 6 pagine istituzionali). Prima migrare, poi
migliorare, poi sostituire.

---

## 2. ESTENSIONI INGLY (non presenti nel riferimento)

Aggiunte richieste dal master command §12, §13, §25, §26.

| Nuova sezione | Slug | Motivazione |
| ------------- | ---- | ----------- |
| INGLY Business (B2B) | `/b2b` | §26 — sezione strategica |
| Materiali (15 schede) | `/materiali` | §12 — superare la monomaterialità legno |
| Tecnologie (11 schede) | `/tecnologie` | §13 — laser CO₂/MOPA/fibra, UV, DTF, 3D |
| Collezioni d'uso | `/creazioni?uso=<slug>` | §25 — mega-menu per destinazione |
| Processo in 8 step | `/come-acquistare` | §17 |

### Collezioni d'uso (mega-menu §25)
`ristorazione` · `casa` · `regali` · `aziendale` · `eventi` · `wedding` ·
`turismo` · `sicilia` · `gadget` · `tecnologia` · `custom`

Le collezioni sono **viste trasversali** sul catalogo (tag `uses[]` sul prodotto),
non categorie duplicate. Un portamenù A4 appartiene alla categoria
`soluzioni-menu` e alle collezioni `ristorazione` + `aziendale`.

---

## 3. MAPPA BRAND E PERSONE

| Riferimento | INGLY DESIGN |
| ----------- | ------------ |
| Pusateri Maker | **INGLY DESIGN** |
| Alessio Pusateri | **Giuseppe Inglima** |
| "il legno che parla" | *(payoff proprio INGLY — vedi Design System §1)* |
| "concept handcraft" | *(posizionamento proprio INGLY)* |

### ⚠️ VINCOLO NON NEGOZIABILE (master command §8)

> *"NON attribuire a Giuseppe esperienze, clienti, lavori o dichiarazioni
> appartenenti ad Alessio Pusateri."*

Applicazione operativa nel progetto:

| Elemento | Trattamento |
| -------- | ----------- |
| Struttura narrativa (quali sezioni, in che ordine) | **Riusata** — è un modello editoriale |
| Biografia, date, aneddoti | **Riscritti da zero** per Giuseppe Inglima |
| Clienti, referenze, numeri, recensioni | **Non importati.** Il portfolio nasce vuoto e viene popolato con lavori reali INGLY |
| Payoff, slogan, testi di marca | **Originali INGLY** |
| Nomi propri di prodotto (Sperone, Nassa, Scirocco…) | **Non riutilizzati.** Nomenclatura INGLY autonoma |
| Descrizioni prodotto | **Originali**, scritte per INGLY |

I contatori della homepage (`pezzi`, `clienti`, `rating`) sono in
`data/config.json` con valori dichiarati `null` finché Giuseppe non fornisce dati
reali: il front-end **nasconde** i contatori non valorizzati invece di mostrare
numeri inventati. Vedi `assets/js/sections.js` → `renderStats()`.

---

## 4. NOMENCLATURA PRODOTTO INGLY

Il *pattern* rilevato nel riferimento (nome proprio + descrittore funzionale) è
efficace e viene adottato. Il *vocabolario* è nuovo.

```text
PATTERN:  <Nome proprio INGLY> — <descrittore funzionale>
ESEMPIO:  Trinacria — portamenù A4 ad anelli in betulla
```

Vocabolario INGLY (matrice siciliana/mediterranea, senza sovrapposizioni con i
nomi del riferimento):

`Trinacria` · `Zagara` · `Kalsa` · `Aretusa` · `Etna` · `Iblea` · `Ortigia` ·
`Cefalù` · `Erice` · `Marzamemi` · `Vucciria` · `Ballarò` · `Salina` ·
`Vulcano` · `Pelagie` · `Selinunte` · `Segesta` · `Mothia` · `Tindari` ·
`Naxos` · `Agave` · `Ficodindia` · `Gelso` · `Carrubo` · `Mandorlo` ·
`Bergamotto` · `Maiolica` · `Terracotta` · `Tufo` · `Basalto` · `Salgemma` ·
`Libeccio` · `Grecale` · `Tramontana` · `Maestrale` · `Ponente` · `Levante`

Verifica di non-collisione: `scripts/validate-data.mjs` → `checkNameCollisions()`
fallisce la build se un nome del riferimento entra nel catalogo.

---

## 5. FASI DI MIGRAZIONE (master command §35)

```text
FASE 1  Struttura/catalogo di riferimento → mappati          ✅ PHASE 1-2
FASE 2  Riferimento → INGLY DESIGN (rinomina, riorganizza)   ✅ PHASE 3
FASE 3  INGLY → premium redesign                              ✅ PHASE 6-8
FASE 4  Catalogo temporaneo popolato                          ✅ PHASE 4
FASE 5  Catalogo temporaneo → prodotti INGLY reali            ⏳ in corso
FASE 6  Catalogo INGLY definitivo                             ⏳ obiettivo
```

**Dove siamo:** FASE 5. La struttura è completa e definitiva; ogni prodotto è
sostituibile singolarmente senza toccare il sito. Vedi `PRODUCT-MIGRATION.md`.

---

## 6. REDIRECT

`data/migration.json` contiene la tabella `redirects[]` in forma
`{ from, to, type }`. È già consumata da `assets/js/router.js`: se qualcuno
arriva con un URL in stile riferimento, viene portato alla pagina INGLY
corrispondente invece di finire in 404.

---

*Documento generato in PHASE 2 — INGLY DESIGN / Giuseppe Inglima*
