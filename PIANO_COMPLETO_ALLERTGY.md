# AllerTgy — Piano completo da base beta a prodotto reale

Data analisi: 18 agosto 2026

## Decisione di prodotto

AllerTgy deve diventare prima di tutto questo:

> Un cliente imposta il proprio profilo allergeni, scansiona il QR del locale e capisce rapidamente quali piatti sono idonei secondo i dati dichiarati dal ristorante.

Il semaforo, il profilo allergeni, la qualità dei dati del menù e la fiducia nel ristoratore sono il nucleo. Scanner barcode, documenti medici, geofencing, recensioni, AI, abbonamenti e multilingua devono sostenerlo, non competere con esso.

## Principio non negoziabile: nessuna funzione viene eliminata

Questo piano non propone di cancellare funzionalità già presenti o progettate. L'obiettivo è conservarle tutte e migliorarne:

- posizione nella navigazione;
- ordine con cui vengono presentate;
- chiarezza del primo utilizzo;
- collegamento con il profilo e il semaforo;
- stato di accessibilità, errore, caricamento e offline;
- distinzione tra funzioni principali e funzioni avanzate.

Quando una funzione viene indicata come “successiva”, “secondaria” o “da rimandare”, significa soltanto che sarà sviluppata o resa visibile dopo il percorso principale. Non significa rimuoverla dal prodotto.

## Stato attuale rilevato

Il progetto è un monorepo reale composto da:

- app mobile Expo/React Native per clienti e ristoratori;
- dashboard web React/Vite per ristoratori, clienti, pagine pubbliche e admin;
- backend FastAPI con auth, profilo allergeni, ristoranti, menù, recensioni, AI, storage, notifiche e Stripe;
- database MySQL/SQLAlchemy con numerosi schemi e migrazioni legacy;
- test backend e test del motore semaforo mobile;
- documentazione di design, deploy, servizi e lancio già molto ricca.

Punti forti:

- proposta di valore chiara e differenziata;
- motore semaforo isolato e testato;
- modello dati già abbastanza completo;
- flussi per QR, menu, profili famiglia, recensioni, billing e documenti già presenti;
- separazione visuale sensata: Violet Precision per il consumer, Forest + Emerald per il B2B.

Problemi principali:

1. I flussi principali sono troppo lunghi e densi: onboarding, allergie e scanner mobile.
2. La dashboard ristoratore espone troppe funzioni contemporaneamente e non guida il primo completamento.
3. Il menù è un CRUD ricco, ma non ancora un sistema anti-errore per la qualità degli allergeni.
4. Il design system esiste, ma convivono schermate nuove, legacy, valori hardcoded e componenti con linguaggi diversi.
5. Backend, ORM, più file SQL e migrazioni automatiche all'avvio creano rischio di drift.
6. I fallback demo di AI, Stripe, email e storage devono essere separati nettamente dalla produzione.
7. I test usano soprattutto SQLite in-memory e non validano abbastanza il comportamento MySQL reale.
8. Il prodotto tratta dati sanitari: privacy, consenso, cancellazione, audit e disclaimer devono essere visibili e verificabili.

Nota operativa: il worktree contiene circa 221 file modificati o non tracciati. Prima di nuove modifiche bisogna creare uno snapshot/branch del lavoro attuale e distinguere ciò che è già approvato da ciò che è sperimentale. Non cancellare né ripristinare file alla cieca.

## Architettura prodotto da fissare

### Cliente

Navigazione primaria:

`Home` · `Ristoranti` · `Scansiona` · `Preferiti` · `Profilo`

Percorso principale:

`Profilo allergeni` → `QR/codice locale` → `menù` → `filtro semaforo` → `dettaglio piatto` → `conferma con il personale`.

La Home deve orientare verso i locali vicini e il profilo attivo. Non deve diventare un feed pieno di recensioni o promozioni.

### Ristoratore

La dashboard web deve essere la superficie completa per configurare il locale e il menù. L'app mobile ristoratore deve restare una superficie operativa rapida: stato, menù essenziale, QR, recensioni e notifiche.

Percorso principale:

