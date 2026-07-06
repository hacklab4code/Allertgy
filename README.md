# 🥗 AllerTgy — MVP

Piattaforma per mangiare fuori casa in sicurezza con allergie e intolleranze.
Tre componenti: **backend API**, **dashboard ristoratore (B2B)**, **app mobile (B2C)**.

```
allerTgy/
├── database/        schema.sql + schema_v2.sql + schema_v3.sql + schema_v4.sql + seed_demo.sql
├── backend/         FastAPI (Python) — API REST, auth JWT, stub AI Vision
├── dashboard-web/   React + Vite + Tailwind — area ristoratori
└── app-mobile/      Expo / React Native — app utenti col semaforo
```

## 1. Database (una tantum, su Hostinger)

1. hPanel → **phpMyAdmin** → database `u490938806_allerYgy` → tab *SQL*
2. Esegui in ordine: `database/schema.sql`, `database/schema_v2.sql`, `database/schema_v3.sql`, `database/schema_v4.sql`, `database/seed_demo.sql` (opzionale, ristorante di prova codice **100001**)
3. hPanel → Database → **Remote MySQL** → aggiungi l'IP del computer dove gira il backend (o `%` per test)
4. ⚠️ La password del DB era in uno screenshot: **cambiala** e aggiorna `backend/.env`

## 2. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python seed_demo.py          # crea gli account demo (vedi sotto)
uvicorn app.main:app --reload --host 0.0.0.0
```

API su `http://localhost:8000` — documentazione interattiva su `/docs`.

### Account demo (creati da `seed_demo.py`)

| Ruolo | Email | Password | Note |
|---|---|---|---|
| 🙋 Cliente | `cliente@allertgy.it` | `Cliente123!` | allergico a latte e crostacei |
| 👨‍🍳 Ristoratore | `ristoratore@allertgy.it` | `Ristorante1!` | possiede il locale **100001** (8 piatti) |

## 3. Sito web: landing + dashboard ristoratore

```bash
cd dashboard-web
npm install
npm run dev        # http://localhost:5173
```

Si apre la **pagina iniziale pubblica** (come funziona per clienti e ristoratori,
spiegazione del semaforo). Da "Area Ristoratori" si accede alla dashboard con
percorso guidato in 3 step: ① crea il locale → ② prepara il menù (foto AI,
modifica del menù pubblicato, o inserimento manuale) → ③ approva e stampa il QR.
Il pulsante **❓ Guida** mostra le istruzioni in ogni momento.

### Piani commerciali

Il modello è **clienti gratis** e **commercianti a pagamento**:

| Piano | Prezzo | Include |
|---|---:|---|
| Gratis | €0 | scheda locale base sulla mappa |
| Verificato | €9,90/mese | badge verificato e dati aggiornati |
| Pro | €19,90/mese | menù digitale, allergeni per piatto, QR code, registro allergeni |
| Premium | €39,90/mese | priorità, supporto e strumenti avanzati |

Il menù digitale con allergeni per piatto è protetto lato API: serve piano `pro`
o `premium` con stato `trialing`, `active` o `comped`.

### Dashboard interna admin

Apri `http://localhost:5173/internal-admin`.

La dashboard interna permette di vedere KPI, locali, utenti, MRR stimato, stato
dei piani, dati fatturazione e note commerciali. L'accesso usa l'header
`X-Admin-Key`; in sviluppo il backend usa `dev-admin` se `INTERNAL_ADMIN_KEY`
non è impostata. In produzione imposta sempre una chiave forte in `backend/.env`.

> L'analisi AI è per ora uno **stub** (risultato di esempio). Per attivare Gemini
> Vision: inserisci `GEMINI_API_KEY` nel `.env` e implementa la chiamata in
> `backend/app/services/menu_analyze.py` (prompt già pronto nel file).

## 4. App mobile

```bash
cd app-mobile
npm install
# se provi su telefono fisico, l'app deve raggiungere il backend:
EXPO_PUBLIC_API_URL=http://<IP-del-tuo-Mac>:8000 npx expo start
```

Scansiona il QR con Expo Go. L'app ha **due modalità** (scelta alla registrazione):

**🙋 Cliente** — tab in basso: *Cerca* (QR/codice locale), *Locali* (preferiti ⭐️ +
recenti), *Account* (allergie, sicurezza, assistenza, esci). Onboarding: benvenuto →
registrazione con Termini/Privacy/consenso dati salute → selezione allergie facoltativa
(14 UE + diete) → disclaimer sicurezza. Il menù semaforo è
diviso per categorie (antipasti, primi…) dentro le sezioni 🟢🟡🔴.
Il backend espone anche `POST /restaurants/{codice}/menu/evaluate` per valutare
un menù pubblico senza account e senza salvare dati sanitari, utile per un futuro
QR web immediato.

**👨‍🍳 Ristoratore** — tab: *Locale* (crea/seleziona), *Menù* (editor piatti con
categorie e allergeni: tocca un allergene per ciclare contiene → tracce → assente),
conferma responsabilità sui dati allergeni prima della pubblicazione, *QR Code*
(codice e QR per i tavoli), *Account*.
Ogni salvataggio/approvazione menù viene tracciato in `menu_audit_logs`; la dashboard
può scaricare il registro allergeni PDF da `/admin/restaurants/{id}/registry.pdf`.

## Il semaforo

Logica client-side in `app-mobile/src/engine/semaforo.ts` (funzione pura):
🔴 allergene nei **contenuti** → non idoneo · 🟡 solo nelle **tracce** → rischio
contaminazione · 🟢 nessun match dichiarato dal ristoratore.

Test: `cd app-mobile && npm test`

## Prossimi passi (Fase 2)

Integrazione reale Gemini Vision, tag NFC, multi-menù per locale, notifiche
aggiornamento menù, pannello admin AllerTgy.
