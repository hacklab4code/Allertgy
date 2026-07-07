# AllerTgy — Piano di completamento e lancio

Decisioni prese come base di questo piano:
- **Documenti medici**: upload + **estrazione automatica allergeni via AI** (Gemini Vision), sempre con conferma manuale dell'utente prima che il profilo cambi.
- **Infrastruttura**: bootstrap minimo (si resta su Hostinger MySQL, si aggiungono solo i servizi a costo quasi zero necessari).
- Piano salvato qui per essere aggiornato man mano che le fasi vengono completate.

---

## ✅ Stato di avanzamento (aggiornato 2026-07-07)

| Fase | Stato | Note |
|---|---|---|
| 0 — Sicurezza base | ✅ (parziale) | git init + `.gitignore`, `JWT_SECRET` reale generato. **Restano a carico tuo**: rotazione password DB su hPanel, verifica backup Hostinger, VPS, account R2/Stripe/Resend |
| 1 — Recupero password + foto profilo | ✅ | Backend + dashboard web + app mobile (schermate `forgot`/`reset-password`, avatar con `expo-image-picker`) |
| 2 — Pagine pubbliche + SEO | ✅ | `GET /restaurants/{code}/public`, slug auto-generati (con backfill), rotta web `/r/{slug}`, meta tag dinamici, `sitemap.xml` |
| 3 — Documenti medici + AI | ✅ | Storage privato con URL firmati 5 min, consenso AI per-documento, estrazione Gemini (stub senza API key), conferma manuale obbligatoria, limite 5/mese, access log, cancellazione reale, schermata mobile `documenti.tsx` |
| 4 — Recensioni + moderazione | ✅ | Upsert 1-per-utente, risposta ristoratore (piano Verificato+), segnalazioni, moderazione in InternalAdmin, UI web e mobile |
| 5 — Stripe end-to-end | ✅ (codice) | Checkout/Portal/webhook/fatture implementati; si attivano inserendo le chiavi `STRIPE_*` in `backend/.env` (senza chiavi: 503 con messaggio chiaro) |
| 6 — Notifiche | ✅ (parziale) | Tabelle + push Expo su "menù aggiornato" (preferiti server-side) e "risposta a recensione"; email transazionali via Resend (fallback log). Manca il wiring `expo-notifications` nell'app (richiede dev build) |
| 7 — Hardening + beta | ⏳ | Smoke test end-to-end backend superato (25/25). Restano: deploy VPS+HTTPS, Stripe live, revisione legale, beta con ristoranti reali |

Testi legali (§8): integrali in `backend/app/legal.py`, serviti da `GET /legal/{doc}`, pubblicati su web (`/termini`, `/privacy`, `/cookie`, `/sicurezza`) e in app (`legal-docs.tsx`). **Da far rivedere a un legale prima del lancio.**

### Cosa serve da te per "accendere" i servizi esterni
1. **Hostinger**: ruota la password del DB su hPanel e aggiorna `backend/.env`; verifica i backup automatici.
2. **Cloudflare R2**: crea un bucket privato e compila `R2_*` in `.env` (senza: fallback locale già funzionante in `backend/private_storage/`).
3. **Resend**: crea l'account, verifica il dominio, compila `RESEND_API_KEY` (senza: le email finiscono nel log del server).
4. **Stripe**: crea i 3 prodotti/prezzi mensili, il webhook verso `{API}/billing/webhook`, compila `STRIPE_*`.
5. **Gemini**: `GEMINI_API_KEY` per menù + referti (senza: stub dimostrativo).
6. **VPS**: deploy del backend con HTTPS (Docker + Nginx + Certbot) e `PUBLIC_WEB_URL`/`PUBLIC_API_URL` reali.

---

## 0. Executive summary

Il progetto ha già basi solide (auth JWT, semaforo testato, piani commerciali, dashboard admin, audit log menù). Mancano le funzioni che rendono l'app "finita e lanciabile": recupero password, foto profilo, pagine pubbliche ristorante, upload documenti medici con AI, recensioni, pagamenti reali (oggi i piani esistono a DB ma non c'è un flusso di pagamento end-to-end), notifiche, hardening di sicurezza, e testi legali completi. Questo documento specifica ogni funzione nel dettaglio (endpoint, tabelle, schermate, edge case), la nuova struttura dati, i costi attesi, i testi legali integrali e una roadmap a fasi.

---

## 1. Priorità zero — da sistemare PRIMA di aggiungere feature

Questi punti non sono negoziabili, vanno fatti nella Fase 0:

