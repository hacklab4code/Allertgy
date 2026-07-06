"""Testi legali completi e versioni — fonte unica per API, app mobile e dashboard.

Quando un testo cambia: aggiorna la costante di versione corrispondente; app e web
richiederanno una nuova accettazione agli utenti con versione diversa.

⚠️ Bozza tecnica da far rivedere a un legale prima del lancio pubblico
(in particolare TERMS §8 — limitazione di responsabilità — e B2B).
"""

LEGAL_TERMS_VERSION = "2026-07-06"
PRIVACY_VERSION = "2026-07-06"
SAFETY_DISCLAIMER_VERSION = "2026-07-06"
MENU_CONFIRMATION_VERSION = "2026-07-06"
COOKIE_VERSION = "2026-07-06"
B2B_TERMS_VERSION = "2026-07-06"

TERMS_MARKDOWN = """
# Termini di Servizio

**1. Oggetto** — AllerTgy è una piattaforma che mette in contatto clienti con allergie/intolleranze alimentari e ristoratori, tramite un sistema di segnalazione degli allergeni ("il semaforo": 🟢 nessun allergene dichiarato, 🟡 possibili tracce, 🔴 allergene dichiarato come contenuto).

**2. Definizioni**
- *Cliente*: utente privato che utilizza l'app per consultare menù e gestire il proprio profilo allergenico.
- *Ristoratore*: utente professionale titolare di uno o più *Locali*, responsabile dell'inserimento dei dati sul menù.
- *Contenuti del Locale*: menù, piatti, allergeni dichiarati, foto, orari, inseriti dal Ristoratore.

**3. Natura del servizio e limiti** — AllerTgy è uno **strumento di supporto informativo**. Non è un dispositivo medico, non fornisce diagnosi né consulenza medica, e **non sostituisce la comunicazione diretta con il personale del Locale prima di ordinare**. I dati sugli allergeni sono dichiarati dal Ristoratore sotto la propria responsabilità e possono non riflettere variazioni last-minute in cucina o rischi di contaminazione crociata.

**4. Registrazione e obblighi dell'utente** — L'utente si impegna a fornire dati veritieri (identità, email, allergie dichiarate) e a mantenere aggiornato il proprio profilo allergenico. La sicurezza delle credenziali è responsabilità dell'utente.

**5. Obblighi del Ristoratore** — Il Ristoratore garantisce l'accuratezza e l'aggiornamento dei dati su allergeni inseriti per ciascun piatto, si impegna ad aggiornare il menù ad ogni variazione di ricetta o fornitore, e riconosce che l'inserimento errato di un allergene può causare un danno grave alla salute di un Cliente.

**6. Piani a pagamento** — I piani Verificato, Pro e Premium sono abbonamenti mensili a rinnovo automatico, gestiti tramite Stripe. Il Ristoratore può disdire in qualsiasi momento dal Customer Portal; la disdetta ha effetto alla fine del periodo di fatturazione in corso, senza rimborso della quota già pagata salvo diversa previsione di legge.

**7. Proprietà intellettuale** — Il software, il marchio e i contenuti editoriali di AllerTgy restano di proprietà di AllerTgy. I Contenuti del Locale restano di proprietà del Ristoratore, che concede ad AllerTgy licenza d'uso per mostrarli sulla piattaforma.

**8. Limitazione di responsabilità** — Nei limiti massimi consentiti dalla legge, AllerTgy non risponde di danni derivanti da: inesattezza dei dati sugli allergeni inseriti dal Ristoratore; mancata comunicazione delle proprie allergie al personale del Locale da parte del Cliente; contaminazioni crociate o variazioni di ricetta non aggiornate nel menù; uso del servizio in modo difforme dal Disclaimer di sicurezza. *(Clausola da tarare con un legale in base alla forma societaria e alle coperture assicurative.)*

**9. Sospensione e cessazione** — AllerTgy può sospendere un account in caso di dati palesemente falsi, uso fraudolento del servizio o mancato pagamento oltre il periodo di grazia.

**10. Modifiche, legge applicabile, foro competente** — AllerTgy può aggiornare i presenti Termini notificando gli utenti e richiedendo una nuova accettazione. Legge applicabile: italiana. Foro competente: quello del consumatore per i Clienti, quello della sede legale di AllerTgy per i rapporti B2B con i Ristoratori (salvo diversa norma inderogabile).
"""

