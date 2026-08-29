# 📜 Documentazione Legale, Privacy e Copyright — AllerTgy

Documento di riferimento contenente tutti i testi legali, le informative sulla privacy (GDPR), i termini di servizio, il disclaimer medico-sanitario e le note sul copyright per la piattaforma **AllerTgy** (App Mobile, Dashboard Web e API).

---

## 1.  ©️ Copyright e Proprietà Intellettuale

### 1.1 Nota di Copyright (Footer Web, App Store e Splash Screen)
```text
© 2026 AllerTgy. Tutti i diritti riservati.
Marchio registrato e software proprietario.
```

### 1.2 Testo Esteso di Proprietà Intellettuale
```markdown
### Diritti d'Autore e Proprietà Intellettuale

Tutti i contenuti presenti su AllerTgy (inclusi, a titolo esemplificativo ma non esaustivo: codice sorgente, architettura software, algoritmi di matching del semaforo allergenico, design dell'interfaccia utente (UI/UX), elementi grafici, icone, loghi, marchi, testi descrittivi e banche dati) sono di esclusiva proprietà di AllerTgy o dei rispettivi aventi diritto e sono protetti dalle leggi italiane ed internazionali sul diritto d'autore, sui marchi e sui brevetti (Legge 22 aprile 1941 n. 633 e D.Lgs. 10 febbraio 2005 n. 30 - Codice della Proprietà Industriale).

È severamente vietata la riproduzione, duplicazione, decompilazione (reverse engineering), distribuzione, vendita, estrazione di dati non autorizzata (web scraping o data mining) o qualsiasi uso commerciale non espressamente autorizzato per iscritto dai titolari di AllerTgy.

I contenuti caricati dai Ristoratori (denominazione del locale, loghi aziendali, descrizioni dei piatti, menù e fotografie degli alimenti) restano di titolarità dei rispettivi esercenti, i quali concedono ad AllerTgy una licenza gratuita, non esclusiva e mondiale limitata all'erogazione, promozione e visualizzazione dei servizi della piattaforma.
```

---

## 2. 🛡️ Informativa Privacy (GDPR - Regolamento UE 2016/679)

