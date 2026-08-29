"""Testi legali completi e versioni — fonte unica per API, app mobile e dashboard.

Quando un testo cambia: aggiorna la costante di versione corrispondente; app e web
richiederanno una nuova accettazione agli utenti con versione diversa.
"""

LEGAL_TERMS_VERSION = "2026-08-29"
PRIVACY_VERSION = "2026-08-29"
SAFETY_DISCLAIMER_VERSION = "2026-08-29"
MENU_CONFIRMATION_VERSION = "2026-08-29"
COOKIE_VERSION = "2026-08-29"
B2B_TERMS_VERSION = "2026-08-29"
COPYRIGHT_VERSION = "2026-08-29"

COPYRIGHT_MARKDOWN = """
# Copyright e Proprietà Intellettuale

**© 2026 AllerTgy. Tutti i diritti riservati.**

### 1. Titolarità dei Diritti
Tutti i contenuti, le funzionalità, il codice sorgente, i loghi, il marchio **AllerTgy**, la grafica, l'interfaccia utente (UI/UX), il design e le banche dati correlate sono di esclusiva proprietà di AllerTgy e sono protetti dalle leggi vigenti sul diritto d'autore e sulla proprietà industriale (Legge 22 aprile 1941 n. 633, D.Lgs. 10 febbraio 2005 n. 30 e successive modifiche).

### 2. Divieti e Limitazioni d'Uso
È fatto espresso divieto di:
- Copiare, riprodurre, pubblicare, distribuire o trasmettere in qualsiasi forma, totale o parziale, il software e i contenuti proprietari senza previo consenso scritto.
- Compiere azioni di reverse engineering, decompilazione o estrazione non autorizzata dei dati (data scraping / screen scraping).
- Utilizzare il marchio, il logo o i segni distintivi di AllerTgy in assenza di licenza formale.

### 3. Contenuti dei Ristoratori
I loghi, le denominazioni commerciali, le fotografie e i menù caricati dai Ristoratori restano di titolarità dei rispettivi esercenti, i quali concedono ad AllerTgy licenza d'uso gratuita, non esclusiva e limitata all'erogazione dei servizi della piattaforma.
"""

TERMS_MARKDOWN = """
# Termini e Condizioni Generali di Servizio

**1. Oggetto del Servizio** — AllerTgy è una piattaforma tecnologica che connette consumatori con allergie o intolleranze alimentari e attività di ristorazione. La piattaforma fornisce un sistema visivo di comparazione allergenica ("il semaforo": 🟢 nessun allergene dichiarato, 🟡 possibili tracce / attenzione, 🔴 allergene presente dichiarato).

**2. Definizioni**
- *Cliente/Utente*: persona fisica che utilizza l'applicazione per consultare menù e gestire il proprio profilo allergenico.
- *Ristoratore/Esercente*: utente professionale titolare o gestore di un locale, responsabile esclusivo dell'inserimento dei dati del menù.
- *Contenuti del Locale*: piatti, ingredienti, allergeni dichiarati, prezzi, foto e orari pubblicati dall'Esercente.

**3. Natura del Servizio e Limiti di Responsabilità** — AllerTgy è un **servizio informativo di supporto**. Non costituisce un dispositivo medico, non formula diagnosi né terapie sanitarie e **non sostituisce mai la comunicazione diretta e verbale con il personale del ristorante prima di ordinare**. Il semaforo indica unicamente la corrispondenza logica tra il profilo inserito dall'utente e gli allergeni **espressamente dichiarati dal ristoratore**. AllerTgy non garantisce l'assenza assoluta di contaminazioni crociate all'interno delle cucine né variazioni estemporanee di ricetta.

**4. Obblighi dell'Utente (Cliente)** — L'Utente si impegna a:
- Fornire informazioni veritiere e mantenere aggiornato il proprio profilo allergenico.
- **Comunicare SEMPRE le proprie allergie e intolleranze al personale di sala prima di consumare qualsiasi alimento o bevanda**, anche in presenza di semaforo verde.
- Custodire le proprie credenziali di accesso in modo sicuro e riservato.

**5. Obblighi del Ristoratore (Regolamento UE 1169/2011)** — Il Ristoratore dichiara e garantisce che:
- Tutte le informazioni sugli allergeni inserite sono accurate, aggiornate e conformi al Regolamento UE 1169/2011 e al piano HACCP del locale.
- Ogni variazione di ricetta, fornitore o ingrediente comporterà l'immediato aggiornamento del menù su AllerTgy.
- La generazione del menù tramite scansione automatizzata o AI richiede sempre la revisione e approvazione manuale dell'esercente prima della pubblicazione.

**6. Piani di Abbonamento e Fatturazione (B2B)** — I piani a pagamento per Ristoratori (Base, Pro) sono gestiti tramite Stripe. Il rinnovo è automatico e disattivabile in qualsiasi momento dal portale clienti, con validità fino al termine del periodo pagato.

**7. Proprietà Intellettuale** — Il software, il marchio, l'algoritmo del semaforo e i contenuti editoriali di AllerTgy appartengono in via esclusiva ad AllerTgy.

**8. Limitazione di Responsabilità** — Nei limiti inderogabili di legge, AllerTgy declina ogni responsabilità per danni alla salute derivanti da: dati inesatti o omessi dal ristoratore; mancata segnalazione verbale al personale da parte del cliente; contaminazioni accidentali in cucina; mancato rispetto del Disclaimer di sicurezza.

**9. Legge Applicabile e Foro Competente** — Il contratto è regolato dalla legge italiana. Per gli utenti consumatori è competente il foro di residenza o domicilio del consumatore. Per i rapporti commerciali con i ristoratori (B2B) è competente in via esclusiva il Foro della sede legale di AllerTgy.
"""

