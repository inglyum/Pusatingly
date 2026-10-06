# Pannello di amministrazione — guida

L'admin è una pagina del sito: `https://<il-tuo-sito>/admin.html`.
Non c'è un server e non c'è una password da ricordare. Quello che autorizza a
scrivere è un **token di GitHub** che resta nel tuo browser e che puoi revocare
in qualunque momento.

La pagina è esclusa dai motori di ricerca (`noindex` + `robots.txt`), ma
l'indirizzo è pubblico e non è quello a proteggerla: **chiunque la apra vede il
catalogo, e nessuno può pubblicare senza un token valido su questo
repository.**

---

## 1. Il token, una volta sola

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** →
   **Fine-grained tokens** → *Generate new token*
2. **Repository access** → *Only select repositories* → scegli **questo**
   repository e nessun altro
3. **Permissions** → *Repository permissions* → **Contents: Read and write**.
   Nient'altro: non servono né Actions, né Pages, né i metadati di altro.
4. Scadenza: mettine una. Novanta giorni è un buon compromesso.
5. Copia il token (GitHub lo mostra una volta sola).

Nell'admin: **⚙** → incolla il token → *Prova il collegamento* → *Salva*.

> **Ricorda il token su questo computer** lascia il token nel browser anche dopo
> la chiusura. Senza la spunta vale finché la scheda resta aperta. Sul computer
> dello studio ha senso, su un computer condiviso no.
>
> Il token non entra mai in un commit. C'è un test che lo verifica
> (`tests/test-admin.mjs`), perché un token dentro un file pubblicato sarebbe
> pubblico nell'istante del commit.

---

## 2. Inserire una creazione

1. **+ Nuova** — il codice viene assegnato da solo (`ti-014`, `sm-032`…) e
   **non viene mai riusato**, nemmeno se elimini la creazione: un vecchio link
   non può finire su un prodotto diverso.
2. Compila almeno: nome, descrittore funzionale, descrizione breve, testo
   alternativo dell'immagine. Finché mancano, in alto resta scritto quanti
   errori ci sono e la pubblicazione è bloccata.
3. **Fotografia** → *Carica una fotografia*: viene ritagliata a 4:3,
   ridimensionata a 1600×1200 e convertita in WebP dal browser. Non serve
   preparare niente prima.
4. **Pubblica su GitHub**.

La fotografia viene caricata **nello stesso commit** del catalogo. Non esiste un
momento in cui `products.json` cita una foto che non è ancora arrivata.

## 3. Togliere una creazione

Due strade diverse, e vale la pena sceglierle apposta:

| | **Archivia** | **Elimina** |
|---|---|---|
| Sparisce dal sito e dalla sitemap | sì | sì |
| Resta nel file | sì | no |
| Si può ripristinare | sì | no |
| La fotografia viene rimossa dal repository | no | sì |

**Archivia** è la scelta normale. **Elimina** serve quando la creazione non
sarebbe mai dovuta esistere.

## 4. Pubblicare

**Pubblica su GitHub** apre un riepilogo di cosa sta per succedere, poi:

```
blob per ogni file → albero sull'albero del commit attuale
  → commit → avanzamento del ramo
```

Un solo commit, atomico: o entra tutto, o non entra niente.

Nel commit finiscono `data/products.json`, `data/version.json`, `sitemap.xml`
rigenerata, le fotografie nuove, e la rimozione di quelle eliminate.

Due cose che il pannello fa e che conviene conoscere:

- **Se qualcuno ha toccato gli stessi file** dopo che l'admin ha letto i dati
  (un commit a mano, un'altra scheda aperta), ti avvisa prima di sovrascrivere.
  Alla domanda, *Annulla* è quasi sempre la risposta giusta: ricarichi l'admin e
  riparti dai dati aggiornati.
- **«Commit salvo» e «sito aggiornato» sono due momenti distinti.** GitHub Pages
  ricostruisce con i suoi tempi. L'admin controlla `data/version.json` sul sito
  pubblico finché non vede la versione appena pubblicata. Se non ci riesce entro
  un minuto te lo dice: *il commit è comunque salvo*, è solo la messa online a
  non essere ancora confermata.

## 5. Se qualcosa non va

| Messaggio | Cosa fare |
|---|---|
| *Token non valido o scaduto* | Rigenera il token: è scaduto o è stato revocato. |
| *Il token non vede owner/repo* | Il token è stato creato per un altro repository, oppure owner/nome sono scritti male in ⚙. |
| *Permessi insufficienti* | Al token manca **Contents: Read and write**. |
| *Il ramo è avanzato mentre pubblicavi* | Qualcuno ha pubblicato nello stesso momento. Ricarica l'admin e ripubblica. |
| *Limite delle API superato* | Stai lavorando senza token: con il token si passa da 60 a 5000 richieste l'ora. |
| *Rete non raggiungibile* | Connessione, VPN o un blocco del browser. |

**Esporta file** resta come via di scampo: scarica `products.json` e le
fotografie e li metti nel repository a mano. Serve solo se GitHub non è
raggiungibile.

---

## 6. Requisito del repository

**Settings → Pages → Deploy from a branch → `main` → `/ (root)`.**

In modalità *GitHub Actions* il commit dell'admin va online solo dopo un
workflow, e la verifica della messa in onda non può funzionare. Per lo stesso
motivo **nessun workflow deve fare commit automatici sul ramo**: andrebbe in
conflitto con la pubblicazione atomica.