`Crea locale` → `dati e orari` → `importa/crea menù` → `compila allergeni` → `verifica cucina` → `pubblica` → `stampa QR` → `monitora scansioni`.

### Trust layer

In ogni punto rilevante devono essere visibili:

- data e versione dell'ultimo menù pubblicato;
- data dell'ultima verifica cucina;
- referente allergeni del locale;
- distinzione tra dichiarazione del locale e valutazione automatica;
- spiegazione testuale del semaforo;
- disclaimer sempre raggiungibile.

Il copy deve usare “idoneo secondo i dati dichiarati dal locale”, mai “sicuro al 100%” o “zero rischi”.

## Roadmap raccomandata

### Fase 0 — Congelare la base e definire il beta scope

Obiettivo: non perdere il lavoro esistente e smettere di sviluppare feature senza una baseline verificabile.

Attività:

- creare branch/snapshot del worktree attuale;
- classificare file e modifiche in `approvato`, `da verificare`, `legacy`, `demo`;
- scegliere un target iniziale concreto: ad esempio una città e 5–10 ristoratori pilota;
- definire le metriche del beta;
- scegliere il perimetro minimo: login, profilo allergeni, QR, menù, semaforo, dashboard menù, QR stampabile, supporto;
- mantenere tutte le feature esistenti, organizzando quelle avanzate in sezioni dedicate senza cancellarle.

Deliverable:

- baseline riproducibile;
- lista dei flussi critici;
- matrice schermata/API/database;
- criteri di “pronto per beta”.

### Fase 1 — Rendere il core loop semplice e affidabile

Priorità massima: cliente e ristoratore devono arrivare al risultato senza perdersi.

#### App cliente

- ridurre l'onboarding a massimo tre passaggi esplicativi;
- lasciare il valore immediato vicino all'utente, evitando schermate introduttive ridondanti;
- mantenere obbligatori solo i consensi indispensabili, spiegandoli con testo breve;
- rendere il profilo allergeni progressivo: allergeni principali subito, intensità/criteri avanzati dopo;
- trasformare lo scanner in una schermata con tre azioni chiaramente separate, mantenendo tutte le modalità già presenti:
  1. QR ristorante, azione primaria;
  2. codice locale manuale;
-  3. barcode prodotto, funzione secondaria;
-  4. menù cartaceo e analisi AI;
-  5. galleria, torcia, cronologia, preferiti e strumenti Plus;
- mostrare sempre stato di caricamento, errore, offline e data dell'ultimo aggiornamento;
- nel menù usare un riepilogo sticky con conteggi verde/giallo/rosso e sezioni collassabili;
- per ogni piatto mostrare dot + icona + etichetta + spiegazione, non solo colore;
- conservare la possibilità di chiedere conferma al personale;
- rendere accessibili tutti i controlli custom a VoiceOver/TalkBack.

File di riferimento:

- `/Users/m1bookpro/Desktop/allerTgy/app-mobile/src/hooks/onboardingGuard.tsx`
- `/Users/m1bookpro/Desktop/allerTgy/app-mobile/app/welcome.tsx`
- `/Users/m1bookpro/Desktop/allerTgy/app-mobile/app/register.tsx`
- `/Users/m1bookpro/Desktop/allerTgy/app-mobile/app/register-allergies.tsx`
- `/Users/m1bookpro/Desktop/allerTgy/app-mobile/app/allergie.tsx`
- `/Users/m1bookpro/Desktop/allerTgy/app-mobile/app/scanner.tsx`
- `/Users/m1bookpro/Desktop/allerTgy/app-mobile/app/(tabs)/home/index.tsx`
- `/Users/m1bookpro/Desktop/allerTgy/app-mobile/app/(tabs)/locali/index.tsx`
- `/Users/m1bookpro/Desktop/allerTgy/app-mobile/app/menu/[codice].tsx`
- `/Users/m1bookpro/Desktop/allerTgy/app-mobile/app/menu/[codice]/dish/[id].tsx`

#### Area ristoratore

Creare un activation wizard in sette step:

