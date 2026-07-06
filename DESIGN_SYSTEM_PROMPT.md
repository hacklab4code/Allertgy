# AllerTgy - stile prodotto e prompt per Claude Design

## Tesi visiva

AllerTgy deve sembrare un compagno affidabile al tavolo: chiarezza quasi sanitaria, calore da ristorante italiano, interfaccia calma e leggibile anche in un momento di ansia.

Il prodotto non deve sembrare una app fitness, una startup generica o un gestionale pesante. Deve comunicare tre cose in pochi secondi: posso capire cosa mangiare, il ristorante si prende responsabilita, il dato e leggibile e verificabile.

## Personalita del brand

- Affidabile, diretto, umano.
- Protettivo senza spaventare.
- Preciso su allergeni, tracce, responsabilita e disclaimer.
- Italiano, concreto, orientato al momento reale: sedersi, scansionare, scegliere, chiedere conferma allo staff.

Parole chiave: sicurezza, chiarezza, tavolo, profilo, allergeni, tracce, QR, registro, verifica.

Da evitare: linguaggio troppo medico, tono pubblicitario, promesse assolute, copy tipo "zero rischi", "mangia senza pensieri", "100% sicuro" quando non e legalmente corretto.

## Sistema visivo

### Palette

Usare una palette chiara, pulita, non dominata solo dal verde.

- Fondo app: `#F7FAF8`
- Superficie primaria: `#FFFFFF`
- Superficie secondaria: `#EEF5F1`
- Testo principale: `#10201B`
- Testo secondario: `#596B63`
- Linee/bordi: `#DDE8E2`
- Brand forest: `#0B5D4D`
- Azione primaria: `#0F8A6A`
- Mint soft: `#DDF8EA`
- Blu verifica: `#2563EB`
- Verde idoneo: `#16A34A`
- Giallo attenzione: `#D97706`
- Rosso non idoneo: `#DC2626`
- Grigio disattivo: `#94A3B8`

Regola: il verde e il colore di brand e azione, non deve invadere ogni pannello. Per stati di sicurezza usare sempre verde/giallo/rosso con testo esplicito e icona, mai solo colore.

### Tipografia

- Mobile e dashboard: usare font di sistema o Inter.
- Titoli: peso 750/800, molto chiari, senza letter spacing negativo.
- Label operative: 11-12px, uppercase solo per metadati e tabelle.
- Corpo testo: 14-16px mobile, 13-15px dashboard.
- Evitare headline enormi nelle aree operative: AllerTgy e la landing possono avere scala grande, l'app deve essere densa e leggibile.

### Forme e layout

- Radius standard: 12px per input e bottoni, 16px per pannelli, massimo 20px per elementi mobile importanti.
- Evitare card dentro card.
- Usare sezioni e liste piu di mosaici decorativi.
- Ombre molto leggere: meglio bordo + fondo diverso.
- Spaziatura mobile: 16/20px; dashboard: griglia 12 colonne, contenuto max 1120/1280px.

### Icone e immagini

- Preferire icone lineari coerenti. Se si usano emoji, limitarle ai momenti di onboarding o semaforo; nella dashboard usare icone piu professionali.
- Usare foto reali dei piatti dove possibile.
- Non usare immagini scure, generiche o troppo decorative.
- Per le dish card, l'immagine deve aiutare a riconoscere il piatto ma non sovrastare lo stato allergeni.

## Componenti chiave

### Semaforo

Ogni stato deve avere colore, icona, label e spiegazione breve.

- Verde: "Idoneo per il tuo profilo" / "Nessun allergene dichiarato tra quelli selezionati"
- Giallo: "Con attenzione" / "Possibili tracce: chiedi conferma al personale"
- Rosso: "Non idoneo" / "Contiene allergeni del tuo profilo"

Non usare "sicuro al 100%". Usare "idoneo secondo i dati dichiarati dal locale".

### Bottoni

- Primario: fondo `#0F8A6A`, testo bianco, radius 12/14.
- Secondario: fondo bianco, bordo `#DDE8E2`, testo `#0B5D4D`.
- Distruttivo o pericolo: solo quando serve, rosso sobrio.
- CTA di scansione QR: grande, immediata, con icona camera/QR.

### Input

- Altezza minima mobile: 48px.
- Dashboard: 40-44px.
- Stato focus: bordo brand + alone leggerissimo mint.
- Messaggi errore: testo chiaro, non solo bordo rosso.

### Badge

- Piano: Gratis, Verificato, Pro, Premium.
- Stato abbonamento: Attivo, Prova, Pagamento KO, Omaggio.
- Menu: Pubblicato, Da verificare, Non pubblicato.
- Verifica locale: usare blu per "Verificato", non verde semaforo.

## Schermate

### 1. Landing pubblica

Obiettivo: spiegare in pochi secondi il valore a clienti e ristoratori.