```markdown
# Informativa sul Trattamento dei Dati Personali
*Ai sensi degli Artt. 13 e 14 del Regolamento (UE) 2016/679 ("GDPR")*
*Ultimo aggiornamento: Versione 2026-08*

Gentile Utente,
la protezione della tua privacy e la massima tutela dei tuoi dati personali sono per AllerTgy una priorità assoluta, specialmente trattando informazioni connesse alla tua salute e al tuo benessere alimentare. Di seguito ti illustriamo in modo chiaro e trasparente come raccogliamo, utilizziamo, proteggiamo e conserviamo i tuoi dati.

---

### 1. Titolare del Trattamento
Il Titolare del trattamento dei dati personali è:
- **Titolare:** AllerTgy (di seguito anche "Titolare" o "AllerTgy")
- **Sede Legale:** [Inserire Indirizzo / Sede Legale]
- **Codice Fiscale / P.IVA:** [Inserire P.IVA / C.F.]
- **Email di contatto per la Privacy e l'esercizio dei diritti:** privacy@allertgy.it

---

### 2. Categorie di Dati Personali Trattati

#### A. Dati Personali Comuni (Utenti e Ristoratori)
- **Dati anagrafici e di contatto:** Nome, cognome, indirizzo email, eventuale numero di telefono.
- **Credenziali di autenticazione:** Indirizzo email e password (memorizzata esclusivamente tramite funzione crittografica di hash irreversibile con algoritmo bcrypt/Argon2).
- **Dati professionali ed aziendali (Ristoratori):** Ragione sociale, Partita IVA/Codice Fiscale, indirizzo dell'esercizio, referente aziendale per gli allergeni, orari, recapiti del locale.
- **Dati di pagamento e fatturazione:** Dati di fatturazione elettronica (Codice SDI/PEC). I dati relativi agli strumenti di pagamento (numeri di carta di credito/debito) sono gestiti direttamente ed esclusivamente dal fornitore di pagamento certificato PCI-DSS (Stripe Payments Europe, Ltd.); AllerTgy non accede né memorizza mai le coordinate bancarie o i numeri di carta.
- **Dati tecnici e di navigazione:** Indirizzo IP, identificativi del dispositivo (Device ID / Push Token per notifiche), log degli accessi a fini di sicurezza e rate limiting, dati sui crash (in forma anonima).

#### B. Dati Particolari / Sanitari (Art. 9 GDPR) — Profilo Allergenico
- **Profilo allergenico:** Selezione degli allergeni alimentari (inclusi i 14 allergeni ufficiali UE ex Reg. 1169/2011), grado di intensità/sensibilità dichiarata (es. Lieve, Moderata, Grave/Anafilassi) ed eventuali intolleranze alimentari.
- **Documenti medici e referti allergologici:** Eventuali copie di certificati medici o test allergologici (Prick test, RAST test, diagnosi specialistiche) caricati volontariamente dall'utente per l'archiviazione personale o per l'estrazione automatica del profilo.

---

### 3. Finalità del Trattamento e Basi Giuridiche

| Finalità | Dati Coinvolti | Base Giuridica (GDPR) |
|---|---|---|
| **1. Registrazione e fruizione del servizio base** (gestione account, consultazione menù, calcolo del semaforo allergenico) | Dati anagrafici, credenziali, profilo allergenico | **Esecuzione di un contratto** (Art. 6.1.b) e **Consenso esplicito** per i dati sanitari (Art. 9.2.a) |
| **2. Trattamento dei dati sanitari** (memorizzazione e associazione delle allergie/intolleranze al profilo) | Allergie, intolleranze, grado di gravità | **Consenso esplicito, libero e specifico** (Art. 9.2.a GDPR), revocabile in ogni momento |
| **3. Analisi AI di documenti medici e referti** (estrazione automatica tramite OCR/Vision) | Foto/PDF del referto medico | **Consenso specifico e preventivo per-documento** (Art. 9.2.a GDPR). I dati estratti richiedono sempre la revisione e conferma manuale dell'utente |
| **4. Gestione abbonamenti e fatturazione B2B / B2C** | Dati anagrafici, fiscali e di transazione Stripe | **Esecuzione del contratto** (Art. 6.1.b) e **Adempimento di obblighi legali e fiscali** (Art. 6.1.c) |
| **5. Sicurezza della piattaforma, prevenzione frodi e abusi** | Log accessi, indirizzi IP, rate-limiting | **Legittimo interesse del Titolare** (Art. 6.1.f) a garantire l'integrità dei sistemi |
| **6. Notifiche push e comunicazioni transazionali** | Email, Push Token del dispositivo | **Esecuzione del contratto** per notifiche di servizio / **Consenso** per notifiche facoltative |

---

### 4. Trattamento dei Dati Tramite Intelligenza Artificiale (AI Vision)

AllerTgy offre una funzionalità opzionale di scansione assistita tramite AI (Google Gemini Vision) per facilitare la compilazione del menù da parte del ristoratore o l'estrazione degli allergeni da un referto medico:
- **Natura assistiva:** L'algoritmo funge esclusivamente da suggeritore ottico.
- **Nessuna decisione automatizzata:** Nessun dato estratto dall'AI viene pubblicato o salvato nel profilo sanitario senza che l'utente o il ristoratore lo abbia esplicitamente verificato, modificato e confermato.
- **Protezione del dato:** Le immagini trasmesse all'API AI vengono elaborate in modalità stateless (senza conservazione o addestramento dei modelli proprietari di terzi sui dati sanitari degli utenti).

---

### 5. Destinatari dei Dati e Sub-Responsabili (Data Processors)

I dati personali possono essere comunicati esclusivamente a fornitori tecnici selezionati che agiscono in qualità di Responsabili del Trattamento ex Art. 28 GDPR:

| Fornitore | Servizio / Ruolo | Ubicazione Dati |
|---|---|---|
| **Hostinger International Ltd.** | Hosting infrastruttura e database MySQL | Unione Europea (EEA) |
| **Cloudflare, Inc. (Cloudflare R2)** | Storage protetto per immagini e documenti medici con URL crittografati a tempo | Unione Europea / USA (Clausole Standard DPA) |
| **Google Ireland Ltd. / Cloud** | Servizi API AI Vision (elaborazione immagini) | Unione Europea / DPA con Standard Contractual Clauses |
| **Stripe Payments Europe, Ltd.** | Gateway di pagamento e gestione abbonamenti | Unione Europea / DPA conforme |
| **Resend, Inc.** | Provider di posta transazionale per password reset e avvisi | Unione Europea / USA (SCC) |
| **Expo (650 Industries, Inc.)** | Infrastruttura per l'invio delle notifiche push su smartphone | USA / DPA |

---

### 6. Misure di Sicurezza Tecniche e Organizzative

AllerTgy adotta rigorose misure di sicurezza conformi all'Art. 32 del GDPR:
- **Cifratura in transito e a riposo:** Tutte le comunicazioni avvengono esclusivamente tramite protocollo crittografico TLS/HTTPS 1.3. I file contenenti referti medici sono salvati in bucket privati e resi accessibili solo tramite URL firmati con scadenza temporale (Signed URLs) a breve durata.
- **Separazione logica:** I dati sanitari sono logicamente segregati e accessibili solo al titolare dell'account tramite token JWT a scadenza limitata.
- **Logging e Auditing:** Tracciamento puntuale degli accessi e delle modifiche alle informazioni sensibili.

---

### 7. Periodo di Conservazione dei Dati (Data Retention)

- **Dati dell'Account e Profilo Allergenico:** Conservati per tutta la durata di attività dell'account. In caso di cancellazione dell'account da parte dell'utente, tutti i dati sanitari e i documenti caricati vengono eliminati definitivamente entro 48 ore.
- **Inattività:** Gli account non utilizzati per oltre 24 mesi consecutivi e i relativi allegati sanitari vengono automaticamente anonimizzati o cancellati.
- **Dati amministrativo-contabili:** Conservati per 10 anni in conformità agli obblighi di legge previsti dall'Art. 2220 del Codice Civile e dalla normativa fiscale.

---

### 8. Minori di Età

I servizi di AllerTgy e la creazione autonoma di un profilo con dati sanitari sono riservati a utenti che abbiano compiuto almeno **14 anni** (ai sensi dell'art. 2-quinquies del D.Lgs. 196/2003 e s.m.i.). Per i minori di 14 anni, la registrazione e la gestione del profilo allergenico ("Profili Famiglia") devono essere effettuate esclusivamente da un genitore o da chi ne esercita la responsabilità genitoriale.

---

### 9. Diritti dell'Interessato (Artt. 15-22 GDPR)

In qualsiasi momento, l'utente può esercitare i seguenti diritti:
1. **Diritto di Accesso (Art. 15):** Ottenere la conferma che sia o meno in corso un trattamento di propri dati e riceverne copia.
2. **Diritto di Rettifica (Art. 16):** Aggiornare o correggere dati inesatti direttamente dall'app o tramite richiesta.
3. **Diritto alla Cancellazione ("Diritto all'Oblio", Art. 17):** Richiedere l'eliminazione istantanea del proprio profilo e di tutti i dati sanitari.
4. **Diritto di Limitazione del Trattamento (Art. 18) e Opposizione (Art. 21).**
5. **Diritto alla Portabilità dei Dati (Art. 20):** Ricevere i propri dati in formato strutturato, di uso comune e leggibile da dispositivo automatico (JSON/CSV).
6. **Diritto di Revoca del Consenso:** Revocare in qualsiasi momento il consenso al trattamento dei dati sanitari senza pregiudicare la liceità del trattamento basato sul consenso prestato prima della revoca.
7. **Diritto di Reclamo:** Proporre reclamo all'Autorità Garante per la Protezione dei Dati Personali (Piazza Venezia n. 11, 00187 Roma - www.garanteprivacy.it).

Per esercitare qualsiasi diritto è possibile utilizzare le apposite opzioni nella schermata *Profilo* dell'App o inviare una richiesta formale all'indirizzo email: **privacy@allertgy.it**.
```

