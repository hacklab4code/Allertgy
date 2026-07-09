# AllerTgy — Elenco completo delle funzioni

## 👤 FUNZIONI CLIENTE (App Mobile)

### 1. Registrazione e Profilo
- [x] **Registrazione account** con email, password, accettazione Termini/Privacy/consenso dati sanitari
- [x] **Login** con email/password
- [x] **Recupero password** (forgot password via email + reset con token)
- [x] **Profilo utente** completo (visualizzazione e modifica)
- [x] **Accettazione consensi legali** (Termini, Privacy, consenso dati sanitari)
- [x] **Accettazione disclaimer** di sicurezza
- [x] **Onboarding** guidato (completamento profilo allergie)
- [x] **Foto profilo** (caricamento, visualizzazione, eliminazione)
- [x] **Cancellazione account** (diritto GDPR alla rimozione completa)

### 2. Gestione Allergie
- [x] **Selezione allergie** manuale dal catalogo completo (allergeni UE + extra)
- [x] **Intensità allergene** (lieve / moderata / grave)
- [x] **Preferenze alimentari** (vegano, vegetariano, senza glutine, senza lattosio)
- [x] **Ingredienti esclusi** personalizzati (es. aglio, cipolla, funghi)
- [x] **Visualizzazione allergie** correnti con emoji e nomi

### 3. Sottoprofili (Famiglia)
- [x] **Creazione sottoprofilo** (es. figlio, coniuge, genitore)
- [x] **Modifica sottoprofilo** (nome, relazione, allergie)
- [x] **Eliminazione sottoprofilo** (tranne il profilo principale "io")
- [x] **Selezione profilo attivo** dallo switcher nella home e nella spesa
- [x] **Calcolo semaforo** basato sul profilo attivo selezionato

### 4. Scansione QR e Ricerca Locali
- [x] **Scansione QR code** del ristorante (fotocamera)
- [x] **Inserimento manuale** codice numerico a 6 cifre
- [x] **Ricerca ristoranti** nelle vicinanze (geolocalizzazione)
- [x] **Elenco completo** di tutti i ristoranti attivi
- [x] **Ordinamento per distanza** dai ristoranti vicini
- [x] **Calcolo distanza** in km/m

### 5. Semaforo Allergeni (Valutazione Piatti)
- [x] **Visualizzazione menù digitale** del ristorante
- [x] **Valutazione automatica** di ogni piatto (semaforo):
  - 🟢 **Verde** = compatibile (nessun allergene)
  - 🟡 **Giallo** = attenzione tracce (possibili contaminazioni)
  - 🔴 **Rosso** = non idoneo (contiene allergeni)
- [x] **Filtro per colore** semaforo (solo verdi, solo gialli, ecc.)
- [x] **Dettaglio piatto** con allergeni contenuti e tracce
- [x] **Calcolo compatibilità** con ingredienti esclusi
- [x] **Valutazione senza account** (flusso QR web pubblico)

### 6. Preferiti (Ristoranti)
- [x] **Aggiungi ai preferiti** (salva ristorante)
- [x] **Rimuovi dai preferiti**
- [x] **Sincronizzazione server** dei preferiti
- [x] **Notifica push** quando un ristorante preferito aggiorna il menù

### 7. Spesa (Scanner Barcode)
- [x] **Scansione codice a barre** prodotti (EAN-13, EAN-8, UPC)
- [x] **Ricerca prodotto** su Open Food Facts
- [x] **Semaforo prodotto** (verde/giallo/rosso) basato sulle allergie
- [x] **Evidenziazione ingredienti** critici nel testo
- [x] **Cronologia scansioni** (salvata localmente)
- [x] **Preferiti prodotti** (salvati localmente)
- [x] **Cancellazione cronologia**
- [x] **Torcia fotocamera** per scansione al buio
- [x] **Dettaglio prodotto** con ingredienti, marca, barcode

### 8. Mappa e Geofencing
- [x] **Mappa ristoranti** con geolocalizzazione
- [x] **Richiesta permessi** di localizzazione
- [x] **Geofencing** (notifiche locali quando vicino a un ristorante)
- [x] **Ristoranti vicini** (top 3 in home)

### 9. Recensioni
- [x] **Scrittura recensione** (una per ristorante)
- [x] **Valutazione multipla** (personale, menù, sicurezza)
- [x] **Modifica recensione** esistente
- [x] **Eliminazione recensione**
- [x] **Lettura recensioni** degli altri clienti
- [x] **Segnalazione recensione** offensiva/falsa
- [x] **Visualizzazione risposta** del ristoratore