1. nome, indirizzo, contatti e orari;
2. piano e stato della prova;
3. primo menù, importato da foto/URL o inserito manualmente;
4. allergeni per piatto;
5. protocollo cucina e conferma del responsabile;
6. anteprima cliente e validazione finale;
7. pubblicazione e generazione del QR.

La Home dashboard deve mostrare solo:

- percentuale di completamento;
- tre attività prioritarie;
- stato pubblicazione;
- ultimo aggiornamento;
- piano e stato pagamento;
- scansioni e avvisi essenziali.

File di riferimento:

- `/Users/m1bookpro/Desktop/allerTgy/dashboard-web/src/OwnerDashboard.tsx`
- `/Users/m1bookpro/Desktop/allerTgy/dashboard-web/src/owner/OwnerWebShell.tsx`
- `/Users/m1bookpro/Desktop/allerTgy/dashboard-web/src/components/MenuEditor.tsx`
- `/Users/m1bookpro/Desktop/allerTgy/app-mobile/app/(owner)/_layout.tsx`
- `/Users/m1bookpro/Desktop/allerTgy/app-mobile/app/(owner)/menu.tsx`
- `/Users/m1bookpro/Desktop/allerTgy/app-mobile/app/(owner)/qr.tsx`

#### Qualità del menù

Il ristoratore non deve poter pubblicare un piatto incompleto senza capire il problema.

Per ogni piatto introdurre:

- stato `completo`, `da verificare`, `incompleto`;
- controllo nome, descrizione, prezzo e allergeni;
- warning se lo stesso allergene è marcato in modo incoerente;
- indicazione chiara della differenza tra contenuto e tracce;
- data e responsabile dell'ultima conferma;
- anteprima identica a quella del cliente;
- validazione globale prima della pubblicazione;
- storico versione e possibilità di vedere cosa è cambiato.

### Fase 2 — Unificare UX/UI e gerarchia visuale

Obiettivo: far percepire un solo prodotto, non una somma di iterazioni.

#### Regole visuali

- usare `design_guidelines.json` come fonte dei token;
- flusso token: `design_guidelines.json` → `designTokens.ts` → `theme.ts` → componenti;
- eliminare progressivamente colori, radius, ombre e font hardcoded;
- consumer: Violet Precision, canvas lavanda, superfici bianche bordate;
- B2B: Forest + Emerald, fondo chiaro e densità operativa;
- semaforo solo per verdict e stati operativi, mai come colore decorativo del brand;
- ogni stato critico deve avere colore, icona, label e testo;
- target touch minimo 44 px e contrasto WCAG AA;
- glass/liquid effect solo su chrome, tab bar e ScanSphere, non su ogni card;
- ridurre card annidate e superfici decorative.

#### Componenti da consolidare

Creare una libreria interna coerente per:

- `SurfaceCard`, `SurfaceButton`, `AppText`, input, badge e banner;
- `SemaforoBadge`, `SemaforoSummary`, `MatchChip`;
- loading skeleton, empty state, error state, offline state;
- modal/sheet e conferma distruttiva;
- `RestaurantCard`, `DishCard`, menu section;
- table/grid editor B2B;
- status badge piano, pubblicazione, verifica e pagamento.

Dopo la stabilizzazione dei componenti, spezzare i file monolitici: `scanner.tsx`, `allergie.tsx`, `menu/[codice].tsx`, `OwnerDashboard.tsx` e `ClientArea.tsx` devono diventare orchestratori composti da feature più piccole.

#### Asset e brand

- auditare logo, icone, QR e immagini per trasparenza, dimensioni e uso su sfondi chiari/scuri;
- adottare icone allergeni vettoriali coerenti, non dipendere dalle emoji per informazioni critiche;
- mantenere le foto dei piatti come supporto al riconoscimento, senza lasciare che superino il verdict;
- definire una pagina di riferimento per stati, badge, tipografia e componenti.

### Fase 3 — Hardening backend, dati e produzione

#### Database e migrazioni

