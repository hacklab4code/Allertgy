# AllerTgy — Architettura

## Stack

| Livello | Tecnologia | Note |
|---|---|---|
| App mobile | React Native + Expo 54 (TypeScript), expo-router | iOS + Android, motore semaforo client-side |
| Dashboard web | React 18 + Vite + Tailwind CSS 4 | Landing, area ristoratori, pagine pubbliche `/r/{slug}` |
| Backend API | Python FastAPI + SQLAlchemy 2 + JWT | Auth, menù, billing, AI, storage |
| Database | MySQL (Hostinger) | Migrazioni legacy all'avvio + Alembic per nuove revisioni |
| AI | Google Gemini | Analisi menù da foto, documenti medici, traduzioni |
| Pagamenti | Stripe | Abbonamenti ristoratori e clienti Plus |
| Storage | Cloudflare R2 (fallback locale) | File privati con URL firmati |
| Email / Push | Resend + Expo Push | Transazionali e notifiche in-app |

> Abilitare **Remote MySQL** su Hostinger per l'IP del server backend.

## Flusso dati

```
App Expo / Dashboard Web ──HTTPS/JSON──> FastAPI ──SQL──> MySQL
   │                                        │
   └── engine/semaforo.ts (client)          ├── Gemini, Stripe, R2, Resend
```

Il motore semaforo gira **sul client**: l'API restituisce allergeni grezzi, l'app calcola 🟢 / 🟡 / 🔴.

## Struttura cartelle

```
allerTgy/
├── app-mobile/              # Expo (B2C + modalità ristoratore)
│   ├── app/                 # expo-router: (tabs), (owner), menu/, onboarding
│   └── src/
│       ├── api/             # client HTTP
│       ├── engine/          # semaforo.ts, offAllergens.ts, compatibility
│       ├── services/        # barcodeScan, push, geofencing, appleHealth, favorites
│       ├── components/      # DishCard, RestaurantCard, …
│       ├── store/           # Zustand: sessione, notifiche, owner
│       └── utils/           # openHours, …
│
├── dashboard-web/           # React + Vite
│   ├── src/
│   │   ├── App.tsx          # Routing pubblico + shell auth
│   │   ├── OwnerDashboard.tsx
│   │   ├── data/plans.ts    # Piani commerciali (fonte UI)
│   │   └── components/      # MenuEditor, InternalAdmin, landing, …
│
├── backend/                 # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py      # Engine SQLAlchemy (snello)
│   │   ├── models.py        # ORM
│   │   ├── schemas.py       # Pydantic
│   │   ├── plans.py         # ★ Piani commerciali (fonte unica backend)
│   │   ├── migrations/      # legacy.py (migrazioni idempotenti MVP)
│   │   ├── routers/         # auth, profile, restaurants, admin, billing, …
│   │   └── services/        # menu_analyze, storage, push, stripe, …
│   └── alembic/             # Nuove migrazioni versionate
│
└── database/
    ├── schema.sql           # DDL iniziale
    └── seed_demo.sql        # Dati di prova
```

## Piani commerciali (codici canonici)

| Codice | Nome | Prezzo | Target |
|---|---|---:|---|
| `free` | Gratis | €0 | Ristoratore: scheda mappa |
| `base` | Base | €9/mese | Menù semaforo + QR + PDF |
| `pro_notify` | Pro | €19/mese | Base + push, AI illimitata, statistiche |
| `customer_free` | Gratis | €0 | Cliente: scan + 1 profilo |
| `customer_plus` | Plus Famiglia | €3,99/mese | Sottoprofili, spesa illimitata |

> I codici legacy `verified`, `pro`, `premium` nel DB sono mappati automaticamente da `plans.py`.

## Contratto API (principali)

| Metodo | Endpoint | Descrizione |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | Registrazione e JWT |
| GET/PUT | `/profile/allergens` | Profilo allergie utente |
| GET | `/restaurants/{codice}/menu` | Menù con allergeni per piatto |
| POST | `/restaurants/{codice}/menu/evaluate` | Valutazione anonima (no salvataggio dati) |
| GET | `/admin/restaurants/{id}/registry.pdf` | Registro allergeni PDF |
| GET | `/billing/plans` | Piani commerciali |
| POST | `/billing/checkout` | Stripe Checkout |
| GET | `/legal/{doc}` | Testi legali |

## Migrazioni database

1. **Legacy** (`app/migrations/legacy.py`): eseguite all'avvio, idempotenti, per DB esistenti.
2. **Alembic** (`backend/alembic/`): per nuove modifiche schema in produzione.

```bash
cd backend
alembic revision --autogenerate -m "descrizione"
alembic upgrade head
```

## Note implementative

- **Apple Salute**: export testuale del profilo allergie (no integrazione HealthKit).
- **Semaforo**: funzione pura in `semaforo.ts`, coperta da unit test (`npm test` in app-mobile).
- **Servizi esterni**: ogni integrazione ha fallback dev (stub AI, storage locale, log email).