Struttura:
- Header semplice: logo, Area Clienti, Area Ristoratori.
- Hero con brand molto visibile: "AllerTgy".
- Sottotitolo: "Il menu allergeni che si adatta al tuo profilo."
- Visual principale: telefono o scena reale al tavolo con menu semaforo. Niente hero card generica.
- CTA primarie: "Prova come cliente", "Entra come ristoratore".
- Sezione semaforo: tre righe/pannelli chiari, non tre card decorative giganti.
- Sezione ristoratori: flusso operativo "Carica menu -> verifica allergeni -> pubblica QR -> stampa registro".
- Prezzi: tabella pulita, evidenziare Pro come piano menu allergeni.
- Footer con disclaimer legale.

Tono: fiducia, non paura.

### 2. App cliente mobile

Obiettivo: ridurre ansia e tempo di scelta al ristorante.

Schermate:
- Welcome: 3 slide massimo, copy breve, senza troppi emoji.
- Login/registrazione: chiaro consenso Termini, Privacy, dati salute.
- Allergie: lista raggruppata, chips grandi, ricerca se lista cresce.
- Home: "Dove stai mangiando?", azione QR dominante, codice locale sotto.
- Menu ristorante: riepilogo in alto con conteggi verde/giallo/rosso, filtri sticky, sezioni per stato e categoria.
- Dish card: foto piccola, nome, prezzo, badge stato, motivazione allergene.
- Account: profilo allergie, lingua, emergenza, documenti, disclaimer.

Regole:
- La scansione QR e il codice locale devono essere accessibili dalla prima schermata operativa.
- Non nascondere il disclaimer: deve essere sobrio ma sempre raggiungibile.
- In menu, il rosso non deve essere solo "sbarrato"; deve essere leggibile per capire perche e non idoneo.

### 3. Area ristoratore web

Obiettivo: far completare il setup senza errori legali.

Struttura:
- Sidebar: Panoramica, Menu, Impostazioni, Piano, QR.
- Panoramica: stato pubblicazione, piano, dati locale, ultimo aggiornamento.
- Menu: scelta tra foto AI, modifica menu esistente, inserimento manuale.
- Editor piatti: layout denso ma ordinato, allergeni come controlli a tre stati: assente, contiene, tracce.
- Conferma legale prima della pubblicazione.
- QR: anteprima pulita da stampare, codice grande, istruzione breve.
- Registro allergeni: formato leggibile da stampa, sobrio, senza grafica inutile.

Regole:
- Questa parte deve sembrare uno strumento di lavoro, non una landing.
- Evitare troppi gradienti, emoji e ombre.
- Evidenziare bene cosa e pubblicato e cosa no.

### 4. Admin interno

Obiettivo: operativita rapida.

Struttura:
- Header scuro sobrio.
- KPI in riga.
- Tabella locali e piani come elemento principale.
- Inspector laterale per dettagli, fatturazione, note commerciali.
- Stati e piani con badge consistenti.

Regole:
- Densita piu alta.
- Nessuna decorazione.
- Colori solo per stato, piano, rischio e azione.

### 5. QR e materiali stampati

Obiettivo: essere chiari su tavoli, banco e registro.

QR table card:
- Logo AllerTgy.
- Testo: "Scansiona per leggere il menu allergeni del locale".
- Codice locale grande.
- Disclaimer breve: "Comunica sempre le tue allergie al personale."
- Alto contrasto, stampabile in bianco e nero.

Registro allergeni:
- Nome locale, data generazione, versione menu.
- Tabella: piatto, categoria, allergeni contenuti, possibili tracce.
- Nota legale finale.

## Motion e interazioni

- Landing: ingresso leggero di headline e visual, nessuna animazione continua invasiva.
- Mobile: transizioni rapide tra filtri menu, feedback immediato sui chip allergie.
- Dashboard: hover/focus chiari, salvataggio con stato "in corso", conferma pubblicazione.
- Accessibilita: target touch almeno 44px, contrasto AA, stati non affidati solo al colore.

## Prompt pronto per Claude Design