- scegliere una sola fonte di verità per lo schema;
- portare progressivamente tutte le modifiche in Alembic;
- trasformare la baseline vuota in una storia di migrazione realmente riproducibile;
- ridurre `backend/app/migrations/legacy.py` a compatibilità temporanea;
- eliminare il DDL automatico all'avvio quando la produzione sarà allineata;
- aggiungere test di migrazione su una versione MySQL reale o containerizzata;
- aggiungere indici per ricerche locali, menù, preferiti, recensioni e analytics;
- documentare versioni, rollback e backup.

File di riferimento:

- `/Users/m1bookpro/Desktop/allerTgy/backend/app/models.py`
- `/Users/m1bookpro/Desktop/allerTgy/backend/app/migrations/legacy.py`
- `/Users/m1bookpro/Desktop/allerTgy/backend/alembic/versions/0001_baseline.py`
- `/Users/m1bookpro/Desktop/allerTgy/database/schema.sql`
- `/Users/m1bookpro/Desktop/allerTgy/ARCHITETTURA.md`

#### Auth e autorizzazioni

- aggiungere sessioni revocabili o refresh token;
- registrare login, reset password, cambio password e revoche;
- prevedere gestione dispositivi/sessioni;
- rafforzare l'admin interno oltre la sola chiave statica `X-Admin-Key`;
- verificare ownership e isolamento per ogni endpoint ristoratore;
- bloccare token, chiavi e fallback demo in produzione;
- mantenere rate limit, anti-enumeration e password policy.

#### Semaforo e contratto dati

- definire un catalogo canonico degli allergeni e dei codici;
- allineare algoritmo TypeScript e valutazione server senza duplicazioni divergenti;
- testare contenuti, tracce, diete, ingredienti esclusi, profili vuoti e dati mancanti;
- distinguere sempre `non valutabile` da `verde` quando i dati del locale sono incompleti;
- salvare data, versione e autore della conferma del menù.

#### AI

- mantenere AI come assistente, mai come autore finale degli allergeni;
- mostrare confidenza e fonte dell'estrazione;
- obbligare la conferma umana;
- gestire timeout, retry, costi e limiti per piano;
- rendere impossibile lo stub in produzione;
- tracciare modello/versione dell'analisi senza salvare più dati sanitari del necessario.

#### Storage, privacy e dati sanitari

- R2 privato e URL firmati a scadenza breve;
- eliminazione reale degli oggetti alla cancellazione account;
- log degli accessi ai documenti medici con soli metadati necessari;
- retention e cancellazione documentate;
- consenso separato per analisi AI del singolo documento;
- DPIA e revisione legale prima del beta pubblico;
- testi privacy, termini e disclaimer coerenti in app, web e email;
- HTTPS, HSTS, segreti separati per ambiente e backup con restore testato.

#### Billing

- modellare abbonamenti e trial come state machine;
- rendere i webhook Stripe idempotenti;
- gestire pagamento fallito, periodo di grazia, cancellazione, rimborso e downgrade;
- impedire che il mock dev si attivi se `APP_ENV=production`;
- mostrare chiaramente piano, stato, scadenza e funzionalità disponibili.

#### Osservabilità e delivery

- log strutturati con request id;
- error tracking per backend, web e mobile;
- metriche per API, login, QR scan, AI, email, push e webhook;
- alert su errori, job falliti e backup;
- CI che esegua lint/typecheck/test backend/test semaforo/build web;
- pipeline separata per staging e produzione;
- runbook di deploy, rollback e incidente.

### Fase 4 — Beta chiusa con ristoratori reali

Non pubblicare subito per tutti. Usare 5–10 locali con menu reali e supporto diretto.

Preparazione:

- materiale QR stampabile in alta qualità e in bianco/nero;
- onboarding assistito del ristoratore;
- importazione iniziale del menù;
- revisione manuale di ogni allergene;
- test QR da telefoni diversi e con rete lenta;
- canale supporto e procedura per correggere rapidamente un menù;
- registro degli incidenti e feedback strutturato.

Metriche beta:

- tempo medio da registrazione a menù pubblicato;
- percentuale ristoratori che completano il setup;
- percentuale piatti completi e verificati;
- tempo al primo scan cliente;
- menu view → dettaglio piatto → azione;
- scansioni QR per locale;
- errori semaforo segnalati;
- ristoratori attivi dopo 7 e 30 giorni;
- crash/error rate e tempi API.

