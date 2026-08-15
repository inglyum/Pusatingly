# INGLY DESIGN SYSTEM

> **PHASE 7 — sistema di design del nuovo sito.**
> (master command §19, §20, §21, §23, §24, §25)

---

## 1. POSIZIONAMENTO

Il sito **non deve sembrare WordPress/WooCommerce** (§19). Deve leggersi come:

> **Premium Italian Design Studio**

Riferimenti estetici dichiarati: luxury editorial · Italian craftsmanship ·
contemporary design · premium product catalog · modern atelier · technology studio.

### Come si traduce in decisioni concrete

| Stilema da evitare (WordPress) | Scelta INGLY |
| ------------------------------ | ------------ |
| Sidebar, widget, breadcrumb generici | Layout editoriale a griglia larga, breadcrumb minimale |
| Card con bordo + ombra + badge colorati | Card piatte, separate da spazio e da una hairline |
| Tante icone colorate | Iconografia monocroma, accento solo dove serve |
| Titoli grandi e grassi ovunque | Gerarchia tipografica per *scala e spazio*, non per peso |
| Slider automatici | Composizioni statiche, movimento solo su intento |
| Colore come decorazione | Colore come **segnale**: il ciano indica ciò che è attivo |

### Identità verbale

- **Brand:** INGLY DESIGN
- **Persona:** Giuseppe Inglima — Designer & Maker
- **Payoff:** *Progetto, materia, precisione.*
- **Tono:** asciutto, tecnico, concreto. Si parla di materiali, tolleranze,
  processi. Nessuna enfasi commerciale, nessun superlativo.

---

## 2. COLORE

Palette da master command §20.

```css
--ingly-anthracite: #1F2328;   /* superficie primaria */
--ingly-dark:       #2E3238;   /* superficie elevata */
--ingly-white:      #FFFFFF;   /* testo su scuro, superficie chiara */
--ingly-cyan:       #00E6D2;   /* ACCENTO — schermo */
--ingly-cyan-print: #00CFC0;   /* ACCENTO — stampa */
```

### Regola dell'accento — non negoziabile

> *"Il ciano deve essere un ACCENTO. Non colorare tutto di ciano."* (§20)

Applicazione:

| Il ciano **si usa** per | Il ciano **non si usa** per |
| ----------------------- | --------------------------- |
| Stato attivo (link corrente, filtro selezionato) | Sfondi di sezione |
| Un solo CTA primario per schermata | Titoli |
| Focus ring (accessibilità) | Bordi delle card |
| Dettagli di misura e dato tecnico | Testo corrente |
| Underline animato in hover | Icone decorative |

**Budget cromatico:** ≤ 5% della superficie visibile di qualunque schermata.
Verificato a occhio in review; regola scritta in `.claude/rules/non-negotiable.md`.

### Scala di grigi derivata

```css
--surface-0: #16191D;   /* fondo pagina */
--surface-1: #1F2328;   /* antracite — sezioni */
--surface-2: #2E3238;   /* card, elevazione */
--surface-3: #3A3F46;   /* hover, bordi forti */
--line:      rgba(255,255,255,.09);
--line-soft: rgba(255,255,255,.05);
--text-1:    #FFFFFF;   /* titoli */
--text-2:    #C6CBD2;   /* corpo */
--text-3:    #8A9099;   /* meta, didascalie */
```

### Modalità chiara

Attivata da `<html data-mode="light">`. Solo i token cambiano: **nessun
componente viene riscritto** (principio ereditato dal sistema INGLY esistente).

```css
--surface-0: #FFFFFF;  --surface-1: #F7F8F9;  --surface-2: #FFFFFF;
--text-1: #1F2328;     --text-2: #4A5058;     --text-3: #767C85;
--accent:  #00A99B;    /* ciano scurito per contrasto AA su bianco */
```

> **Nota di contrasto:** `#00E6D2` su bianco dà un rapporto di ~1.7:1, sotto
> soglia. In modalità chiara l'accento diventa `#00A99B` (4.6:1). Il ciano
> brillante resta riservato al fondo scuro, dove rende al meglio.