1. **`JWT_SECRET` reale**: oggi in `backend/.env` c'è ancora il placeholder `cambiami-con-una-stringa-lunga-e-casuale-64+caratteri`. Generare con `openssl rand -hex 64` e sostituire.
2. **Password del DB Hostinger**: il README segnala che è finita in uno screenshot — verificare che sia stata davvero ruotata su hPanel, non solo nel `.env` locale.
3. **`git init`** del progetto (oggi non è un repo git): senza versionamento, un errore su schema o codice è irrecuperabile. `.gitignore` deve escludere `.env`, `node_modules`, `.venv`, `__pycache__`, screenshot con credenziali.
4. **La cartella `/static` del backend è montata pubblicamente** (`app.mount("/static", StaticFiles(...))` in `backend/app/main.py:29`). Va benissimo per foto menù già pubblicate, ma **non deve mai essere usata per documenti medici o foto profilo private** — chiunque conosca/indovini l'URL può leggerle. Serve uno storage privato con URL firmati a scadenza (vedi §2).
5. **Backup del database**: verificare se Hostinger fa backup automatici del DB; in caso contrario impostare un `mysqldump` schedulato con upload su storage separato.

---

## 2. Architettura infrastrutturale target (bootstrap minimo)

| Livello | Scelta | Perché | Costo indicativo |
|---|---|---|---|
| Database | MySQL Hostinger (attuale) | già in uso, nessuna migrazione necessaria ora | incluso nel piano hosting esistente |
| Storage file privati (foto, documenti medici) | **Cloudflare R2** (S3-compatible) | 10 GB storage gratis, **zero costi di uscita** (egress), supporta URL firmati e bucket privati | €0 fino a ~10GB, poi $0.015/GB/mese |
| Email transazionale | **Resend** o **Brevo** | free tier 3.000 email/mese, template semplici, deliverability buona | €0 in fase di lancio |
| Pagamenti | **Stripe Billing** (Checkout + Customer Portal + Webhook) | standard de-facto EU, gestisce IVA, fatture, dunning automatico | 1,5% + €0,25 per transazione carta EU |
| AI Vision (menù + documenti medici) | **Gemini 2.0/2.5 Flash** (già predisposto in `menu_analyze.py`) | già scelto nel progetto, costo per immagine molto basso | vedi §7 (verificare prezzi correnti su ai.google.dev) |
| Hosting backend FastAPI | VPS economico (Hostinger VPS KVM1 o Hetzner CX22) con Docker + Nginx + Certbot | l'hosting condiviso Hostinger non è pensato per processi Python persistenti (uvicorn) | ~€5-8/mese |
| Notifiche push | Expo Push Notifications | gratis, già nativo per app Expo | €0 |
| Monitoring | Sentry (free tier) + UptimeRobot | errori in produzione + uptime | €0 |

Flusso aggiornato:
```
App Expo / Dashboard Web ──HTTPS──> FastAPI (VPS) ──SQL──> MySQL Hostinger
                                        │      └──> Cloudflare R2 (foto, documenti medici, signed URL)
                                        ├──> Gemini Vision (menù + referti)
                                        ├──> Stripe (checkout, webhook, fatture)
                                        └──> Resend (email) / Expo Push (notifiche)
```

---

## 3. Nuove tabelle — `schema_v5.sql` (bozza)