PRIVACY_MARKDOWN = """
# Informativa Privacy e Trattamento Dati Personali
*Ai sensi degli Artt. 13 e 14 del Regolamento (UE) 2016/679 ("GDPR")*

**1. Titolare del Trattamento**  
Il Titolare del trattamento è [Ragione sociale/nome del titolare da inserire], contattabile all'indirizzo email: [inserire].

**2. Categorie di Dati Trattati**
- **Dati comuni identificativi:** Nome, cognome, indirizzo email, identificativo dispositivo.
- **Credenziali:** Password memorizzata esclusivamente tramite hash crittografico irreversibile.
- **Dati Particolari / Sanitari (Art. 9 GDPR):** Profilo allergenico (14 allergeni UE, gravità della reazione es. lieve/moderata/grave, intolleranze) e documenti medici facoltativi caricati dall'utente (referti allergologici).
- **Dati di pagamento (B2B e Clienti Plus):** Gestiti in modo sicuro e conforme PCI-DSS da Stripe; AllerTgy non accede né memorizza dati di carte di credito.
- **Dati tecnici:** Log di sicurezza, indirizzi IP per rate-limiting e tutela dell'infrastruttura.

**3. Basi Giuridiche del Trattamento**
- *Erogazione del servizio contrattuale (Art. 6.1.b GDPR):* Creazione account, consultazione menù, calcolo semaforo.
- *Dati sanitari (Art. 9.2.a GDPR):* **Consenso esplicito, specifico e libero**, revocabile in qualsiasi momento dall'area profilo.
- *Analisi AI dei referti medici:* **Consenso specifico per-documento**, con elaborazione assistiva e conferma manuale obbligatoria da parte dell'utente.
- *Obblighi di legge e fiscali (Art. 6.1.c GDPR):* Fatturazione abbonamenti.
- *Legittimo interesse (Art. 6.1.f GDPR):* Sicurezza informatica e prevenzione frodi.

**4. Destinatari e Sub-Responsabili (Data Processors)**
I dati possono essere trattati da fornitori tecnici vincolati da accordi ex Art. 28 GDPR:
- **Hostinger International Ltd.** (Hosting e Database nell'Unione Europea).
- **Cloudflare R2** (Storage privato crittografato per file e referti, con URL firmati a scadenza).
- **Google Cloud / Gemini Vision** (Elaborazione AI immagini, senza memorizzazione permanente né riuso per training sui dati sanitari).
- **Stripe Payments Europe Ltd.** (Elaborazione pagamenti e fatturazione).
- **Resend** (Email transazionali per password reset e avvisi di sicurezza).
- **Expo** (Consegna notifiche push al dispositivo).

**5. Conservazione dei Dati (Data Retention)**
- I dati del profilo sanitario e i documenti medici restano memorizzati fino alla cancellazione dell'account o per un massimo di 24 mesi di inattività.
- L'utente può richiedere in ogni momento la cancellazione immediata dei propri dati.
- I dati fiscali e di fatturazione sono conservati per 10 anni a norma di legge.

**6. Diritti dell'Interessato (Artt. 15-22 GDPR)**
L'utente ha diritto di: accedere ai propri dati, richiederne la rettifica o la cancellazione ("oblio"), limitare il trattamento, richiedere la portabilità dei dati in formato elettronico, revocare il consenso in qualsiasi momento e proporre reclamo al Garante per la Protezione dei Dati Personali (www.garanteprivacy.it).

**7. Minori di Età**
La gestione autonoma di un profilo con dati sanitari è riservata a utenti con almeno 14 anni. Per i minori di 14 anni, il profilo deve essere gestito da un genitore o tutore tramite le funzioni di profilo famiglia.
"""

