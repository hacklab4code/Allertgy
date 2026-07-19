# 🥗 AllerTgy

Piattaforma per mangiare fuori casa in sicurezza con allergie e intolleranze.
Tre componenti: **backend API**, **dashboard ristoratore (B2B)**, **app mobile (B2C)**.

```
allerTgy/
├── database/        schema.sql + seed_demo.sql
├── backend/         FastAPI — API REST, auth JWT, AI Vision, Stripe, storage privato
├── dashboard-web/   React + Vite + Tailwind — landing, area ristoratori, pagine pubbliche /r/{slug}
└── app-mobile/      Expo / React Native — app utenti col semaforo
```

> Stato lancio e attivazione servizi esterni: **PIANO_LANCIO.md**
> Deploy produzione (VPS, Vercel, EAS, Stripe live): **PRODUZIONE.md**
> Architettura aggiornata: **ARCHITETTURA.md**

## Funzioni principali

- Recupero password via email (token 30 min, anti-enumeration)
- Foto profilo e galleria locale su **storage privato** (R2 o fallback locale) con URL firmati
- Pagina pubblica ristorante `/r/{slug}` con SEO, orari, galleria, rating
- Documenti medici con consenso AI per-documento, estrazione Gemini, conferma manuale obbligatoria
- Recensioni, risposta ristoratore (piano Base+), moderazione admin
- Abbonamenti **Stripe** end-to-end (Checkout, Portal, webhook, fatture)
- Notifiche push Expo ed email transazionali (Resend)
- Testi legali da `GET /legal/{doc}`

## 1. Database

Il backend applica le migrazioni automaticamente all'avvio (`app/migrations/legacy.py`).
Per nuove modifiche schema usa **Alembic** (vedi `ARCHITETTURA.md`).

Setup iniziale su Hostinger: esegui `database/schema.sql` + `seed_demo.sql` in phpMyAdmin.

## 2. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python seed_demo.py
uvicorn app.main:app --reload --host 0.0.0.0
```

API su `http://localhost:8000` — docs su `/docs`.

Configurazione in `backend/.env` (vedi `.env.example`): DB, `JWT_SECRET`,
`GEMINI_API_KEY`, `R2_*`, `RESEND_API_KEY`, `STRIPE_*`.
Senza chiavi esterne l'app funziona in modalità sviluppo con fallback locali.

### Account demo (`seed_demo.py`)

| Ruolo | Email | Password | Note |
|---|---|---|---|
| 🙋 Cliente | `cliente@allertgy.it` | `Cliente123!` | allergico a latte e crostacei |
| 👨‍🍳 Ristoratore | `ristoratore@allertgy.it` | `Ristorante1!` | locale **100001** (8 piatti) |

## 3. Dashboard web

```bash
cd dashboard-web
npm install
npm run dev        # http://localhost:5173
```

Landing pubblica + area ristoratori con percorso guidato in 3 step.
Admin interno: `http://localhost:5173/internal-admin` (header `X-Admin-Key`).

### Piani commerciali

**Clienti gratis**, **ristoratori a pagamento**:

| Piano | Codice | Prezzo | Include |
|---|---|---:|---|
| Gratis | `free` | €0 | Scheda locale sulla mappa, 1 foto |
| Base | `base` | €9/mese | Semaforo clienti, QR, PDF allergeni, menù digitale (14 gg prova) |
| Pro | `pro_notify` | €19/mese | Tutto Base + push clienti, AI illimitata, statistiche |

**Clienti Plus Famiglia** (opzionale): €3,99/mese — sottoprofili, spesa illimitata, profili condivisi.

Il menù digitale con allergeni per piatto richiede piano `base` o `pro_notify` con stato `trialing`, `active` o `comped`.

## 4. App mobile

```bash
cd app-mobile
npm install
EXPO_PUBLIC_API_URL=http://<IP-Mac>:8000 npx expo start
```

**Cliente** — tab: Home, Ristoranti, Profilo + azione centrale **Scansiona** (QR locale, barcode, codice manuale).
**Ristoratore** — tab: Attività, Menù, QR, Profilo.

## Il semaforo

Logica client-side in `app-mobile/src/engine/semaforo.ts` (funzione pura):
🔴 allergene nei **contenuti** · 🟡 solo nelle **tracce** · 🟢 nessun match.

Test: `cd app-mobile && npm test`

## Prossimi passi

- Attivare servizi esterni (Gemini, Stripe, R2) — vedi **SETUP_SERVIZI.md**
- Build nativa Expo per push notification su device reale
- Tag NFC (Fase 2)
- Deploy produzione e submission store