### 10. Documenti Medici (AI)
- [x] **Caricamento referti medici** (PDF, JPG, PNG, WebP)
- [x] **Consenso specifico AI** per ogni documento (art. 9 GDPR)
- [x] **Estrazione AI allergeni** dal documento (Gemini)
- [x] **Conferma umana** obbligatoria prima che l'AI scriva nel profilo
- [x] **Visualizzazione estrazioni** con confidenza
- [x] **Download documento** con URL firmato (5 min)
- [x] **Tracciamento accessi** ai documenti (GDPR)
- [x] **Limite mensile** estrazioni AI (5/mese)
- [x] **Eliminazione documento** (rimozione reale da storage)

### 11. Notifiche
- [x] **Registrazione device token** (Expo Push)
- [x] **Rimozione device token**
- [x] **Lista notifiche** (ultime 50)
- [x] **Segna come letto**
- [x] **Notifiche push** per:
  - Menù aggiornato (locali preferiti)
  - Risposta del ristoratore a una recensione
  - Nuova recensione ricevuta (per ristoratore)
  - Promozioni (da ristoranti seguiti)

### 12. Apple Health / Emergenza
- [x] **Connessione Apple Salute** (stato on/off)
- [x] **Farmaci salvavita** (medicinali di emergenza)
- [x] **Contatto di emergenza** (nome e telefono)
- [x] **Pulsante SOS** nell'header dell'app