---

## 3. ⚠️ Disclaimer Medico e Tutela della Salute (Note Legali Cruciali)

```markdown
# Disclaimer Medico, di Sicurezza e Salute
### 🔴 IMPORTANTE — LEGGERE ATTENTAMENTE PRIMA DI UTILIZZARE L'APP

**1. ALLERTGY NON È UN DISPOSITIVO MEDICO**  
AllerTgy è un'applicazione software ad esclusivo scopo informativo e di supporto alla consultazione dei menù. AllerTgy **NON fornisce consulenze mediche, diagnosi cliniche, prescrizioni terapeutiche, né garantisce l'assoluta sicurezza biologica o chimica degli alimenti somministrati**.

**2. RESPONSABILITÀ DELLE DICHIARAZIONI SUGLI ALLERGENI**  
Tutte le informazioni relative agli ingredienti, agli allergeni contenuti (Reg. UE 1169/2011) e alle possibili tracce da contaminazione crociata presenti nei singoli piatti sono **inserite, dichiarate e certificate esclusivamente e sotto la propria diretta responsabilità dal Ristoratore / Titolare dell'Esercizio commerciale**.  
AllerTgy non effettua controlli chimici o ispezioni fisiche all'interno delle cucine dei locali e non può verificare eventuali sostituzioni d'emergenza di materie prime o errori umani del personale del locale.

**3. SIGNIFICATO E LIMITI DEL "SEMAFORO ALLERTGY"**  
Il sistema cromatico a semaforo è un algoritmo di confronto matematico tra il profilo dichiarato dall'utente e la scheda del menù redatta dal ristoratore:
- 🟢 **VERDE (Nessun allergene dichiarato):** Indica che nessuno degli allergeni presenti nel tuo profilo coincide con quelli dichiarati dal locale per quel piatto. **ATTENZIONE: NON SIGNIFICA CHE IL PIATTO SIA PRIVO DI RISCHI AL 100%.** Possono esistere contaminazioni ambientali non dichiarate o variazioni dell'ultimo minuto.
- 🟡 **GIALLO (Possibili Tracce / Attenzione):** Indica che il piatto potrebbe contenere tracce da contaminazione crociata dichiarate dal ristorante o che sono presenti avvertenze specifiche.
- 🔴 **ROSSO (Allergene Presente):** Uno o più ingredienti contengono direttamente allergeni incompatibili con il tuo profilo. Si sconsiglia vivamente il consumo.

**4. OBBLIGO INDEROGABILE DI COMUNICAZIONE AL PERSONALE DI SALA**  
**PRIMA DI ORDINARE O CONSUMARE QUALSIASI ALIMENTO O BEVANDA, L'UTENTE È SEMPRE TENUTO A COMUNICARE ESPLICITAMENTE E VERBALMENTE LE PROPRIE ALLERGIE O INTOLLERANZE AL PERSONALE DI SALA E ALLO CHEF DEL LOCALE**, verificando direttamente le procedure di preparazione e prevenzione delle contaminazioni.

**5. SOGGETTI A RISCHIO DI ANAFILASSI O ALLERGIE GRAVI**  
Se soffri di allergie gravi con rischio di shock anafilattico, non affidarti esclusivamente a soluzioni digitali: porta sempre con te i farmaci prescritti dal tuo medico specialista (es. adrenalina autoiniettabile) e pretendi sempre conferma diretta dallo staff della cucina.

**6. GESTIONE DELLE EMERGENZE SANITARIE**  
In caso di insorgenza di sintomi di reazione allergica (gonfiore delle vie aeree, difficoltà respiratoria, orticaria, shock):
- **Contatta immediatamente il Numero Unico Europeo di Emergenza: 📞 112** (o 118 ove attivo).
- Utilizza immediatamente i dispositivi salvavita prescritti.
- AllerTgy non monitora parametri vitali e non offre assistenza sanitaria d'emergenza.
```

