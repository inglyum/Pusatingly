# Come testare il sito

Tre modi, dal più veloce al più completo. Fai il **modo 1** se vuoi solo
guardare; il **modo 2** se devi provare l'admin sul serio.

---

## Modo 1 — online, senza installare niente

Il sito è già su GitHub. Serve solo che GitHub Pages sia acceso.

**Una volta sola**, su `github.com/inglyum/pusatingly`:

> **Settings** → **Pages** → *Build and deployment* → Source: **Deploy from a branch**
> → Branch: **`Main`** → cartella **`/ (root)`** → **Save**

Non scegliere *GitHub Actions*: in quella modalità il commit dell'admin va
online solo dopo un workflow, e il pannello non riesce a confermarti che il sito
è aggiornato.

Dopo due minuti il sito è su `https://inglyum.github.io/pusatingly/`.

> **Perché `Main` e non `main`.** Il repository ha due rami con lo stesso nome
> scritto diversamente. Ora puntano allo stesso commit, quindi va bene
> qualunque dei due — ma `Main` è il predefinito, ed è quello che Pages ti
> propone. Se vuoi fare pulizia: Settings → Branches, imposta `main` come
> predefinito e cancella `Main`.

---

## Modo 2 — in locale, per provare anche l'admin

Serve Node 18 o superiore.

```bash
git clone https://github.com/inglyum/pusatingly.git
cd pusatingly
npm install
npm run serve
```

Poi apri **http://localhost:3000** — e l'admin su
**http://localhost:3000/admin.html**.

> **Non aprire `index.html` con un doppio clic.** Il sito carica i dati con
> `fetch` e i moduli ES: da `file://` il browser li blocca e vedi una pagina
> vuota. Non è rotto, è una regola di sicurezza del browser.

---

## Modo 3 — i controlli automatici

```bash
npm test
```

Quattro suite, 65 controlli, nessuna dipendenza oltre a jsdom:

| Suite | Cosa verifica |
|---|---|
| `validate-data` | integrità del catalogo: categorie esistenti, slug, riferimenti |
| `test-data` (16) | forma dei dati, traduzioni, coerenza fra i file |
| `test-css` (12) | nessun colore fuori dai token, modalità chiara, focus visibile, **nessuna classe usata nel JS senza regola CSS** |
| `test-site` (25) | i renderer veri in un DOM: struttura, un solo `h1`, escaping, link che puntano a rotte esistenti |
| `test-admin` (12) | cosa finisce nel commit, e che **il token non ci finisca mai** |

Devono essere tutti verdi. Se `test-admin` si lamenta della sitemap, esegui
`npm run sitemap`.

---

## Cosa guardare, in ordine

### La home

1. **Barra in alto** — tre messaggi che si alternano ogni 6 secondi.
2. **Acquista per categoria** — 13 pastiglie circolari. Mostrano le iniziali
   perché non ci sono ancora foto quadrate: appena ne metti una, entra da sola.
3. **Le nostre idee diventano prodotti** — si scorre lateralmente.
4. **Chi c'è dietro** — immagine, tre punti, bollino circolare.
5. **Cosa vuoi fare oggi?** — sette ingressi. Cliccali tutti: devono portare da
   qualche parte, nessuno a vuoto.
6. **Tecnologia da vedere e da provare** — le quattro macchine in officina e i
   servizi del centro assistenza.
7. In fondo: fascia a quattro colonne e newsletter.

### Le pagine

Provale tutte, sono quindici:

```
/  ·  /creazioni  ·  /creazioni/soluzioni-menu
/creazioni/soluzioni-menu/portamenu-a4-ad-anelli
/materiali  ·  /tecnologie  ·  /portfolio  ·  /chi-sono
/come-acquistare  ·  /b2b  ·  /xtool  ·  /xtool/p3
/contatti  ·  /informazioni/spedizioni  ·  (un indirizzo inventato → 404)
```

Su ognuna: il titolo della scheda del browser cambia, c'è un solo titolo
principale, niente scorrimento orizzontale.

### Le cose che si rompono per prime

- **Cambio lingua IT/EN** in alto a destra. Le pagine informative e parte dei
  testi inglesi sono ancora da scrivere: dove manca si vede l'italiano, non uno
  spazio vuoto.
- **Modalità chiara/scura** (l'icona del sole). Nessun testo deve sparire.
- **Ricerca nell'header** → porta al catalogo con il filtro già applicato.
- **Filtri del catalogo** — l'indirizzo cambia mentre filtri: copialo, aprilo in
  una scheda nuova, deve riaprire gli stessi filtri.
- **Telefono.** Restringi la finestra sotto i 600 px, oppure aprilo davvero dal
  telefono. Niente deve uscire dai bordi.

---

## Provare l'admin

Apri `/admin.html`. Senza token puoi già fare tutto tranne pubblicare.

**Inserimento**
1. **+ Nuova** → compila nome, descrittore, descrizione breve, testo alternativo
2. Carica una fotografia qualsiasi: viene ritagliata e convertita dal browser
3. **Anteprima sito** → si apre il sito con la tua bozza dentro
4. **Pubblica su GitHub**

**Eliminazione** — scegli una creazione e prova entrambi i bottoni:
*Archivia* la toglie dal sito tenendola recuperabile, *Elimina* la toglie dal
file e cancella la sua foto dal repository. La conferma te lo dice.

**Per pubblicare davvero serve il token.** Procedura completa in
[`ADMIN.md`](./ADMIN.md) — in breve: GitHub → Settings → Developer settings →
Fine-grained tokens, accesso **solo a questo repository**, un solo permesso
**Contents: Read and write**. Poi ⚙ nell'admin → incolla → *Prova il
collegamento*.

**Prova che vale la pena fare una volta**: pubblica una modifica, poi apri il
sito e controlla che ci sia. L'admin te lo dice da solo, ma vederlo con i tuoi
occhi la prima volta serve.

---

## Quello che non funziona ancora, e non è un difetto del codice

Sono cose che dipendono da dati che non ci sono, non da bug:

- **176 creazioni su 176 non hanno una fotografia vera.** Si vedono i
  segnaposto generati. Il meccanismo di sostituzione è pronto: basta caricare.
- **I moduli non inviano niente.** Non c'è un endpoint configurato: il bottone
  compone un'email già scritta invece di fingere un invio.
- **Privacy, condizioni e cookie sono da completare.** Le pagine esistono e lo
  dichiarano in cima: sono testi legali, devi scriverli tu o farteli scrivere.
- **L'inglese è parziale.** Dove manca compare l'italiano.
- **`config.site.url` dichiara `inglydesign.it`**, che è il dominio dell'altro
  repository. Finché resta così la sitemap e i dati strutturati dichiarano
  indirizzi che non portano qui. Va deciso quale dei due siti tiene quel nome.