### 13. Multilingua
- [x] **Selezione lingua** (bandiere nell'header)
- [x] **Lingue supportate**: Italiano, Inglese, Spagnolo, Tedesco, Francese
- [x] **Traduzione menù** automatica (AI) nella lingua selezionata
- [x] **Traduzione allergeni** nella lingua corrente

### 14. Annotazioni di Sicurezza (Customer Annotations)
- [x] **Visualizzazione annotazioni** dei clienti per un ristorante
- [x] **Creazione annotazione** (segnalazione ingrediente/norma di sicurezza)
- [x] **Associazione allergene** all'annotazione

---

## 🏪 FUNZIONI RISTORATORE (App Mobile + Dashboard Web)

### 1. Registrazione e Profilo Ristoratore
- [x] **Registrazione** con ruolo "owner"
- [x] **Accettazione responsabilità** sui dati pubblicati
- [x] **Profilo ristoratore** completo
- [x] **Consensi legali** (Termini, Privacy)

### 2. Gestione Ristorante
- [x] **Creazione ristorante** (nome, città, indirizzo, telefono, email, orari)
- [x] **Modifica impostazioni** ristorante
- [x] **Generazione automatica** codice pubblico a 6 cifre
- [x] **Generazione slug** SEO-friendly
- [x] **Caricamento foto** ristorante (galleria con limite per piano)
- [x] **Foto copertina** (imposta foto principale)
- [x] **Eliminazione foto** galleria
- [x] **Inserimento coordinate** (latitudine, longitudine)
- [x] **Inserimento sito web** e URL menù
- [x] **Descrizione ristorante**
- [x] **Partita IVA**, SDI, PEC, note commerciali
- [x] **Referente allergeni** (nome del responsabile)
- [x] **Google Place ID** e **URL TripAdvisor**

### 3. Gestione Menù Digitale
- [x] **Creazione menù** multipli (es. Pranzo, Cena, Bambini)
- [x] **Modifica menù** (nome, attivo/inattivo, ordine)
- [x] **Eliminazione menù**
- [x] **Aggiunta piatti** (nome, descrizione, categoria, prezzo, gruppo)
- [x] **Modifica piatti**
- [x] **Eliminazione piatti**
- [x] **Associazione allergeni** per piatto (contenuti e tracce)
- [x] **Conferma protocollo cucina** (kitchen protocol confirmed)
- [x] **Data controllo contaminazione** incrociata
- [x] **Caricamento foto piatto**
- [x] **Ordinamento piatti** per gruppo menù
- [x] **Sostituzione completa** menù (replace)
- [x] **Pubblicazione menù** (approvazione con conferma legale)
- [x] **Numero versione** menù (incremento automatico)
- [x] **Storico modifiche** (audit log)

### 4. Analisi AI Menù
- [x] **Scansione foto menù cartaceo** (riconoscimento piatti + allergeni)
- [x] **Analisi URL menù online** (estrazione automatica)
- [x] **Traduzione automatica AI** menù in 4 lingue (EN, ES, DE, FR)
- [x] **Salvataggio traduzioni** per ogni piatto

### 5. QR Code
- [x] **Generazione QR code** per il locale
- [x] **Stampa QR** per tavoli
- [x] **Pagina pubblica** del ristorante (/r/{slug})

### 6. Piani e Abbonamenti
- [x] **Visualizzazione piani** disponibili (Free, Base, Pro Notifiche)
- [x] **Avvio trial gratuito** 30 giorni
- [x] **Attivazione abbonamento** (Stripe checkout)
- [x] **Customer Portal** (gestione, upgrade, downgrade, disdetta)
- [x] **Storico fatture**
- [x] **Limiti per piano** (foto galleria, funzionalità menù)

### 7. Boost Visibilità
- [x] **Acquisto Boost** (€9,90 / 30 giorni, pagamento one-time)
- [x] **Attivazione automatica** al pagamento
- [x] **Lista boost** acquistati (attivi e scaduti)
- [x] **Priorità** nei risultati di ricerca (featured_priority)

### 8. Notifiche Push ai Clienti (Pro Notifiche)
- [x] **Invio notifiche push** ai follower del locale
- [x] **Conteggio follower** (clienti che hanno il locale nei preferiti)
- [x] **Invio promozioni** personalizzate

### 9. Recensioni (Lato Ristoratore)
- [x] **Lettura recensioni** ricevute
- [x] **Risposta alle recensioni** (piano Verificato+)
- [x] **Notifica** di nuova recensione

### 10. Statistiche e Analytics
- [x] **Visualizzazioni totali** del menù
- [x] **Ricerche allergeni** totali
- [x] **Distribuzione allergeni** cercati (classifica)
- [x] **Serie temporale** visite (ultimi 30 giorni)
- [x] **Sincronizzazione recensioni** Google e TripAdvisor

### 11. Registro Allergeni PDF
- [x] **Esportazione PDF** del registro allergeni
- [x] **Dettaglio per piatto** (contiene, tracce)
- [x] **Informazioni legali** (versione, data conferma, referente)
- [x] **Formato A4 orizzontale** pronto per stampa/archivio

### 12. Pagina Pubblica del Ristorante
- [x] **Scheda pubblica** con foto, info, orari
- [x] **Menù visibile** (solo con piano attivo)
- [x] **Recensioni** (interne + Google + TripAdvisor)
- [x] **Valutazione media** e conteggio recensioni
- [x] **Dettaglio allergeni** per piatto (solo piani Pro/Premium)

---

## 🛠️ FUNZIONI ADMIN INTERNO (Dashboard Web)

- [x] **Dashboard riepilogativa** (utenti, ristoranti, MRR, piani)
- [x] **Gestione ristoranti** (cambio piano, stato, visibilità)
- [x] **Modifica business plan** e subscription status
- [x] **Gestione piani** (definizioni, prezzi)
- [x] **Moderazione recensioni** (nascondi/mostra, motivo)
- [x] **Lista utenti** con dettagli (consensi, onboarding)
- [x] **Log accessi documenti** medici (solo metadati GDPR)
- [x] **Gestione fatture** e pagamenti

---

## ⚙️ FUNZIONI TRASVERSALI (Backend)

- [x] **Rate limiting** (protezione abuso endpoint)
- [x] **Autenticazione JWT** (token accesso)
- [x] **Validazione password** (forza minima)
- [x] **Anti user-enumeration** (forgot password)
- [x] **Webhook Stripe** (subscription, pagamenti, fatture)
- [x] **Notifiche push** (Expo Push API)
- [x] **Email transazionali** (reset password, conferma pagamento, pagamento fallito)
- [x] **Storage file** (foto profilo, documenti medici, foto ristoranti)
- [x] **URL firmati** (accesso temporaneo a file privati)
- [x] **Traduzione AI** (Gemini per menù)
- [x] **Analisi documenti AI** (Gemini per referti medici)
- [x] **Geolocalizzazione** (calcolo distanza, geofencing)
- [x] **Slug automatici** per ristoranti
- [x] **Audit log** (tracciamento modifiche menù)
- [x] **GDPR compliance** (consensi, cancellazione, log accessi)