SAFETY_MARKDOWN = """
# Disclaimer di Sicurezza, Salute e Tutela Medica

### ⚠️ ALLERTGY NON È UN DISPOSITIVO MEDICO
AllerTgy è uno strumento software di supporto e consultazione. Non fornisce consulenza medica, non effettua diagnosi e non può sostituire il giudizio clinico di un medico specialista.

### 🍽️ RESPONSABILITÀ DEI DATI DEL MENÙ
Le informazioni sugli ingredienti e sugli allergeni di ciascun piatto sono **dichiarate sotto l'esclusiva responsabilità del Ristoratore** ai sensi del Reg. UE 1169/2011. AllerTgy non ha il controllo diretto delle cucine e non può escludere contaminazioni crociate accidentali o modifiche dell'ultimo minuto non registrate.

### 🚥 IL SEMAFORO ALLERTGY
- 🟢 **Verde (Nessun allergene dichiarato):** Il piatto non contiene gli allergeni specificati nel tuo profilo in base a quanto inserito dal ristorante. **Non garantisce il rischio zero: comunica sempre le tue allergie al personale.**
- 🟡 **Giallo (Possibili tracce / Attenzione):** Il piatto potrebbe presentare rischi di contaminazione crociata dichiarati dal locale. Chiedi chiarimenti prima di ordinare.
- 🔴 **Rosso (Allergene presente):** Il piatto contiene uno o più allergeni non compatibili con il tuo profilo. Evita il consumo.

### 🗣️ COMUNICAZIONE OBBLIGATORIA AL PERSONALE
**Prima di ordinare, comunica SEMPRE le tue allergie o intolleranze al personale di sala**, accertandoti delle modalità di preparazione del cibo.

### 🚨 GESTIONE DELLE EMERGENZE
In caso di reazione allergica o anafilassi:
1. **Contatta immediatamente il Numero Unico di Emergenza 112**.
2. Utilizza tempestivamente i dispositivi medici salvavita prescritti dal tuo medico (es. autoiniettore di adrenalina).
3. AllerTgy non gestisce chiamate di soccorso né monitora emergenze sanitarie.
"""

OWNER_DECLARATION_MARKDOWN = """
# Dichiarazione di Responsabilità del Ristoratore
*(Regolamento UE n. 1169/2011 - Art. 44 e Allegato II)*

Il sottoscritto, in qualità di titolare, gestore o referente per la sicurezza alimentare dell'Esercizio:
1. **Dichiara** che le informazioni sugli allergeni inserite per ciascun piatto sono veritiere, complete e aggiornate in conformità al piano di autocontrollo (HACCP) del locale.
2. **Si impegna** ad aggiornare immediatamente il menù su AllerTgy in caso di variazioni negli ingredienti, ricette o fornitori.
3. **Conferma**, nel caso di utilizzo di strumenti di riconoscimento ottico / intelligenza artificiale per l'acquisizione dei menù, di aver eseguito un controllo manuale su ciascun piatto prima di procedere alla pubblicazione.
4. **Riconosce** che la corretta informazione alla clientela è un obbligo di legge inderogabile e che l'Esercizio rimane l'unico responsabile dei contenuti pubblicati.
"""