---

## 3. TIPOGRAFIA

Scala su rapporto 1.25 (major third), fluida con `clamp()`.

```css
--fs-2xs: .6875rem;   /* 11px  — occhielli, chip */
--fs-xs:  .75rem;     /* 12px  — meta, didascalie */
--fs-sm:  .875rem;    /* 14px  — testo secondario */
--fs-md:  1rem;       /* 16px  — corpo */
--fs-lg:  1.25rem;    /* 20px  — sottotitoli */
--fs-xl:  1.5625rem;  /* 25px  — titoli card */
--fs-2xl: clamp(1.65rem, 3vw,   1.953rem);
--fs-3xl: clamp(2rem,    4.2vw, 2.441rem);
--fs-4xl: clamp(2.4rem,  6vw,   3.815rem);  /* hero */
```

Font: stack di sistema. Nessun webfont caricato — è una scelta di performance e
di sobrietà (niente richieste bloccanti, nessun FOIT).

```css
--font-display: 'Inter Tight', 'Inter', -apple-system, BlinkMacSystemFont,
                'Segoe UI', system-ui, sans-serif;
--font-body:    system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
--font-mono:    ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
```

Il monospace ha un ruolo preciso: **dati tecnici** (misure, codici, tolleranze).
È ciò che dà al sito il carattere da studio tecnico più che da negozio.

Ritmo verticale: `--lh-tight: 1.15` (titoli) · `--lh-base: 1.65` (corpo).
Occhielli in maiuscoletto con `letter-spacing: .14em`.

---

## 4. SPAZIO

Scala a base 4, con nomi che descrivono l'uso:

```css
--sp-1: .25rem;  --sp-2: .5rem;   --sp-3: .75rem;  --sp-4: 1rem;
--sp-5: 1.5rem;  --sp-6: 2rem;    --sp-7: 3rem;    --sp-8: 4rem;
--sp-9: 6rem;    --sp-10: 8rem;
--section-y: clamp(4rem, 9vw, 8rem);   /* ritmo fra sezioni */
--container: 1280px;
--container-narrow: 820px;             /* testo lungo, leggibilità */
--gutter: clamp(1.25rem, 4vw, 3rem);
```

Lo spazio è il principale strumento di gerarchia del sistema. Prima di aumentare
un peso tipografico o aggiungere un bordo, si aumenta lo spazio.

---

## 5. FORMA

```css
--radius-sm: 4px;    --radius:    8px;
--radius-lg: 14px;   --radius-xl: 20px;
--radius-full: 999px;
```

Raggi contenuti: l'arrotondamento morbido è uno stilema da e-commerce generalista.
Le card di prodotto usano `--radius` (8px), i chip `--radius-full`.

### Elevazione

Quattro livelli, solo profondità strutturale — mai bagliori colorati.

```css
--elev-1: 0 1px 2px rgba(0,0,0,.28);
--elev-2: 0 4px 16px rgba(0,0,0,.30);
--elev-3: 0 12px 32px rgba(0,0,0,.34);
--elev-4: 0 24px 60px rgba(0,0,0,.42);
```

Su fondo scuro l'elevazione si comunica soprattutto con il **cambio di
superficie** (`--surface-1` → `--surface-2`), non con l'ombra.

---

## 6. MOVIMENTO

```css
--ease:     cubic-bezier(.16, 1, .3, 1);    /* out-expo — decelerazione */
--ease-in-out: cubic-bezier(.65, 0, .35, 1);
--dur-fast: 140ms;  --dur:  240ms;  --dur-slow: 420ms;
```

Regole:
- Il movimento comunica **causa ed effetto**, non decora.
- Transizioni su `transform` e `opacity` soltanto (proprietà compositing-only).
- Reveal allo scroll: una sola volta, `IntersectionObserver`, 12px di traslazione.
- `prefers-reduced-motion: reduce` → **tutte** le animazioni disattivate, nessuna
  eccezione. Non è un dettaglio: è un requisito di accessibilità.

