# INGLY DESIGN — Pusatingly

> **Giuseppe Inglima** · Studio di design e produzione su misura
> Sito e catalogo premium. Statico, senza framework, zero dipendenze a runtime.

---

## Cos'è questo repository

Il nuovo sito ufficiale **INGLY DESIGN**: struttura informativa completa e
catalogo di 176 creazioni, costruiti sull'architettura del sistema INGLY
esistente e progettati perché ogni prodotto e ogni immagine siano sostituibili
**uno alla volta, senza rifare il sito**.

Il progetto INGLY preesistente (`Ingly-standalone-html`) **non è stato toccato**.

---

## Avvio rapido

```bash
npm run serve      # sito su http://localhost:3000
npm test           # 51 verifiche: dati, CSS, rendering
npm run build      # catalogo + placeholder + immagini + sitemap + report
```

Nessuna dipendenza per far girare il sito. `jsdom` serve solo ai test.

---

## Documentazione — la fonte di verità

Prima di modificare qualcosa, leggere il documento che la riguarda.

| Documento | Contenuto |
| --------- | --------- |
| [`docs/PUSATERI-SITE-MAP.md`](docs/PUSATERI-SITE-MAP.md) | Mappa della struttura di riferimento e **limiti della scansione** |
| [`docs/MIGRATION-MAP.md`](docs/MIGRATION-MAP.md) | Corrispondenza categorie, brand e persone. Regole non negoziabili |
| [`docs/PRODUCT-MIGRATION.md`](docs/PRODUCT-MIGRATION.md) | Schema prodotto, stati di migrazione, come sostituire un prodotto |
| [`docs/IMAGE-MIGRATION.md`](docs/IMAGE-MIGRATION.md) | Politica sugli asset e catena di sostituzione delle immagini |
| [`docs/INGLY-ARCHITECTURE.md`](docs/INGLY-ARCHITECTURE.md) | Architettura tecnica, routing, flusso applicativo |
| [`docs/INGLY-DESIGN-SYSTEM.md`](docs/INGLY-DESIGN-SYSTEM.md) | Colore, tipografia, spazio, componenti, accessibilità |

Report rigenerabili in `docs/generated/` (`npm run report`).

---

## Struttura

```text
data/          fonte di verità del catalogo (JSON)
assets/css/    design system in 7 file, token in variables.css
assets/js/     11 moduli ES, nessun bundler
assets/images/ placeholder SVG, sostituiti dalle foto reali
scripts/       generazione catalogo, placeholder, sitemap, report
tests/         51 verifiche automatiche
docs/          documentazione
```

---

## Il catalogo in numeri

| | |
| - | - |
| Creazioni | **176** |
| Categorie | 13 (tutte quelle del riferimento, nessuna persa) |
| Sottocategorie | 82 |
| Materiali | 15 |
| Tecnologie | 11 |
| Collezioni d'uso | 11 |
| Rotte | 20 + una per prodotto |
| Foto reali | 0 su 176 — vedi sotto |

---

## Stato del progetto

Il sito è **completo e navigabile**. Restano due lavorazioni, entrambe
per Giuseppe e nessuna delle quali richiede modifiche al codice.

### 1. Fotografie

Ogni creazione ha oggi un placeholder SVG brandizzato. Sostituzione:

```bash
cp foto.webp assets/images/products/sm-001.webp
npm run sync-images
```

`sync-images` aggiorna da solo percorso, stato e avanzamento della migrazione.
`npm run report` dice da quale categoria conviene partire.

### 2. Dati personali e recapiti

Segnalati come avvisi da `npm test`, non bloccano nulla:

- `content.chiSono.biografia` — percorso reale di Giuseppe
- `config.contact.whatsapp` / `phone` — il pulsante WhatsApp resta nascosto finché è vuoto
- `config.social.*` — profili attivi
- `config.stats.pezzi` / `clienti` / `rating` — **solo se dati reali**: i contatori `null` non vengono mostrati