```sql
-- Recupero password
CREATE TABLE password_reset_tokens (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  DATETIME NOT NULL,
  used_at     DATETIME NULL,
  requested_ip VARCHAR(45),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Foto profilo utente + galleria ristorante
ALTER TABLE users ADD COLUMN photo_key VARCHAR(255) NULL;

CREATE TABLE restaurant_photos (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT UNSIGNED NOT NULL,
  storage_key   VARCHAR(255) NOT NULL,
  is_cover      TINYINT(1) NOT NULL DEFAULT 0,
  sort_order    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pagina pubblica ristorante
ALTER TABLE restaurants
  ADD COLUMN slug VARCHAR(160) UNIQUE,
  ADD COLUMN address VARCHAR(255),
  ADD COLUMN lat DECIMAL(9,6),
  ADD COLUMN lng DECIMAL(9,6),
  ADD COLUMN phone VARCHAR(30),
  ADD COLUMN website VARCHAR(255),
  ADD COLUMN description TEXT;

CREATE TABLE restaurant_hours (
  restaurant_id INT UNSIGNED NOT NULL,
  day_of_week   TINYINT UNSIGNED NOT NULL,  -- 0=lunedì .. 6=domenica
  open_time     TIME,
  close_time    TIME,
  PRIMARY KEY (restaurant_id, day_of_week),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Documenti medici + estrazione AI (mai scrittura automatica sul profilo)
CREATE TABLE medical_documents (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  storage_key VARCHAR(255) NOT NULL,
  mime_type   VARCHAR(100) NOT NULL,
  status      ENUM('pending','processed','failed') NOT NULL DEFAULT 'pending',
  ai_consent_at DATETIME NULL,          -- consenso specifico per l'analisi AI di QUESTO documento
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE allergen_extractions (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id   INT UNSIGNED NOT NULL,
  allergen_code VARCHAR(30) NOT NULL,
  confidence    DECIMAL(3,2),
  applied       TINYINT(1) NOT NULL DEFAULT 0,   -- 1 solo dopo conferma esplicita utente
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES medical_documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE document_access_log (   -- audit: chi ha visto un documento medico e quando
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id  INT UNSIGNED NOT NULL,
  accessed_by  INT UNSIGNED NOT NULL,
  accessed_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES medical_documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE user_allergens
  ADD COLUMN source ENUM('manual','document_ai') NOT NULL DEFAULT 'manual',
  ADD COLUMN confirmed_at DATETIME NULL;

-- Recensioni
CREATE TABLE reviews (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  rating        TINYINT UNSIGNED NOT NULL,  -- 1..5
  comment       TEXT,
  is_hidden     TINYINT(1) NOT NULL DEFAULT 0,
  hidden_reason VARCHAR(255) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review_user_restaurant (restaurant_id, user_id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE review_replies (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  review_id INT UNSIGNED NOT NULL UNIQUE,
  reply     TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notifiche
CREATE TABLE device_tokens (
  user_id     INT UNSIGNED NOT NULL,
  expo_token  VARCHAR(255) NOT NULL,
  PRIMARY KEY (user_id, expo_token),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notifications (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  type       VARCHAR(50) NOT NULL,
  payload_json JSON,
  read_at    DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pagamenti reali (oggi i campi piano esistono ma non c'è integrazione Stripe)
ALTER TABLE restaurants
  ADD COLUMN stripe_customer_id VARCHAR(100),
  ADD COLUMN stripe_subscription_id VARCHAR(100),
  ADD COLUMN stripe_price_id VARCHAR(100);

CREATE TABLE invoices (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id  INT UNSIGNED NOT NULL,
  stripe_invoice_id VARCHAR(100) NOT NULL,
  amount_cents   INT NOT NULL,
  status         VARCHAR(30) NOT NULL,
  pdf_url        VARCHAR(255),
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 4. Specifica dettagliata delle funzioni

### 4.1 Recupero password

- **Flusso**: `POST /auth/forgot-password {email}` → genera token opaco 32 byte, salva solo l'hash in `password_reset_tokens` con scadenza 30 minuti, invia email via Resend con link (`https://app.allertgy.it/reset-password?token=...` per il web, deep link `allertgy://reset-password?token=...` per l'app) → `POST /auth/reset-password {token, new_password}` verifica hash + scadenza + non ancora usato → aggiorna `password_hash`, marca il token come usato.
- **Anti user-enumeration**: la risposta è sempre "se l'indirizzo esiste riceverai un'email", mai un errore "utente non trovato".
- **Rate limit**: max 3 richieste/ora per email (riusa il pattern già presente in `backend/app/rate_limit.py`).
- **Schermate**: `app-mobile/app/login.tsx` → link "Password dimenticata" → nuova route `forgot-password.tsx` e `reset-password.tsx`; dashboard-web → `Login.tsx` con stesso link e una pagina `/reset-password`.

### 4.2 Foto profilo (utente e ristorante)

- **Cliente**: `POST /profile/photo` (multipart) → resize server-side a 512px (Pillow) → upload su R2 in bucket privato → salva `photo_key` → risposta con signed URL valido 1h.
- **Ristorante**: galleria in `restaurant_photos`, limite per piano (Free 1, Verificato 3, Pro 8, Premium 20 — vedi §8), upload multiplo da `MenuEditor.tsx` o nuova sezione "Galleria" nella dashboard.
- **Mobile**: schermata Account → tap avatar → `expo-image-picker` → crop quadrato → upload.
- **Edge case**: file >5MB rifiutato lato client e server; solo jpg/png/webp accettati (validazione mime reale, non solo estensione).

### 4.3 Pagine pubbliche ristorante

