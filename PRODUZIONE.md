# AllerTgy — Guida al deploy in produzione

Questa guida porta l'app dalla **beta** alla **produzione pubblica**.
Aggiorna i placeholder `TUO-DOMINIO`, email e chiavi API con i valori reali.

---

## Architettura target

```
                    ┌─────────────────┐
  App iOS/Android   │  Expo EAS Build │
  (allertgy://)     └────────┬────────┘
                             │ HTTPS
  Browser clienti/owner      ▼
                    ┌─────────────────┐
                    │  Vercel         │  app.allertgy.it (dashboard + landing)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  VPS + Nginx    │  api.allertgy.it (FastAPI Docker)
                    └────────┬────────┘
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
    MySQL Hostinger    Cloudflare R2      Stripe / Resend / Gemini
```

---

## Checklist rapida (ordine consigliato)

### Fase A — Account e domini (1 giorno)

- [ ] Registra dominio (es. `allertgy.it`)
- [ ] DNS: `api` → IP VPS, `app` → Vercel
- [ ] Ruota password DB Hostinger (hPanel) e aggiorna `.env`
- [ ] Genera `JWT_SECRET`: `openssl rand -hex 64`
- [ ] Genera `INTERNAL_ADMIN_KEY`: `openssl rand -hex 32`

### Fase B — Servizi esterni (1–2 giorni)

| Servizio | Variabili `.env` | Azione |
|----------|------------------|--------|
| **Cloudflare R2** | `R2_*` | Bucket privato per foto e documenti medici |
| **Resend** | `RESEND_API_KEY`, `EMAIL_FROM` | Verifica dominio, email transazionali |
| **Stripe Live** | `STRIPE_*` | 3 prezzi: Base €9, Pro €19, Plus €3.99 + Boost €9.90 |
| **Gemini** | `GEMINI_API_KEY` | AI menù e referti |
| **Expo** | `eas.json` | `eas init` → project ID in `app.json` |

Webhook Stripe: `https://api.TUO-DOMINIO.it/billing/webhook`
Eventi: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`, `payment_intent.succeeded`

### Fase C — Backend VPS (mezza giornata)

```bash
# Sul VPS Ubuntu
git clone <repo> allertgy && cd allertgy
cp backend/.env.example backend/.env   # compila tutti i campi
nano backend/.env                        # APP_ENV=production

chmod +x deploy/scripts/*.sh
./deploy/scripts/setup-vps.sh
```

**`backend/.env` produzione (esempio):**
```env
APP_ENV=production
DB_HOST=srvXXX.hstgr.io
DB_PORT=3306
DB_NAME=u490938806_allerYgy
DB_USER=u490938806_...
DB_PASSWORD=<password-ruotata>
JWT_SECRET=<openssl rand -hex 64>
CORS_ORIGINS=https://app.allertgy.it,https://allertgy.it
PUBLIC_WEB_URL=https://app.allertgy.it
PUBLIC_API_URL=https://api.allertgy.it
INTERNAL_ADMIN_KEY=<casuale>
# ... R2, Resend, Stripe, Gemini
```

Verifica:
```bash
curl https://api.allertgy.it/health
# {"status":"ok","env":"production","db":true}
```

Backup automatico (cron):
```cron
0 3 * * * /path/to/allertgy/deploy/scripts/backup-db.sh
```

### Fase D — Dashboard web su Vercel (1 ora)

```bash
cd dashboard-web
npm i -g vercel
vercel link
```

Variabili ambiente Vercel:
- `VITE_API_URL` = `https://api.allertgy.it`

```bash
vercel deploy --prod
```

Collega dominio `app.allertgy.it` nel pannello Vercel.

### Fase E — App mobile (1–2 giorni)

```bash
cd app-mobile
npm install -g eas-cli
eas login
eas init                    # aggiorna projectId in app.json
eas build --platform all    # build production
eas submit                  # App Store + Play Store
```

Prima del submit:
- Account Apple Developer ($99/anno)
- Account Google Play ($25 una tantum)
- Aggiorna `eas.json` → `submit.production` con i tuoi ID

Test push su device reale (non Expo Go):
```bash
eas build --profile preview --platform ios
```

### Fase F — Legale e beta (prima del lancio pubblico)

- [ ] Revisione testi in `backend/app/legal.py` da un avvocato
- [ ] DPIA informale per dati sanitari (Art. 9 GDPR)
- [ ] Canale supporto: `supporto@allertgy.it`
- [ ] Monitoring: [UptimeRobot](https://uptimerobot.com) su `/health`
- [ ] (Opzionale) Sentry: `SENTRY_DSN` in `.env`

### Fase G — Beta chiusa (5–10 ristoratori)

1. Invita ristoratori pilota con trial 14 giorni
2. Stampa QR codice locale
3. Raccogli feedback su: semaforo, editor menù, pagamenti
4. Monitora log Stripe webhook e errori API

---

## Comandi utili

| Azione | Comando |
|--------|---------|
| Riavvia API | `cd deploy && docker compose restart api` |
| Log API | `docker compose logs -f api` |
| Migrazioni manuali | `cd backend && .venv/bin/python -c "from app.database import run_migrations; run_migrations()"` |
| Test backend | `cd backend && python3 -m pytest tests/ -q` |
| Build web | `cd dashboard-web && npm run build` |

---

## Costi mensili stimati (lancio)

| Voce | Costo |
|------|------:|
| VPS (Hetzner/Hostinger) | ~€6 |
| MySQL Hostinger | incluso |
| Vercel (hobby) | €0 |
| R2, Resend, Expo Push | €0 (free tier) |
| Stripe | % sulle transazioni |
| Gemini | ~€2–5 |
| **Totale fisso** | **~€8/mese** |

Store: Apple $99/anno + Google $25 una tantum.

---

## Troubleshooting

**`/health` → `db: false`**
→ Verifica Remote MySQL su Hostinger (IP VPS in whitelist) e credenziali `.env`.

**Stripe webhook 400**
→ Controlla `STRIPE_WEBHOOK_SECRET` e URL esatto nel dashboard Stripe.

**Push non arrivano**
→ Serve build EAS (non Expo Go). Verifica `expo-notifications` plugin e permessi iOS.

**CORS error dalla web**
→ Aggiungi dominio Vercel in `CORS_ORIGINS`.

---

## Dopo il lancio

1. Monitora MRR e conversioni trial → pagamento
2. Itera su feedback ristoratori (editor menù, statistiche)
3. Espandi geograficamente dopo 20+ locali attivi
4. Valuta Fatture in Cloud / SDI per fatturazione elettronica B2B

Per dettagli storici sul piano di sviluppo vedi `PIANO_LANCIO.md`.
