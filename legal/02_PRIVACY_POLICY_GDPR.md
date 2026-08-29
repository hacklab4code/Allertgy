# Informativa sul Trattamento dei Dati Personali (Privacy Policy)
*Ai sensi degli Artt. 13 e 14 del Regolamento (UE) 2016/679 ("GDPR")*  
*Versione: 2026-08-29*

---

Gentile Utente,  
la protezione della tua privacy e la sicurezza delle tue informazioni personali costituiscono per **AllerTgy** un valore fondamentale. Poiché la nostra piattaforma tratta dati sensibili connessi alla tua salute e al tuo benessere alimentare (allergie e intolleranze), adottiamo misure tecniche e organizzative all'avanguardia per garantire la massima riservatezza e conformità al Regolamento Generale sulla Protezione dei Dati (GDPR).

---

### 1. Titolare del Trattamento
Il Titolare del trattamento dei dati personali è:
- **Titolare:** AllerTgy
- **Sede Legale:** [Inserire Sede Legale / Indirizzo prima del lancio pubblico]
- **Codice Fiscale / P.IVA:** [Inserire P.IVA / C.F.]
- **Email di contatto per la Privacy:** `privacy@allertgy.it`

---

### 2. Categorie di Dati Personali Oggetto del Trattamento

#### A. Dati Personali Comuni (Utenti e Ristoratori)
- **Dati Anagrafici e di Contatto:** Nome, cognome, indirizzo email, eventuale numero di telefono.
- **Credenziali di Autenticazione:** Password crittografata con algoritmo di hash irreversibile sicuro (bcrypt/Argon2). AllerTgy non conosce né memorizza mai password in chiaro.
- **Dati Professionali e di Esercizio (Ristoratori):** Ragione sociale, P.IVA/Codice Fiscale, indirizzo del locale, referente designato per gli allergeni, recapiti telefonici e orari di apertura.
- **Dati di Pagamento e Fatturazione:** Dati di fatturazione elettronica (Codice Destinatario SDI / PEC). I dati delle carte di credito/debito sono gestiti direttamente ed esclusivamente dal gateway di pagamento certificato PCI-DSS (Stripe Payments Europe Ltd.). AllerTgy non ha accesso né memorizza numeri di carte di pagamento.
- **Dati Tecnici di Navigazione e Dispositivo:** Indirizzo IP, identificativo univoco del dispositivo (Device ID / Push Token Expo per l'invio di notifiche), log di accesso per la sicurezza informatica e la prevenzione di attacchi o accessi non autorizzati.

#### B. Dati Particolari / Sanitari (Art. 9 GDPR) — Profilo Allergenico
- **Allergie e Intolleranze Alimentari:** Selezione degli allergeni (inclusi i 14 allergeni ufficiali dell'Allegato II del Reg. UE 1169/2011), intensità della sensibilità dichiarata (*Lieve, Moderata, Grave/Rischio Anafilassi*) e preferenze alimentari.
- **Referti Medici e Documenti Sanitari Facoltativi:** Certificati allergologici, test diagnostici (Prick test, RAST test) o note mediche che l'utente sceglie liberamente di archiviare nella propria area privata o di sottoporre a scansione assistita.

---

### 3. Finalità del Trattamento e Basi Giuridiche

| Finalità | Categorie di Dati | Base Giuridica (GDPR) |
|---|---|---|
| **1. Registrazione e gestione account** | Dati anagrafici, email, credenziali | **Esecuzione di un contratto** (Art. 6.1.b GDPR) |
| **2. Calcolo e visualizzazione del Semaforo Allergenico** | Profilo allergenico, intensità reazione | **Consenso esplicito dell'interessato** (Art. 9.2.a GDPR) |
| **3. Analisi AI assistita di referti medici (Vision/OCR)** | Immagini o PDF del documento medico | **Consenso specifico preventivo per-documento** (Art. 9.2.a GDPR). Nessun dato viene registrato senza conferma manuale |
| **4. Gestione abbonamenti e fatturazione B2B / B2C** | Dati anagrafici, fiscali e transazionali | **Esecuzione contratto** (Art. 6.1.b) e **Adempimento obblighi legali e fiscali** (Art. 6.1.c) |
| **5. Sicurezza dei sistemi e prevenzione abusi** | Log accessi, indirizzi IP, rate-limiting | **Legittimo interesse del Titolare** (Art. 6.1.f GDPR) a garantire la sicurezza informatica |
| **6. Notifiche push e comunicazioni di servizio** | Email, Push Token del dispositivo | **Esecuzione del contratto** per comunicazioni tecniche / **Consenso** per comunicazioni facoltative |

---

### 4. Trattamento dei Dati Tramite Intelligenza Artificiale (AI Vision)

Per facilitare l'acquisizione dei menù da parte degli esercenti o l'individuazione degli allergeni dai referti medici da parte degli utenti, AllerTgy integra funzionalità opzionali basate sull'elaborazione visiva automatica (Google Gemini Vision):
- **Ruolo di Supporto:** L'algoritmo non prende decisioni autonome né emette diagnosi cliniche: genera unicamente una bozza di suggerimenti.
- **Validazione Umana Obbligatoria:** Nessun allergene estratto viene associato al profilo o pubblicato nel menù senza che l'utente o il ristoratore lo abbia espressamente esaminato, corretto e confermato.
- **Privacy by Design:** L'elaborazione avviene in modalità *stateless* e crittografata; i dati sanitari e i documenti caricati non vengono riutilizzati per addestrare modelli linguistici o algoritmi pubblici terzi.

---

### 5. Destinatari dei Dati e Sub-Responsabili (Data Processors)

I dati personali potranno essere trattati unicamente da fornitori di servizi rigorosamente selezionati e nominati Responsabili del Trattamento ai sensi dell'Art. 28 GDPR:

| Fornitore | Servizio Fornito | Sede Trattamento |
|---|---|---|
| **Hostinger International Ltd.** | Hosting infrastruttura server e database | Unione Europea (EEA) |
| **Cloudflare, Inc. (R2 Storage)** | Storage crittografato di file e documenti con URL a tempo | Unione Europea / DPA con Clausole Standard |
| **Google Ireland Ltd. / Cloud** | Servizi API AI Vision per scansione assistita | Unione Europea / DPA conforme |
| **Stripe Payments Europe, Ltd.** | Gateway di pagamento e gestione abbonamenti | Unione Europea / Certificazione PCI-DSS |
| **Resend, Inc.** | Provider di posta elettronica transazionale | Unione Europea / USA (Clausole Standard) |
| **Expo (650 Industries, Inc.)** | Instradamento notifiche push ai dispositivi mobili | USA / DPA |

---

### 6. Misure di Sicurezza Tecniche e Organizzative

In conformità all'Art. 32 del GDPR, AllerTgy ha implementato elevate misure di sicurezza:
- Cifratura di tutte le comunicazioni tramite protocollo **TLS 1.3** / HTTPS.
- Archiviazione dei documenti sanitari in bucket privati con accesso consentito solo tramite **Signed URLs (URL firmati crittograficamente con scadenza temporale a pochi minuti)**.
- Password salvate unicamente in forma di hash non decifrabile.
- Segregazione logica dei dati sanitari e accesso tramite token JWT con rotazione temporale.
- Tracciamento e audit log dei tentativi di accesso anomali.

---

### 7. Conservazione dei Dati (Data Retention)

- **Dati del Profilo e Documenti Sanitari:** Conservati per l'intera durata dell'account attivo. Qualora l'utente cancelli il proprio account, tutti i dati sanitari e i referti caricati vengono eliminati dai server entro 48 ore.
- **Inattività:** Gli account privi di accessi per oltre 24 mesi consecutivi vengono notificati e successivamente anonimizzati o cancellati.
- **Dati Amministrativi e Contabili:** Conservati per 10 anni in ottemperanza agli obblighi di legge italiani (Art. 2220 C.C. e norme fiscali).

---

### 8. Minori di Età

I servizi di AllerTgy e la memorizzazione autonoma di dati sanitari sono destinati a soggetti di età pari o superiore a **14 anni** (ai sensi dell'art. 2-quinquies del D.Lgs. 196/2003 e s.m.i.).  
Per i minori di 14 anni, la registrazione e la gestione del profilo allergenico ("Profili Famiglia") devono essere eseguite esclusivamente da un genitore o dal tutore legale.

---

### 9. Diritti dell'Interessato (Artt. 15-22 GDPR)

In qualità di interessato, l'utente ha diritto di:
1. **Accesso (Art. 15):** Ottenere conferma del trattamento dei propri dati e riceverne copia.
2. **Rettifica (Art. 16):** Aggiornare o correggere dati inesatti o incompleti.
3. **Cancellazione ("Oblio", Art. 17):** Richiedere la cancellazione totale e tempestiva del proprio account e dei dati sanitari.
4. **Limitazione del Trattamento (Art. 18) e Opposizione (Art. 21).**
5. **Portabilità dei Dati (Art. 20):** Ricevere i propri dati in un formato strutturato, di uso comune e leggibile da dispositivo automatico (es. JSON/CSV).
6. **Revoca del Consenso:** Revocare in qualsiasi momento il consenso al trattamento dei dati sanitari senza pregiudicare la liceità del trattamento pregresso.
7. **Reclamo all'Autorità di Controllo:** Proporre reclamo al *Garante per la Protezione dei Dati Personali* (Piazza Venezia 11, 00187 Roma - www.garanteprivacy.it).

Per esercitare i propri diritti è possibile utilizzare i comandi presenti nella sezione *Profilo* dell'App Mobile o scrivere all'indirizzo: **`privacy@allertgy.it`**.