---

## 4. 📝 Termini e Condizioni Generali di Servizio (Terms of Service)

```markdown
# Termini di Servizio (Condizioni Generali di Contratto)
*Ultimo aggiornamento: Versione 2026-08*

### 1. Oggetto e Ambito di Applicazione
I presenti Termini di Servizio disciplinano l'accesso e l'utilizzo della piattaforma AllerTgy (inclusi sito web, dashboard per esercenti e applicazioni mobili per iOS e Android). La piattaforma ha lo scopo di agevolare l'incontro tra consumatori con esigenze alimentari specifiche (allergie/intolleranze) e ristoratori che pubblicano informazioni relative ai propri piatti e allergeni.

---

### 2. Definizioni
- **Piattaforma / AllerTgy:** Il sistema software, le API, il sito web e l'app mobile gestiti da AllerTgy.
- **Utente / Cliente:** La persona fisica che utilizza l'app per consultare schede locali, menù e gestire il proprio profilo allergenico.
- **Ristoratore / Esercente:** Il titolare, gestore o referente autorizzato di un esercizio commerciale di somministrazione alimenti e bevande (ristorante, bar, pizzeria, catering, ecc.).
- **Scheda Locale e Menù:** L'insieme delle informazioni su piatti, ingredienti, prezzi e 14 allergeni UE pubblicate dal Ristoratore.

---

### 3. Account e Sicurezza
1. L'Utente e il Ristoratore si impegnano a fornire informazioni veritiere, accurate e complete all'atto della registrazione.
2. Le credenziali di accesso sono strettamente personali e non cedibili. L'utente è l'unico custode della riservatezza della propria password ed è responsabile di ogni attività svolta tramite il proprio account.
3. AllerTgy si riserva il diritto di sospendere o cancellare account che forniscano dati falsi o violino le presenti condizioni.

---

### 4. Condizioni B2C (Clienti)
- L'accesso all'app e la consultazione del semaforo per il profilo individuale sono gratuiti.
- L'utente riconosce la natura meramente informativa del semaforo e accetta integralmente il **Disclaimer Medico e di Sicurezza**.

---

### 5. Condizioni B2B e Obblighi del Ristoratore (Regolamento UE 1169/2011)
1. **Veridicità delle informazioni:** Il Ristoratore è legalmente e penalmente responsabile della corretta indicazione delle sostanze o prodotti che provocano allergie o intolleranze (Allegato II del Regolamento UE 1169/2011 e D.Lgs. 231/2017) per ogni piatto inserito nel proprio menù.
2. **Aggiornamento tempestivo:** Il Ristoratore ha l'obbligo di aggiornare tempestivamente il menù digitale su AllerTgy ad ogni variazione di fornitura, ricetta o procedura in cucina.
3. **Approvazione con conferma legale:** La pubblicazione o ripubblicazione del menù richiede la conferma espressa da parte del Ristoratore che i dati sono stati verificati con il responsabile cucina/HACCP.
4. **Registro Allergeni Cartaceo:** Il Ristoratore è consapevole che l'utilizzo del menù digitale AllerTgy non esonera dall'obbligo di legge di tenere a disposizione del pubblico e degli organi di controllo (ASL/NAS) il registro cartaceo o cartello informativo aggiornato.

---

### 6. Piani di Abbonamento e Pagamenti (B2B)
1. **Piani Commerciali:** I piani a pagamento per Ristoratori (Base, Pro) e i servizi aggiuntivi (Boost, Plus Famiglia) sono erogati secondo i prezzi e le caratteristiche descritte sulla piattaforma al momento della sottoscrizione.
2. **Fatturazione e Rinnovo Automatico:** Gli abbonamenti si rinnovano tacitamente su base mensile o annuale. Il pagamento viene addebitato tramite la piattaforma Stripe.
3. **Disdetta:** Il Ristoratore può recedere dal rinnovo automatico in qualsiasi momento con un semplice click dal proprio portale Stripe / Dashboard; il servizio rimarrà attivo fino al termine del periodo già corrisposto, senza costi di recesso o penali.
4. **Esclusione del Diritto di Recesso Consumatori (B2B):** Poiché il servizio Ristoratori è rivolto a professionisti e titolari di P.IVA, non si applica il diritto di ripensamento di 14 giorni previsto per i consumatori ai sensi del Codice del Consumo.

---

### 7. Limitazione di Responsabilità
Nei limiti massimi consentiti dalla normativa applicabile, AllerTgy declina ogni responsabilità per:
- Danni diretti o indiretti alla salute derivanti da inesattezze, omissioni o mancati aggiornamenti degli allergeni da parte del Ristoratore.
- Inosservanza da parte dell'Utente dell'obbligo di comunicare le proprie allergie al personale del ristorante prima del consumo.
- Contaminazioni crociate accidentali avvenute nei locali di somministrazione.
- Interruzioni temporanee del servizio dovute a cause di forza maggiore, manutenzione straordinaria o guasti dei provider di telecomunicazioni.

---

### 8. Legge Applicabile e Foro Competente
I presenti Termini sono regolati dalla legge italiana.
- Per le controversie con **Clienti Consumatori**, il foro competente è inderogabilmente quello del luogo di residenza o domicilio del consumatore.
- Per le controversie commerciali **B2B con i Ristoratori**, il foro competente esclusivo è quello della sede legale di AllerTgy.
```

