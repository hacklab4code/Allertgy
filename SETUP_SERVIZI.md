# AllerTgy — Setup servizi (senza Vercel, Resend, Sentry)

Stack scelto: **Hostinger MySQL + Gemini + Stripe Test + Cloudflare R2 + Expo**.
Email → log console (già nel codice). Web → locale o Hostinger. Errori → log server.

---

## Riepilogo account da creare

| # | Servizio | Costo | A cosa serve |
|---|---|---:|---|
| 1 | **Hostinger** (ce l'hai) | già pagato | Database MySQL |
| 2 | **Google AI Studio** | €0 | AI menù + referti |
| 3 | **Stripe** (Test Mode) | €0 | Pagamenti sandbox |
| 4 | **Cloudflare** (R2) | €0 | Foto + documenti medici |
| 5 | **Expo** | €0 | Build app + push |

**Saltati:** Vercel, Resend, Sentry.

---

## Step 0 — File `.env` del backend

```bash
cd backend
bash scripts/init-env.sh
```

Poi apri `backend/.env` e compila solo le sezioni segnate `← COMPILA`.

---

## Step 1 — Hostinger MySQL (5 min)

1. hPanel → **Database MySQL** → annota host, nome DB, utente, password
2. hPanel → **Remote MySQL** → aggiungi il tuo IP pubblico (o `%` solo in dev)
3. In `backend/.env`:

```
DB_HOST=...
DB_NAME=u490938806_allerYgy
DB_USER=...
DB_PASSWORD=...
```

4. Verifica connessione:

```bash
cd backend && source .venv/bin/activate  # o crea venv prima
python seed_demo.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Apri http://localhost:8000/health → deve rispondere `{"status":"ok"}`.

---

## Step 2 — Google Gemini (10 min)

1. Vai su https://aistudio.google.com/apikey
2. **Create API key** → copia la chiave
3. In `backend/.env`:

```
GEMINI_API_KEY=AIza...
```

4. Test: dashboard ristoratore → carica foto menù → deve estrarre piatti reali (non più stub).

---

## Step 3 — Stripe Test Mode (30 min)

**Automatico (consigliato):** dopo aver copiato `sk_test_...` in `backend/.env`:

```bash
cd backend && source .venv/bin/activate
python scripts/setup_stripe.py
```

Crea i 4 prezzi e scrive i Price ID nel `.env`:

| Prodotto | Prezzo | Variabile `.env` |
|---|---|---|
| Base | €9/mese | `STRIPE_PRICE_BASE` |
| Pro | €19/mese | `STRIPE_PRICE_PRO_NOTIFY` |
| Plus Famiglia | €3,99/mese | `STRIPE_PRICE_CUSTOMER_PLUS` |
| Boost Visibilità | €9,90 una tantum | `STRIPE_PRICE_BOOST` |

**Manuale** (alternativa):

1. Crea account su https://dashboard.stripe.com/register
2. Resta in **Test mode** (toggle in alto a destra)
3. **Products** → crea i 4 prodotti come in tabella sopra
4. **Developers → API keys** → copia `sk_test_...` in `STRIPE_SECRET_KEY`

5. Webhook locale (terminale separato — **tienilo aperto durante i test pagamenti**):

```bash
bash scripts/stripe-webhook.sh
```

Lo script legge `STRIPE_SECRET_KEY` dal `.env` e inoltra gli eventi a `localhost:8000/billing/webhook`.
Il signing secret (`whsec_...`) va in `STRIPE_WEBHOOK_SECRET` nel `.env` (già configurato se hai usato `stripe listen --print-secret`).

6. Test checkout con carta `4242 4242 4242 4242`, scadenza qualsiasi futura, CVC qualsiasi.

---

## Step 4 — Cloudflare R2 (15 min)

1. Account su https://dash.cloudflare.com (gratis)
2. **R2 Object Storage** → **Create bucket** → nome `allertgy-private` → **privato**
3. **Manage R2 API Tokens** → Create token → permessi Read & Write sul bucket
4. Annota Account ID (in dashboard R2, colonna destra)
5. In `backend/.env`:

```
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=allertgy-private
```

6. Test: app mobile → Account → cambia foto profilo → deve caricarsi senza errori.

> **Alternativa:** lascia R2 vuoto → i file vanno in `backend/private_storage/` (funziona uguale in locale).

---

## Step 5 — Expo (15 min)

1. Account su https://expo.dev/signup
2. Nel progetto:

```bash
cd app-mobile
npm install -g eas-cli   # se non ce l'hai
eas login
eas init                 # collega il progetto, genera project ID
```

3. `eas init` aggiorna automaticamente `app.json` → `extra.eas.projectId`
4. Per testare sul telefono (stesso WiFi del Mac):

```bash
# Trova IP Mac: ifconfig | grep "inet "
EXPO_PUBLIC_API_URL=http://192.168.X.X:8000 npx expo start
```

5. Per push notifications (opzionale, richiede build):

```bash
eas build --profile development --platform ios   # o android
```

---

## Cosa NON configurare (saltato)

| Servizio | Cosa succede senza |
|---|---|
| **Resend** | Email reset password → compaiono nel log del terminale backend |
| **Vercel** | Dashboard web → `cd dashboard-web && npm run dev` (locale) o build su Hostinger |
| **Sentry** | Errori → log uvicorn, nessun monitoraggio cloud |

---

## Checklist finale

- [ ] `backend/.env` compilato (DB + JWT già generati dallo script)
- [ ] `GET /health` risponde OK
- [ ] Login demo: `cliente@allertgy.it` / `Cliente123!`
- [ ] Foto menù AI estrae piatti reali (Gemini)
- [ ] Checkout Stripe test completa (carta 4242...)
- [ ] Upload foto profilo funziona (R2 o locale)
- [ ] App mobile raggiunge API via IP locale

---

## Smoke test automatico (flusso critico)

Con il backend avviato e `seed_demo.py` già eseguito:

```bash
# Terminale 1 — backend
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminale 2 — smoke test
bash scripts/smoke-test.sh
```

Verifica in sequenza: health → login cliente → allergeni → menù 100001 → semaforo → preferiti → login ristoratore → catalogo allergeni.

### Smoke test manuale (app mobile)

1. **Ristoratore** — login `ristoratore@allertgy.it` / `Ristorante1!` → Menù → verifica 8 piatti con allergeni → QR codice **100001**
2. **Cliente** — login `cliente@allertgy.it` / `Cliente123!` → Scansiona → inserisci **100001**
3. Controlla semaforo su piatti con latte/crostacei (profilo demo) → devono essere 🔴 o 🟡
4. Aggiungi ai preferiti → dal backend/dashboard approva un aggiornamento menù → notifica push (con dev build)

### Test backend completi

```bash
cd backend && source .venv/bin/activate && pytest -q
```

Include test webhook Stripe (`tests/test_stripe_webhook.py`).

---

## Quando andrai live (dopo)

- VPS (~€5/mese) per API H24
- Dominio `.it` (~€10/anno)
- Stripe **Live Mode** (stessi passi, chiavi `sk_live_...`)
- Hostinger hosting per build statica dashboard (`npm run build` → carica `dist/`)
- Apple Developer €99/anno + Google Play €25 (store)