---

## 7. COMPONENTI

### 7.1 Product card (§23)

Contenuto richiesto: immagine · nome · categoria · materiale · tecnologia ·
breve descrizione · personalizzabile · CTA **"Scopri la creazione"**.

```text
┌─────────────────────────┐
│                         │  immagine 4:3, lazy, zoom 1.03 in hover
│                         │
├─────────────────────────┤
│ SOLUZIONI MENU          │  occhiello categoria, --fs-2xs, --text-3
│ Trinacria               │  nome, --fs-xl, --text-1
│ Portamenù A4 ad anelli  │  sottotitolo funzionale, --fs-sm, --text-2
│ ─────────────────────── │  hairline
│ ◆ Betulla  ⚡ Laser CO₂  │  materiale + tecnologia, mono, --fs-xs
│ Personalizzabile        │  chip, solo se true
│ Scopri la creazione  →  │  CTA testuale, underline ciano in hover
└─────────────────────────┘
```

Nessun prezzo in card: il modello è **richiesta di preventivo**, non carrello.

### 7.2 Pagina prodotto (§24)

Ordine imposto dal master command, rispettato:

```text
Gallery → Titolo → Descrizione → Applicazioni → Materiali → Tecnologia
       → Dimensioni → Personalizzazione → Portfolio correlato → FAQ → CTA richiesta
```

Layout: gallery sticky a sinistra (desktop ≥1024px), contenuto scorrevole a
destra. Le **dimensioni** sono in tabella monospace — è il dettaglio che
distingue uno studio tecnico da un negozio.

### 7.3 Mega-menu (§25)

Undici collezioni d'uso, in tre colonne, con una quarta colonna editoriale
(creazione in evidenza). Apertura su hover con intento (delay 120ms) su desktop,
accordion su mobile. Navigabile interamente da tastiera, `aria-expanded` gestito.

### 7.4 Filtri catalogo (§22)

Ricerca testuale · categoria · sottocategoria · materiale · tecnologia · uso ·
personalizzabile · B2B/B2C · novità · collezioni.

I filtri sono **riflessi nell'URL** (`?mat=betulla&tec=laser-co2`): un catalogo
filtrato è condivisibile e indicizzabile. Stato vuoto curato, con suggerimento di
rimozione dei filtri.

---

## 8. GRIGLIA

12 colonne, gutter fluido.

| Breakpoint | Larghezza | Colonne catalogo |
| ---------- | --------- | ---------------- |
| `< 600px` | mobile | 1 |
| `600–899px` | tablet | 2 |
| `900–1199px` | laptop | 3 |
| `≥ 1200px` | desktop | 4 |

Mobile-first. Nessun layout a due colonne sotto i 600px.

---

## 9. ACCESSIBILITÀ

| Requisito | Implementazione |
| --------- | --------------- |
| Contrasto testo | ≥ 4.5:1 corpo, ≥ 3:1 titoli grandi — verificato su entrambe le modalità |
| Focus visibile | `outline: 2px solid var(--accent); outline-offset: 2px` — mai rimosso |
| Navigazione tastiera | Tutte le rotte, il mega-menu e i filtri |
| Skip link | Prima voce del DOM |
| Landmark | `header` `nav` `main` `footer` + `aria-label` |
| Immagini | `alt` obbligatorio, validato in build |
| Form | `label` esplicite, errori annunciati via `aria-live` |
| Motion | `prefers-reduced-motion` rispettato |
| Zoom | Fino a 200% senza scroll orizzontale |

---

## 10. TOKEN — RIEPILOGO

Tutti i token vivono in `assets/css/variables.css`, unica fonte. Nessun valore
cromatico o dimensionale sciolto nel resto del CSS: è la regola che tiene il
sistema coerente nel tempo ed è verificata da `tests/test-css.mjs`.

---

*Documento generato in PHASE 7 — INGLY DESIGN / Giuseppe Inglima*