---

## 5. 👨‍🍳 Dichiarazione di Responsabilità del Ristoratore (Cartello & Menù Legale)

```markdown
# Dichiarazione di Conformità e Responsabilità Allergeni
*(Ai sensi del Regolamento UE n. 1169/2011 e D.Lgs. 15 dicembre 2017 n. 231)*

Il sottoscritto, in qualità di Legale Rappresentante o Referente delegato per la sicurezza alimentare dell'Esercizio:
- **Dichiara e garantisce** che tutte le informazioni relative alla presenza di ingredienti allergenici (di cui all'Allegato II del Reg. UE 1169/2011) e alle possibili tracce da contaminazione crociata per ciascun piatto pubblicato sul menù digitale AllerTgy corrispondono alla realtà e sono conformi al piano di autocontrollo igienico-sanitario (HACCP) del locale.
- **Si impegna** ad aggiornare tempestivamente il menù ad ogni minima variazione di ingredienti, semilavorati o marchi di fornitura.
- **Riconosce** che la corretta informazione al consumatore è un obbligo inderogabile e che AllerTgy fornisce unicamente la piattaforma tecnologica di visualizzazione, rimanendo la titolarità e la responsabilità dei contenuti esclusivamente in capo all'esercente.
- **Conferma**, nel caso di menù importati tramite scansione ottica / intelligenza artificiale, di aver effettuato il controllo umano e la verifica manuale piatto per piatto prima della pubblicazione.
```