---

## Regole non negoziabili

Queste valgono più di qualsiasi scadenza. Sono verificate automaticamente da
`npm test`, che fallisce se vengono violate.

1. **Nessun contenuto di terzi.** Nessuna fotografia, biografia, referenza,
   cliente o nome di prodotto proveniente dal sito di riferimento. La struttura
   editoriale è un modello; il contenuto è originale INGLY.
2. **Nessun numero inventato.** Un contatore senza fonte reale resta `null` e
   non viene mostrato.
3. **Il portfolio contiene solo lavori realmente eseguiti**, con foto proprie.
   Finché è vuoto, la pagina lo dichiara.
4. **Nessun `id` viene mai riusato**, nemmeno dopo l'archiviazione: i permalink
   restano stabili per sempre.
5. **Niente si cancella**: si archivia. La storia resta nel dato e in Git.
6. **Ogni immagine ha un `alt`**: la build fallisce se manca.

---

## Comandi

| Comando | Cosa fa |
| ------- | ------- |
| `npm run serve` | Server locale |
| `npm test` | Validazione + 51 test |
| `npm run build` | Pipeline completa |
| `npm run build:catalog` | Rigenera `products.json` dal seed (preserva gli edit manuali) |
| `npm run placeholders` | Placeholder mancanti (salta chi ha già la foto) |
| `npm run sync-images` | Allinea il catalogo alle foto presenti su disco |
| `npm run add-product` | Aggiunge una creazione al seed, guidato e validato |
| `npm run sitemap` | Rigenera `sitemap.xml` |
| `npm run report` | Report di catalogo e copertura fotografica |
| `npm run crawl` | Scansione del riferimento — richiede il dominio raggiungibile |
| `npm run reconcile` | Confronta il crawl con il catalogo |

---

## Pubblicazione

Sito statico: si serve così com'è.

- **Con rewrite** (Netlify, Vercel, nginx): instradare tutto su `index.html` e
  impostare `data-routing="history"` sull'elemento `<html>` per avere URL puliti.
- **Senza rewrite** (GitHub Pages): funziona senza configurazione. `404.html`
  converte i percorsi profondi in hash-route.

L'unico file da non mettere in cache lunga è `data/version.json`: è ciò che
invalida il resto.


---

## Admin — modificare il catalogo dal browser

Apri **`admin.html`** (serve un server locale: `npm run serve`, poi
`localhost:3000/admin.html`). Non richiede login, token o configurazione:
è uno strumento locale, ed è escluso dai motori di ricerca.

Cosa puoi fare:

| | |
| - | - |
| **Modificare** | nome, testi, categoria, materiali, tecnologie, misure, personalizzazioni, SEO |
| **Aggiungere** | «+ Nuova» assegna un codice libero, senza mai riusarne uno già visto |
| **Duplicare** | parte da una creazione esistente e ne crea una nuova collegata |
| **Archiviare** | esce dal catalogo pubblico e dalla sitemap, ma resta nel file e si ripristina |
| **Fotografare** | carichi un'immagine, viene ritagliata 4:3 e convertita in WebP già rinominata |
| **Verificare** | ogni modifica è controllata in tempo reale; con errori aperti l'esportazione è bloccata |
| **Vedere** | «Anteprima sito» apre il sito reale con le tue modifiche, prima di pubblicarle |

Il lavoro in corso resta salvato nel browser: puoi chiudere e riprendere.

### Come si pubblica

L'admin non scrive sul server — prepara i file, li metti tu nel repository:

1. **Esporta products.json** → sostituisci `data/products.json`
2. Se hai caricato foto, mettile in `assets/images/products/`
3. `npm test` → `git commit` → `git push`

Se dimentichi una foto, `npm run sync-images` riporta quella creazione al
placeholder invece di lasciare un'immagine rotta.

---

*Progetto e produzione: Giuseppe Inglima — INGLY DESIGN*