Criteri di uscita beta:

- nessun blocco nei flussi login, QR, menu e pubblicazione;
- menù aggiornabile senza intervento tecnico;
- backup ripristinato almeno una volta;
- fallback demo disabilitati in staging/prod;
- privacy e disclaimer approvati;
- supporto capace di gestire una correzione urgente.

### Fase 5 — Lancio commerciale e crescita

Solo dopo il beta si attivano e si ottimizzano commercialmente le funzioni avanzate già previste:

- Stripe live e piani verificati;
- pagina pubblica ristorante SEO e sitemap;
- landing con un solo messaggio e demo semaforo;
- referral e boost solo se misurabili;
- app store iOS/Android;
- notifiche e analytics più avanzati;
- espansione lingue e città;
- integrazione reale Apple Health, mantenendo nel frattempo l'export e le funzioni SOS già presenti;
- funzioni NFC, social e automazioni AI avanzate in una fase successiva, senza rimuovere le basi già realizzate.

## Cose da non fare adesso

- aggiungere altre feature prima di chiudere il core loop, ma mantenere tutte quelle già presenti;
- rifare contemporaneamente app, dashboard e backend senza una baseline;
- mettere tutte le funzioni in Home;
- usare AI per decidere da sola l'idoneità alimentare;
- trattare dati mancanti come verdi;
- lasciare mock Stripe/AI/storage attivi in ambienti esposti;
- spostare il focus sul feed social o sulle recensioni prima della fiducia sui dati; recensioni e moderazione restano comunque nel prodotto;
- fare un redesign estetico senza consolidare token e componenti;
- fare modifiche distruttive al worktree attuale.

## Ordine pratico di implementazione

1. Snapshot del lavoro attuale e definizione beta scope.
2. Core loop cliente: onboarding breve, profilo allergeni, QR, menù e semaforo.
3. Activation wizard ristoratore.
4. Qualità dati e gate di pubblicazione del menù.
5. Unificazione componenti e design system.
6. Stati di errore/offline/accessibilità.
7. Alembic/MySQL, auth, storage, privacy, Stripe e osservabilità.
8. Beta reale con 5–10 ristoratori.
9. Correzione dei problemi osservati.
10. Lancio e successiva attivazione/completamento delle funzioni avanzate già previste.

## Verifica end-to-end obbligatoria

### Mobile cliente

- nuovo utente completa consenso e profilo;
- profilo vuoto e profilo con allergeni;
- QR valido, QR non valido e codice manuale;
- menù con contenuto, tracce, dati mancanti e nessun menù;
- semaforo coerente su iOS e Android;
- offline con messaggio e data ultimo aggiornamento;
- VoiceOver/TalkBack e dimensione testo aumentata;
- scanner barcode e limite piano;
- cancellazione account con conferma.

### Ristoratore

- registrazione e creazione locale;
- completamento wizard;
- import menu da foto/URL con AI e revisione manuale;
- blocco pubblicazione per dati incompleti;
- conferma cucina, versione e audit;
- QR stampato che apre la pagina corretta;
- modifica menù e invalidazione corretta dei dati precedenti;
- piano, trial, pagamento fallito e downgrade.

### Backend/infrastruttura

- test unitari semaforo e compatibilità;
- test API su auth, profilo, ristorante, menù, recensioni e billing;
- test su MySQL reale/containerizzato;
- test migrazioni da schema esistente;
- test webhook Stripe idempotenti;
- test accesso e cancellazione documenti medici;
- test backup e restore;
- test health check, log e alert;
- build web e build mobile di staging.

## Risultato atteso

Alla fine della prima release seria AllerTgy non deve sembrare più grande: deve sembrare più chiara.

Il cliente deve pensare: “imposto il mio profilo, scansiono, capisco”.

Il ristoratore deve pensare: “inserisco il menù, verifico gli allergeni, pubblico il QR e so cosa è aggiornato”.

Il team deve poter dimostrare: “ogni dato critico ha una fonte, una data, un responsabile e un comportamento verificato”.