---

## 6. 🍪 Cookie e Tracking Policy

```markdown
# Informativa sui Cookie e Tecnologie Simili (Cookie Policy)

La presente Cookie Policy descrive le modalità di utilizzo dei cookie e delle tecnologie affini da parte di AllerTgy.

### 1. Cosa sono i Cookie?
I cookie sono piccoli file di testo che i siti visitati inviano al terminale dell'utente, dove vengono memorizzati per essere ritrasmessi agli stessi siti alla visita successiva.

### 2. Cookie Utilizzati da AllerTgy

AllerTgy adotta una politica rigorosa di **minimizzazione dei dati e rispetto della privacy**:
- **Cookie Tecnici Strettamente Necessari:** Utilizzati esclusivamente per garantire il funzionamento della piattaforma, l'autenticazione dell'utente (mantenimento della sessione di login protetta via token) e la memorizzazione delle preferenze di interfaccia. Non richiedono il preventivo consenso dell'utente.
- **Cookie di Terze Parti per Pagamenti Sicuri (Stripe):** Nelle sezioni di checkout e abbonamento per ristoratori, Stripe utilizza cookie tecnici e antifrode strettamente necessari per elaborare le transazioni in sicurezza e prevenire attività fraudolente.
- **NESSUN Cookie di Profilazione Commerciale:** AllerTgy **NON** utilizza cookie di profilazione per tracciare le abitudini di consumo degli utenti a fini pubblicitari e **NON** vende i tuoi dati a broker pubblicitari terzi.

### 3. Gestione e Disabilitazione dei Cookie
L'utente può in qualsiasi momento gestire le preferenze relative ai cookie direttamente dalle impostazioni del proprio browser web (Chrome, Safari, Firefox, Edge), bloccando o cancellando i cookie. Si segnala che la disabilitazione totale dei cookie tecnici potrebbe compromettere il corretto funzionamento delle aree riservate del servizio.
```

---

## 7. 📲 Formule di Consenso UX / UI (Testi per Schermate e Checkbox)

Questi testi sono formulati secondo i requisiti di granularità e consenso esplicito del GDPR (Art. 7 e 9).

### 7.1 Registrazione Utente (App Mobile & Web)
```text
[X] Ho letto e accetto i Termini di Servizio e l'Informativa Privacy. (Obbligatorio)

[X] CONSENSO DATI SANITARI (Art. 9 GDPR): Acconsento esplicitamente al trattamento delle informazioni relative alle mie allergie e intolleranze alimentari al fine esclusivo di visualizzare il semaforo di compatibilità dei menù. (Obbligatorio per attivare il semaforo)

[ ] Desidero ricevere notifiche push e aggiornamenti su locali con opzioni per le mie allergie. (Facoltativo)
```

### 7.2 Caricamento Referto Medico / Analisi AI (App Mobile)
```text
🤖 Consenso Scansione Documento Medico
"Acconsento all'elaborazione temporanea di questa foto/documento tramite intelligenza artificiale al solo scopo di individuare gli allergeni da suggerire nel mio profilo. Ho compreso che il risultato è un suggerimento automatico che dovrò verificare e confermare manualmente."
[  Conferma e Scansiona  ]    [ Annulla ]
```

### 7.3 Pubblicazione Menù Ristoratore (Dashboard Web)
```text
[X] Confermo sotto la mia responsabilità che le informazioni sugli allergeni inserite per ciascun piatto sono complete, accurate e verificate con la cucina ai sensi del Regolamento UE 1169/2011. (Obbligatorio per pubblicare)
```