```text
Agisci come product designer senior e frontend designer. Devo ridisegnare AllerTgy, una piattaforma per allergie e intolleranze alimentari composta da:
1. landing pubblica,
2. app mobile cliente,
3. dashboard web ristoratore,
4. admin interno,
5. QR/table card e registro allergeni stampabile.

Contesto prodotto:
AllerTgy aiuta chi mangia fuori a confrontare il proprio profilo allergenico con il menu del ristorante. Il risultato usa un semaforo:
- verde: idoneo secondo i dati dichiarati dal locale,
- giallo: possibili tracce o contaminazioni, chiedere conferma,
- rosso: contiene allergeni del profilo, da evitare.
I ristoratori possono creare il locale, caricare/modificare il menu, indicare allergeni contenuti e tracce, pubblicare il QR e stampare il registro allergeni. Esiste anche un admin interno per piani commerciali, utenti, locali, MRR e stato abbonamenti.

Direzione visiva:
Deve sembrare affidabile, chiaro e umano: chiarezza quasi sanitaria, calore da ristorante italiano, interfaccia calma e leggibile anche in un momento di ansia. Non deve sembrare una startup SaaS generica, una app fitness o un gestionale pesante.

Palette:
- fondo app #F7FAF8
- superficie #FFFFFF
- superficie secondaria #EEF5F1
- testo #10201B
- testo secondario #596B63
- bordi #DDE8E2
- brand forest #0B5D4D
- azione primaria #0F8A6A
- mint soft #DDF8EA
- blu verifica #2563EB
- verde stato #16A34A
- giallo stato #D97706
- rosso stato #DC2626
- grigio disattivo #94A3B8

Tipografia:
Usa font di sistema o Inter. Titoli forti ma non enormi nelle parti operative. Label operative 11-12px. Corpo 14-16px mobile e 13-15px dashboard. Non usare letter spacing negativo.

Regole UI:
- Preferisci layout puliti, sezioni e liste; evita card dentro card.
- Radius 12px per input/bottoni, 16px per pannelli, massimo 20px per elementi mobile importanti.
- Ombre minime; usa bordo e superficie.
- Non usare promesse assolute come "100% sicuro". Usa "idoneo secondo i dati dichiarati dal locale".
- Gli stati verde/giallo/rosso devono avere colore, icona, label e motivazione testuale.
- Accessibilita: contrasto AA, target touch almeno 44px, non affidare le informazioni solo al colore.

Disegna tutte queste parti:

Landing pubblica:
- hero con brand "AllerTgy" molto visibile,
- headline: "Il menu allergeni che si adatta al tuo profilo",
- CTA "Prova come cliente" e "Entra come ristoratore",
- visual principale con telefono/menu semaforo in contesto ristorante, non card SaaS generica,
- sezione semaforo,
- sezione flusso ristoratore: carica menu, verifica allergeni, pubblica QR, stampa registro,
- tabella piani: Gratis, Verificato, Pro, Premium, evidenziando Pro,
- footer con disclaimer.

App mobile cliente:
- welcome in massimo 3 slide,
- login/registrazione con consenso Termini, Privacy e dati salute,
- selezione allergie 14 UE + preferenze,
- home con azione QR dominante e codice locale,
- menu ristorante con riepilogo conteggi, filtri sticky, sezioni verde/giallo/rosso, categorie, dish card con foto, prezzo, badge stato e motivazione allergene,
- account con allergie, lingua, emergenza, documenti, disclaimer.

Dashboard ristoratore:
- layout gestionale con sidebar: Panoramica, Menu, Impostazioni, Piano, QR,
- panoramica con stato pubblicazione, piano, dati locale, ultimo aggiornamento,
- menu con scelta foto AI, modifica menu esistente, inserimento manuale,
- editor piatti con allergeni a tre stati: assente, contiene, tracce,
- conferma legale obbligatoria prima della pubblicazione,
- QR stampabile e registro allergeni.

Admin interno:
- KPI, tabella locali/piani, stato abbonamento, filtro ricerca, inspector laterale per dettagli e note commerciali.
- Densita alta, nessuna decorazione, colori solo per azioni e stati.

QR e stampa:
- table card stampabile con logo, testo "Scansiona per leggere il menu allergeni del locale", codice locale grande e disclaimer "Comunica sempre le tue allergie al personale".
- registro allergeni con tabella pulita: piatto, categoria, allergeni contenuti, possibili tracce, nota legale.

Output richiesto:
1. proponi un sistema visivo completo,
2. descrivi layout e gerarchia per ogni schermata,
3. indica componenti riutilizzabili,
4. scrivi microcopy italiana pronta per UI,
5. evidenzia cosa rimuovere o semplificare rispetto a una UI troppo piena di card, emoji, gradienti e ombre,
6. se produci codice, usa React/React Native con componenti puliti e responsive, senza dipendenze non necessarie.
```

## Cosa cambierei nello stile attuale

- Ridurre i gradienti emerald e le card molto arrotondate.
- Ridurre l'uso di emoji nella dashboard ristoratore; mantenerle solo dove aiutano onboarding e semaforo.
- Sostituire "Sicuro" con "Idoneo" o "Idoneo per il tuo profilo" quando si parla di allergeni.
- Dare al rosso una spiegazione leggibile invece di opacizzare troppo il piatto.
- Rendere il Pro il centro commerciale dell'app: menu digitale, allergeni per piatto, QR, registro stampabile.
- Rendere landing piu visuale e meno "demo dentro una card".
- Rendere admin piu tabellare e meno card-based.