REGISTRY_PDF_LEGAL_NOTICE = (
    "Documento informativo sugli allergeni ai sensi del Regolamento (UE) n. 1169/2011 "
    "(informazione sugli alimenti non preimballati — art. 44 e Allegato II). "
    "Elenca le sostanze o i prodotti che provocano allergie o intolleranze utilizzati "
    "nella preparazione di ciascun piatto offerto dal locale, incluse le possibili tracce "
    "da contaminazione crociata dichiarate dal responsabile. "
    "Il presente registro deve essere aggiornato a ogni modifica del menù, tenuto a "
    "disposizione della clientela e delle autorità di controllo (ASL/NAS), ed esposto "
    "o reso consultabile insieme all’avviso al consumatore (es. QR code AllerTgy). "
    "La responsabilità dell’accuratezza dei dati è esclusivamente del titolare/gestore "
    "dell’esercizio. AllerTgy fornisce solo lo strumento di redazione e stampa."
)

REGISTRY_PDF_CONSUMER_NOTICE = (
    "Avviso al consumatore: le informazioni sugli allergeni sono disponibili in formato "
    "digitale tramite QR code e in questo registro cartaceo su richiesta al personale. "
    "Comunicare sempre allergie e intolleranze al personale prima di ordinare."
)

COOKIES_MARKDOWN = """
# Cookie Policy e Tracciamento

**1. Cookie Tecnici Essenziali**  
AllerTgy utilizza cookie tecnici necessari a garantire la navigazione sicura, la gestione della sessione autenticata (JWT) e il mantenimento delle preferenze di interfaccia. Non richiedono consenso preventivo.

**2. Cookie di Terze Parti per Pagamenti (Stripe)**  
Durante le operazioni di abbonamento e checkout B2B, Stripe raccoglie cookie tecnici e antifrode strettamente necessari all'elaborazione sicura delle transazioni conformemente agli standard bancari PCI-DSS.

**3. Nessun Cookie di Profilazione Commerciale**  
AllerTgy non impiega cookie di profilazione pubblicitaria né cede dati di navigazione a terze parti a scopo di marketing o rivendita dati.
"""

B2B_MARKDOWN = """
# Condizioni Contrattuali Abbonamenti B2B (Ristoratori)

**1. Natura Professionale del Contratto**  
Il Ristoratore che attiva un abbonamento su AllerTgy agisce nell'esercizio della propria attività imprenditoriale o professionale (B2B). Non si applicano le tutele del Codice del Consumo relative al diritto di recesso entro 14 giorni.

**2. Rinnovo e Disdetta**  
- Gli abbonamenti (Base, Pro Notifiche) si rinnovano tacitamente su base mensile.
- La disdetta può essere richiesta in qualsiasi momento tramite il portale di gestione Stripe accessibile dalla dashboard; ha effetto al termine del ciclo di fatturazione corrente, senza penali né rimborsi pro-quota.

**3. Fatturazione Elettronica**  
La fatturazione avviene tramite i dati fiscali (Partita IVA, Codice Destinatario SDI o PEC) forniti dall'Esercente.

**4. Mancato Pagamento**  
In caso di fallimento della transazione di rinnovo, dopo i tentativi automatici e il periodo di tolleranza, la scheda del locale viene automaticamente riportata al profilo base gratuito fino a regolarizzazione.
"""

# Mappatura documenti per API: doc → (titolo, versione, testo)
LEGAL_DOCUMENTS: dict[str, tuple[str, str, str]] = {
    "copyright": ("Copyright e Proprietà Intellettuale", COPYRIGHT_VERSION, COPYRIGHT_MARKDOWN),
    "terms": ("Termini di Servizio", LEGAL_TERMS_VERSION, TERMS_MARKDOWN),
    "privacy": ("Informativa Privacy", PRIVACY_VERSION, PRIVACY_MARKDOWN),
    "safety": ("Disclaimer di sicurezza e salute", SAFETY_DISCLAIMER_VERSION, SAFETY_MARKDOWN),
    "owner-declaration": (
        "Dichiarazione di responsabilità del Ristoratore",
        MENU_CONFIRMATION_VERSION,
        OWNER_DECLARATION_MARKDOWN,
    ),
    "cookies": ("Cookie Policy", COOKIE_VERSION, COOKIES_MARKDOWN),
    "b2b": ("Condizioni abbonamenti B2B", B2B_TERMS_VERSION, B2B_MARKDOWN),
}