PRIVACY_MARKDOWN = """
# Informativa Privacy

**1. Titolare del trattamento** — [Ragione sociale/nome del titolare da inserire], email di contatto per richieste privacy: [inserire].

**2. Categorie di dati trattati**
- Dati identificativi e di contatto (email, nome visualizzato).
- Dati di autenticazione (password in hash, mai in chiaro).
- **Dati particolari ex art. 9 GDPR**: allergie, intolleranze, preferenze alimentari, documenti medici caricati (referti allergologici).
- Dati di pagamento (gestiti direttamente da Stripe, AllerTgy non memorizza numeri di carta).
- Dati di utilizzo (log accessi, indirizzo IP per rate limiting e sicurezza).

**3. Finalità e base giuridica**
- Erogazione del servizio (esecuzione del contratto): profilo allergenico, consultazione menù, semaforo.
- Trattamento dei dati sanitari: **consenso esplicito e specifico** (art. 9.2.a GDPR), revocabile in qualsiasi momento dal profilo.
- Analisi AI dei documenti medici: **consenso specifico e separato per ogni singolo documento caricato**, distinto dal consenso generale ai dati sanitari.
- Sicurezza e prevenzione abusi (rate limiting, log accessi): legittimo interesse.
- Fatturazione e adempimenti fiscali: obbligo di legge.

**4. Destinatari e sub-responsabili del trattamento**

| Fornitore | Ruolo | Dati coinvolti |
|---|---|---|
| Hostinger | Hosting database | tutti i dati applicativi |
| Cloudflare (R2) | Storage file privati | foto profilo/locale, documenti medici |
| Google (Gemini Vision) | Analisi AI immagini | foto menù, documenti medici (solo se l'utente attiva l'estrazione) |
| Stripe | Pagamenti e fatturazione | dati di pagamento, dati fiscali del Ristoratore |
| Resend | Invio email transazionali | indirizzo email |
| Expo | Notifiche push | token dispositivo |

Con ciascun fornitore che tratta dati fuori SEE (in particolare Google e Stripe) sono verificate Clausole Contrattuali Standard o un quadro di adeguatezza equivalente.

**5. Conservazione dei dati** — I documenti medici vengono conservati finché l'account è attivo e cancellati automaticamente dopo 24 mesi di inattività, o su richiesta immediata dell'utente. I dati di fatturazione sono conservati per il periodo previsto dalla normativa fiscale italiana (10 anni).

**6. Diritti dell'interessato** — Accesso, rettifica, cancellazione, portabilità, limitazione e opposizione al trattamento, revoca del consenso in qualsiasi momento senza pregiudicare la liceità del trattamento già effettuato, reclamo al Garante per la Protezione dei Dati Personali.

**7. Minori** — Il servizio non è rivolto a minori di 14 anni, data la natura dei dati sanitari trattati; in caso di minori tra 14 e 18 anni è richiesto il consenso di chi esercita la responsabilità genitoriale per il trattamento dei dati sanitari.

**8. Sicurezza** — Password in hash, documenti medici su storage privato con URL firmati a scadenza breve, log di ogni accesso ai documenti medici, connessioni cifrate HTTPS.
"""

SAFETY_MARKDOWN = """
# Disclaimer di sicurezza e salute

**AllerTgy è uno strumento di supporto, non un dispositivo medico e non sostituisce il parere di un medico o allergologo.**

Gli allergeni indicati per ogni piatto sono **dichiarati dal Ristoratore** sotto la propria responsabilità. AllerTgy non entra fisicamente nelle cucine dei locali e non può garantire l'assenza di contaminazioni crociate o di variazioni dell'ultimo minuto negli ingredienti.

**Comunica SEMPRE le tue allergie al personale di sala prima di ordinare**, anche se il semaforo mostra 🟢. In presenza di allergie gravi (rischio di shock anafilattico), consulta sempre il tuo medico sulle precauzioni da adottare mangiando fuori casa.

Se un documento medico viene analizzato con intelligenza artificiale, i risultati sono **suggerimenti da confermare manualmente**: l'AI può commettere errori di lettura, e nessun dato viene aggiunto al tuo profilo senza la tua conferma esplicita.

In caso di reazione allergica, contatta immediatamente i servizi di emergenza (**112**) e utilizza l'eventuale terapia prescritta dal tuo medico (es. adrenalina autoiniettabile). AllerTgy non fornisce assistenza medica di emergenza.
"""

OWNER_DECLARATION_MARKDOWN = """
# Dichiarazione di responsabilità del Ristoratore

Il sottoscritto, in qualità di titolare o responsabile del Locale, dichiara che le informazioni sugli allergeni inserite per ciascun piatto sono accurate, aggiornate e verificate con la propria cucina al momento della pubblicazione. Si impegna ad aggiornare tempestivamente il menù in caso di variazione di ricette, fornitori o processi di preparazione, e riconosce che un'informazione errata sugli allergeni può causare un grave danno alla salute di un cliente. Il Locale è l'unico responsabile dell'accuratezza dei Contenuti del Locale caricati sulla piattaforma.

Se il menù è stato generato con l'analisi AI della foto: *confermo di aver rivisto e corretto manualmente i piatti generati automaticamente prima della pubblicazione.*
"""

COOKIES_MARKDOWN = """
# Cookie Policy

- **Cookie tecnici** (sessione di login, preferenze lingua): necessari al funzionamento del servizio, nessun consenso richiesto.
- **Cookie di terze parti** (es. Stripe Checkout durante il pagamento): attivati solo nella pagina di pagamento; informativa dedicata di Stripe.
- Nessun cookie di profilazione o analytics è attivo. Se in futuro verrà aggiunto un tool di analytics, un banner di consenso comparirà prima dell'attivazione.
"""

B2B_MARKDOWN = """
# Condizioni contrattuali abbonamenti (Ristoratori)

Il Ristoratore che sottoscrive un piano a pagamento agisce come professionista/azienda, non come consumatore: il diritto di recesso di 14 giorni del Codice del Consumo non si applica automaticamente a questo rapporto.

- Rinnovo automatico mensile via Stripe, disdicibile in ogni momento dal Customer Portal, con effetto a fine periodo.
- Nessun rimborso pro-quota, salvo diversa indicazione contrattuale o norma inderogabile.
- Fatturazione elettronica tramite i dati SDI/PEC comunicati dal Ristoratore.
- In caso di pagamento fallito, dopo i solleciti automatici e il periodo di grazia il locale viene riportato al piano Gratis.
"""

# doc → (titolo, versione, testo)
LEGAL_DOCUMENTS: dict[str, tuple[str, str, str]] = {
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