- Nuova rotta pubblica **senza login**: `dashboard-web` → `/r/:slug` (fallback su `/r/:public_code` se lo slug non è ancora impostato).
- Endpoint `GET /restaurants/{codice}/public`: nome, città, indirizzo, lat/lng, foto copertina + galleria, orari (`restaurant_hours`), badge piano, rating medio + numero recensioni, anteprima menù (dettaglio allergeni per piatto visibile solo se piano Pro/Premium attivo, coerente col gating già esistente).
- **SEO**: meta tag dinamici (title/description/OG image) via `react-helmet-async`, `sitemap.xml` generato lato backend, URL leggibile (`slug` generato da nome+città con fallback numerico se duplicato).
- Bottone "Lascia una recensione" e "Aggiungi ai preferiti" visibili solo se loggato.

### 4.4 Documenti medici + estrazione AI allergeni

Punto più delicato del piano: si tratta di **dati sanitari (Art. 9 GDPR)**, va trattato con più attenzione delle altre feature.

- **Upload**: cliente carica PDF/foto del referto da `Account → Documenti medici` → checkbox obbligatoria e **distinta** dal consenso generale già esistente (`health_data_consent_at`): *"Autorizzo l'analisi automatica di questo documento tramite intelligenza artificiale (Gemini Vision) per suggerire i miei allergeni"* → file va su R2 **bucket privato**, mai su `/static`.
- **Estrazione**: `POST /profile/medical-documents/{id}/extract` chiama Gemini Vision con un prompt dedicato (stesso pattern di `menu_analyze.py`, nuovo file `medical_document_analyze.py`), estrae solo i 14 codici allergene standard + livello di confidenza, salva in `allergen_extractions` con `applied=0`.
- **Conferma umana obbligatoria**: l'app mostra *"Abbiamo rilevato: Glutine, Latte — confermi l'aggiunta al tuo profilo?"* → solo dopo `POST /profile/allergens/confirm-extraction` i valori passano in `user_allergens` con `source='document_ai'`. **L'AI non scrive mai direttamente il profilo.**
- **Limite d'uso** (il cliente è gratuito, va contenuto il costo AI): 5 estrazioni AI al mese per utente; oltre soglia il documento si carica comunque ma senza analisi automatica (l'utente inserisce a mano). Un ristoratore non ha accesso a questi documenti in nessun caso.
- **Sicurezza specifica**: signed URL con scadenza 5 minuti per ogni accesso al file, mai un link permanente; ogni apertura del documento (anche da parte di un admin per supporto) scrive una riga in `document_access_log`; diritto alla cancellazione immediata (`DELETE /profile/medical-documents/{id}` cancella sia la riga DB sia l'oggetto su R2, non solo soft-delete).
- **Retention**: cancellazione automatica dei documenti dopo 24 mesi di inattività dell'account, comunicata in anticipo via email.

### 4.5 Recensioni

- Un utente può lasciare **una sola recensione per ristorante** (vincolo `UNIQUE (restaurant_id, user_id)`), modificabile in seguito (upsert), niente recensioni anonime.
- `POST /restaurants/{codice}/reviews`, `GET /restaurants/{codice}/reviews`, `PUT/DELETE` sulla propria.
- **Risposta del ristoratore** (`review_replies`) riservata a piano Verificato in su (vedi §8).
- **Moderazione**: pannello `InternalAdmin.tsx` → tab "Recensioni" per nascondere contenuti offensivi/falsi (`is_hidden` + motivo), più un endpoint `POST /reviews/{id}/report` per segnalazioni da altri utenti.

### 4.6 Notifiche

- Push via Expo (`device_tokens`) per: menù aggiornato di un locale tra i preferiti, risposta a una recensione, promemoria onboarding incompleto.
- Email (Resend) per: reset password, conferma pagamento/fattura, avviso scadenza trial, pagamento fallito.

### 4.7 Pagamenti/abbonamenti end-to-end (Stripe)

Oggi `business_plan`/`subscription_status` esistono a DB ma non c'è un flusso di pagamento reale collegato — è il pezzo che rende i piani commerciali monetizzabili davvero.

- `POST /billing/checkout-session` → crea una Stripe Checkout Session per il piano scelto, redirect al pagamento.
- `POST /billing/portal-session` → apre lo Stripe Customer Portal (gestione autonoma: upgrade/downgrade/cancellazione/metodo di pagamento), evitando di dover costruire quella UI a mano.
- `POST /billing/webhook` → riceve eventi Stripe (firma verificata con lo signing secret), aggiorna `business_plan`, `subscription_status`, `trial_ends_at`, popola `invoices`.
- **Dunning**: se un pagamento fallisce, Stripe invia i solleciti automatici; dopo un periodo di grazia configurabile (es. 7 giorni) il webhook declassa il ristorante a `free`.
- Fatturazione italiana: collegare i campi già presenti (`vat_number`, `sdi_code`, `pec_email`) a Stripe Tax o a un servizio di fatturazione elettronica (es. Fatture in Cloud) — da scegliere in base a dove è registrata l'attività.

### 4.8 Pannello admin aggiornato

- Nuove tab in `InternalAdmin.tsx`: moderazione recensioni, log accessi documenti medici (sola consultazione, mai i contenuti), fatturato reale da Stripe accanto a quello stimato attuale.

---

## 5. Sicurezza e compliance (dati sanitari)

- Consenso **specifico e separato** per l'analisi AI dei documenti medici, oltre al consenso generale dati sanitari già presente.
- Storage privato con URL firmati a breve scadenza per qualunque file collegato a dati sanitari — mai la cartella `/static` pubblica.
- Log di ogni accesso ai documenti medici (`document_access_log`), incluso l'accesso da parte di staff AllerTgy per supporto.
- Diritto alla cancellazione reale: cancellare un account deve rimuovere anche i file da R2, non solo le righe DB.
- Vista la sensibilità dei dati trattati, prima del lancio pubblico è consigliabile una **DPIA** (valutazione d'impatto sulla protezione dei dati) anche solo informale, e i testi legali completi in §9.
- HTTPS ovunque (API e dashboard), HSTS attivo.

---

## 6. Costi mensili stimati

Numeri indicativi — Stripe/Gemini aggiornano i prezzi, da riverificare al momento dell'implementazione.

| Voce | Scenario Lancio (~50 ristoranti, ~500 clienti) | Scenario Crescita (~300 ristoranti, ~5.000 clienti) |
|---|---:|---:|
| Storage R2 | €0 (sotto i 10GB gratuiti) | ~€5-10 |
| Email Resend | €0 (free tier) | ~€20 (tier a pagamento) |
| Gemini Vision (menù + referti) | ~€2-5 | ~€15-30 |
| Hosting VPS backend | ~€6 | ~€15-25 (VPS più grande) |
| Dominio | ~€1 (ammortizzato annuale) | ~€1 |
| Stripe | 1,5%+€0,25 per transazione (variabile sui ricavi) | idem, variabile |
| **Totale fisso stimato** | **~€10-15/mese** | **~€55-90/mese** |

---

## 7. Piani commerciali aggiornati

| Piano | Prezzo | Foto galleria | Risposta recensioni | Menù digitale allergeni | Priorità ricerca |
|---|---:|---:|:---:|:---:|:---:|
| Free | €0 | 1 | ✗ | ✗ | ✗ |
| Verificato | €9,90/mese | 3 | ✓ | ✗ | ✗ |
| Pro | €19,90/mese | 8 | ✓ | ✓ | ✗ |
| Premium | €39,90/mese | 20 | ✓ | ✓ | ✓ (massima) |

Lato **cliente** (sempre gratuito): tutte le funzioni base incluse; upload documenti medici illimitato, ma **estrazione AI limitata a 5 al mese** per utente per tenere sotto controllo il costo API (oltre soglia, inserimento manuale delle allergie).

---

## 8. Testi legali completi

> **Attenzione**: questa è una bozza tecnica completa, scritta per coprire tutti i punti che un'app che tratta dati sanitari e rischio di reazioni allergiche deve avere. **Prima della pubblicazione va fatta rivedere da un avvocato** (o da chi segue la parte legale/fiscale dell'attività) — in particolare la Sezione 8.C (limitazione di responsabilità medica) e la Sezione 8.F (condizioni contrattuali B2B), perché cambiano in base alla forma societaria scelta e possono avere conseguenze serie in caso di reazione allergica. Il testo qui sotto è un punto di partenza solido e coerente col resto del prodotto, non una consulenza legale.

Versioni collegate a `backend/app/legal.py` (`LEGAL_TERMS_VERSION`, `PRIVACY_VERSION`, `SAFETY_DISCLAIMER_VERSION`): quando questi testi cambiano, aggiornare anche le costanti lì e richiedere una nuova accettazione se la versione è diversa da quella già accettata dall'utente.

### 8.A Termini di Servizio

**1. Oggetto**
AllerTgy è una piattaforma che mette in contatto clienti con allergie/intolleranze alimentari e ristoratori, tramite un sistema di segnalazione degli allergeni ("il semaforo": 🟢 nessun allergene dichiarato, 🟡 possibili tracce, 🔴 allergene dichiarato come contenuto).

**2. Definizioni**
- *Cliente*: utente privato che utilizza l'app per consultare menù e gestire il proprio profilo allergenico.
- *Ristoratore*: utente professionale titolare di uno o più *Locali*, responsabile dell'inserimento dei dati sul menù.
- *Contenuti del Locale*: menù, piatti, allergeni dichiarati, foto, orari, inseriti dal Ristoratore.

**3. Natura del servizio e limiti**
AllerTgy è uno **strumento di supporto informativo**. Non è un dispositivo medico, non fornisce diagnosi né consulenza medica, e **non sostituisce la comunicazione diretta con il personale del Locale prima di ordinare**. I dati sugli allergeni sono dichiarati dal Ristoratore sotto la propria responsabilità (Sezione 8.D) e possono non riflettere variazioni last-minute in cucina o rischi di contaminazione crociata.

**4. Registrazione e obblighi dell'utente**
L'utente si impegna a fornire dati veritieri (identità, email, allergie dichiarate) e a mantenere aggiornato il proprio profilo allergenico. La sicurezza delle credenziali è responsabilità dell'utente.

**5. Obblighi del Ristoratore**
Il Ristoratore garantisce l'accuratezza e l'aggiornamento dei dati su allergeni inseriti per ciascun piatto, si impegna ad aggiornare il menù ad ogni variazione di ricetta o fornitore, e riconosce che l'inserimento errato di un allergene può causare un danno grave alla salute di un Cliente.

**6. Piani a pagamento**
I piani Verificato, Pro e Premium sono abbonamenti mensili a rinnovo automatico, gestiti tramite Stripe. Il Ristoratore può disdire in qualsiasi momento dal Customer Portal; la disdetta ha effetto alla fine del periodo di fatturazione in corso, senza rimborso della quota già pagata salvo diversa previsione di legge.

**7. Proprietà intellettuale**
Il software, il marchio e i contenuti editoriali di AllerTgy restano di proprietà di AllerTgy. I Contenuti del Locale restano di proprietà del Ristoratore, che concede ad AllerTgy licenza d'uso per mostrarli sulla piattaforma.

**8. Limitazione di responsabilità**
Nei limiti massimi consentiti dalla legge, AllerTgy non risponde di danni derivanti da: inesattezza dei dati sugli allergeni inseriti dal Ristoratore; mancata comunicazione delle proprie allergie al personale del Locale da parte del Cliente; contaminazioni crociate o variazioni di ricetta non aggiornate nel menù; uso del servizio in modo difforme dal disclaimer di sicurezza (Sezione 8.C). *(Clausola da tarare con un legale in base alla forma societaria e alle coperture assicurative.)*

**9. Sospensione e cessazione**
AllerTgy può sospendere un account in caso di dati palesemente falsi, uso fraudolento del servizio o mancato pagamento oltre il periodo di grazia.

**10. Modifiche, legge applicabile, foro competente**
AllerTgy può aggiornare i presenti Termini notificando gli utenti e richiedendo una nuova accettazione. Legge applicabile: italiana. Foro competente: quello del consumatore per i Clienti, quello della sede legale di AllerTgy per i rapporti B2B con i Ristoratori (salvo diversa norma inderogabile).

### 8.B Informativa Privacy

**1. Titolare del trattamento**
[Ragione sociale/nome del titolare da inserire], email di contatto per richieste privacy: [inserire].

**2. Categorie di dati trattati**
- Dati identificativi e di contatto (email, nome visualizzato).
- Dati di autenticazione (password in hash, mai in chiaro).
- **Dati particolari ex art. 9 GDPR**: allergie, intolleranze, preferenze alimentari, documenti medici caricati (referti allergologici).
- Dati di pagamento (gestiti direttamente da Stripe, AllerTgy non memorizza numeri di carta).
- Dati di utilizzo (log accessi, indirizzo IP per rate limiting e sicurezza).

**3. Finalità e base giuridica**
- Erogazione del servizio (esecuzione del contratto): profilo allergenico, consultazione menù, semaforo.
- Trattamento dei dati sanitari: **consenso esplicito e specifico** (art. 9.2.a GDPR), revocabile in qualsiasi momento dal profilo.
- Analisi AI dei documenti medici: **consenso specifico e separato** per ogni singolo documento caricato, distinto dal consenso generale ai dati sanitari.
- Sicurezza e prevenzione abusi (rate limiting, log accessi): legittimo interesse.
- Fatturazione e adempimenti fiscali: obbligo di legge.

**4. Destinatari e sub-responsabili del trattamento**

| Fornitore | Ruolo | Dati coinvolti |
|---|---|---|
| Hostinger | Hosting database | tutti i dati applicativi |
| Cloudflare (R2) | Storage file privati | foto profilo/locale, documenti medici |
| Google (Gemini Vision) | Analisi AI immagini | foto menù, documenti medici (solo se l'utente attiva l'estrazione) |
| Stripe | Pagamenti e fatturazione | dati di pagamento, dati fiscali del Ristoratore |
| Resend/Brevo | Invio email transazionali | indirizzo email |
| Expo | Notifiche push | token dispositivo |

Con ciascun fornitore che tratta dati fuori SEE (in particolare Google e Stripe) va verificata l'esistenza di Clausole Contrattuali Standard o di un quadro di adeguatezza equivalente.

**5. Conservazione dei dati**
I documenti medici vengono conservati finché l'account è attivo e cancellati automaticamente dopo 24 mesi di inattività, o su richiesta immediata dell'utente. I dati di fatturazione sono conservati per il periodo previsto dalla normativa fiscale italiana (10 anni).

**6. Diritti dell'interessato**
Accesso, rettifica, cancellazione, portabilità, limitazione e opposizione al trattamento, revoca del consenso in qualsiasi momento senza pregiudicare la liceità del trattamento già effettuato, reclamo al Garante per la Protezione dei Dati Personali.

**7. Minori**
Il servizio non è rivolto a minori di 14 anni, data la natura dei dati sanitari trattati; in caso di minori tra 14 e 18 anni è richiesto il consenso di chi esercita la responsabilità genitoriale per il trattamento dei dati sanitari.

**8. Sicurezza**
Password in hash, documenti medici su storage privato con URL firmati a scadenza breve, log di ogni accesso ai documenti medici, connessioni cifrate HTTPS.

### 8.C Disclaimer di sicurezza e salute (il testo più critico — da mostrare in modo ben visibile, non solo una checkbox)

> **AllerTgy è uno strumento di supporto, non un dispositivo medico e non sostituisce il parere di un medico o allergologo.**
>
> Gli allergeni indicati per ogni piatto sono **dichiarati dal Ristoratore** sotto la propria responsabilità. AllerTgy non entra fisicamente nelle cucine dei locali e non può garantire l'assenza di contaminazioni crociate o di variazioni dell'ultimo minuto negli ingredienti.
>
> **Comunica SEMPRE le tue allergie al personale di sala prima di ordinare**, anche se il semaforo mostra 🟢. In presenza di allergie gravi (rischio di shock anafilattico), consulta sempre il tuo medico sulle precauzioni da adottare mangiando fuori casa.
>
> Se un documento medico viene analizzato con intelligenza artificiale, i risultati sono **suggerimenti da confermare manualmente**: l'AI può commettere errori di lettura, e nessun dato viene aggiunto al tuo profilo senza la tua conferma esplicita.
>
> In caso di reazione allergica, contatta immediatamente i servizi di emergenza (112) e utilizza l'eventuale terapia prescritta dal tuo medico (es. adrenalina autoiniettabile). AllerTgy non fornisce assistenza medica di emergenza.

Questo testo corrisponde e amplia quanto già presente in `app-mobile/app/disclaimer.tsx:32-40` — va tenuto sincronizzato con quella schermata e aggiunto anche come pagina statica sulla dashboard-web (oggi non presente lì).

### 8.D Dichiarazione di responsabilità del Ristoratore

Testo da mostrare al momento della pubblicazione/conferma del menù (si aggancia ai campi già esistenti `menu_legal_confirmed_at`, `menu_legal_confirmed_by`, `menu_legal_version` in `database/schema_v3.sql:16-18`):

> Il sottoscritto, in qualità di titolare o responsabile del Locale, dichiara che le informazioni sugli allergeni inserite per ciascun piatto sono accurate, aggiornate e verificate con la propria cucina al momento della pubblicazione. Si impegna ad aggiornare tempestivamente il menù in caso di variazione di ricette, fornitori o processi di preparazione, e riconosce che un'informazione errata sugli allergeni può causare un grave danno alla salute di un cliente. Il Locale è l'unico responsabile dell'accuratezza dei Contenuti del Locale caricati sulla piattaforma.

Se il menù viene generato con l'analisi AI (`menu_analyze.py`), va aggiunta una riga: *"Confermo di aver rivisto e corretto manualmente i piatti generati automaticamente prima della pubblicazione."* — perché anche qui l'AI propone, ma è sempre il ristoratore a validare (stesso principio "mai scrittura automatica" usato per i documenti medici).

### 8.E Cookie Policy (dashboard-web)

- **Cookie tecnici** (sessione di login, preferenze lingua): necessari al funzionamento, nessun consenso richiesto.
- **Cookie di terze parti** (es. Stripe Checkout durante il pagamento): attivati solo nella pagina di pagamento, informativa dedicata.
- Se in futuro si aggiunge un tool di analytics (es. Plausible/GA4), va aggiunto un banner di consenso prima dell'attivazione.

### 8.F Condizioni contrattuali abbonamenti (rapporto B2B col Ristoratore)

Il Ristoratore che sottoscrive un piano a pagamento agisce come professionista/azienda, non come consumatore: il diritto di recesso di 14 giorni del Codice del Consumo **non si applica automaticamente** a questo rapporto (va confermato con un commercialista/avvocato in base alla forma giuridica del singolo Locale, es. ditta individuale vs società). Condizioni proposte:
- Rinnovo automatico mensile via Stripe, disdicibile in ogni momento dal Customer Portal, effetto a fine periodo.
- Nessun rimborso pro-quota, salvo diversa indicazione contrattuale o norma inderogabile.
- Fatturazione elettronica tramite i dati SDI/PEC già raccolti (`sdi_code`, `pec_email` in `database/schema_v4.sql:17-18`).
- Downgrade automatico a piano Free dopo il periodo di grazia in caso di pagamento fallito (coerente con la Fase 5 di §10).

### 8.G Dove va integrato tutto questo (checklist legale)

- [ ] `app-mobile/app/legal.tsx` e `disclaimer.tsx`: testo breve già presente, va linkato a versione integrale (webview o pagina web) invece di restare solo un riassunto.
- [ ] `dashboard-web`: creare pagine pubbliche `/termini`, `/privacy`, `/cookie`, `/sicurezza` (oggi assenti — solo checkbox lato app).
- [ ] `backend/app/legal.py`: le costanti versione già esistono, vanno collegate a un endpoint `GET /legal/{doc}` che serve il testo corrente, così app e web leggono sempre la stessa fonte.
- [ ] Dichiarazione Ristoratore (8.D): agganciarla allo step "③ approva e stampa il QR" già descritto in `README.md:51`.
- [ ] Nuovo consenso specifico per estrazione AI documenti medici (8.B.3): non riusare `health_data_consent_at`, serve un consenso per-documento come già previsto in `medical_documents.ai_consent_at` (vedi §3).
- [ ] Far rivedere l'intero documento da un legale prima del lancio pubblico, in particolare Sezioni 8.C e 8.F.

---

## 9. Roadmap a fasi (1 sviluppatore full-time)

| Fase | Contenuto | Stima |
|---|---|---|
| 0 | Sicurezza di base: git init, JWT secret, rotazione password DB, VPS, bucket R2, account Stripe | 2-3 giorni |
| 1 | Recupero password + foto profilo | ~1 settimana |
| 2 | Pagine pubbliche ristorante + SEO + ricerca | ~1,5 settimane |
| 3 | Documenti medici + estrazione AI (la più delicata, serve più test e revisione legale) | ~2 settimane |
| 4 | Recensioni + moderazione | ~1 settimana |
| 5 | Stripe end-to-end (checkout, portal, webhook, fatture) | ~1,5 settimane |
| 6 | Notifiche push + rifiniture UI | ~1 settimana |
| 7 | Hardening, test end-to-end, checklist pre-lancio, beta con ristoranti reali | 3-5 giorni |

**Totale**: circa 8-10 settimane a tempo pieno, 3-4 mesi part-time.

---

## 10. Checklist pre-lancio

- [ ] Repo git inizializzato, `.env` mai committato
- [ ] `JWT_SECRET` reale generato e impostato
- [ ] Password DB Hostinger ruotata rispetto allo screenshot
- [ ] HTTPS attivo su API e dashboard
- [ ] Backup DB automatico configurato e **restore testato almeno una volta**
- [ ] Nessun documento medico o foto privata raggiungibile da `/static` pubblico
- [ ] Testi legali completi (§8) pubblicati su app e dashboard-web, e rivisti da un legale
- [ ] Stripe in modalità live, webhook verificato con firma
- [ ] Test end-to-end completo: registrazione → upload documento → estrazione AI → conferma → scansione QR → recensione → upgrade piano → cancellazione account
- [ ] Monitoring attivo (Sentry + UptimeRobot) con alert configurato
- [ ] Canale di supporto clienti definito (email/contatto assistenza)
