# AllerTgy — Architettura MVP (App Utente B2C)

## Stack (adattato al tuo hosting)

| Livello | Tecnologia | Note |
|---|---|---|
| Frontend | React Native + Expo (TypeScript), NativeWind | iOS + Android |
| Backend API | Python FastAPI + SQLAlchemy + JWT | Strato obbligatorio: RN non parla direttamente con MySQL |
| Database | **MySQL su Hostinger** (host `92.113.22.69`, db `u490938806_allerYgy`) | Credenziali nel file `.env` del backend (mai committare) |
| AI (fase 2) | API Gemini (Vision) per lettura menù da foto | Non ancora — predisposto in `backend/app/services/` |

> ⚠️ Su Hostinger: abilitare **Remote MySQL** (hPanel → Database → Remote MySQL) per l'IP da cui gira FastAPI, altrimenti la connessione remota viene rifiutata.

## Flusso dati

```
App Expo ──HTTPS/JSON──> FastAPI ──SQL──> MySQL Hostinger
   │                        │
   └── logica "semaforo" (TypeScript, lato client)
```

Il motore semaforo gira **sul client**: l'API restituisce il menù con gli allergeni, l'app lo confronta col profilo utente → 🟢 / 🟡 / 🔴.

## Struttura cartelle

```
allertgy/
├── app-mobile/                  # Expo (TypeScript)
│   ├── app/                     # expo-router (file-based routing)
│   │   ├── (auth)/
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── (onboarding)/
│   │   │   ├── allergie.tsx     # selezione 14 allergeni + diete
│   │   │   └── disclaimer.tsx   # disclaimer legale obbligatorio
│   │   ├── (main)/
│   │   │   ├── index.tsx        # home: scanner QR / codice locale
│   │   │   ├── menu/[codice].tsx# menù semaforo del ristorante
│   │   │   └── profilo.tsx
│   │   └── _layout.tsx
│   ├── src/
│   │   ├── api/client.ts        # fetch verso FastAPI
│   │   ├── engine/semaforo.ts   # ★ motore di match (puro, testabile)
│   │   ├── engine/semaforo.test.ts
│   │   ├── store/               # stato (Zustand): sessione + profilo
│   │   ├── components/          # DishCard, AllergenChip, TrafficBadge…
│   │   └── types/index.ts       # tipi condivisi (Piatto, Allergene…)
│   ├── app.json
│   └── package.json
│
├── backend/                     # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py            # legge .env
│   │   ├── database.py          # SQLAlchemy engine (mysql+pymysql)
│   │   ├── models/              # ORM: user, allergen, restaurant, dish
│   │   ├── schemas/             # Pydantic (request/response)
│   │   ├── routers/
│   │   │   ├── auth.py          # register / login (JWT)
│   │   │   ├── profile.py       # GET/PUT allergie utente
│   │   │   └── restaurants.py   # GET /restaurants/{codice}/menu
│   │   └── services/            # (fase 2: gemini_vision.py)
│   ├── .env                     # credenziali DB — in .gitignore
│   ├── requirements.txt
│   └── .gitignore
│
└── database/
    ├── schema.sql               # DDL + seed 14 allergeni UE
    └── seed_demo.sql            # ristorante demo per i test
```

## Contratto API (MVP)

| Metodo | Endpoint | Descrizione |
|---|---|---|
| POST | `/auth/register` | email + password → JWT |
| POST | `/auth/login` | → JWT |
| GET | `/profile/allergens` | allergie salvate dell'utente |
| PUT | `/profile/allergens` | `{"allergen_ids": [1,7,…]}` |
| GET | `/restaurants/{codice}/menu` | menù: `[{nome_piatto, allergeni_contenuti[], allergeni_tracce[]}]` |
| POST | `/restaurants/{codice}/menu/evaluate` | valutazione semaforo pubblica senza account, senza salvare dati sanitari |
| GET | `/allergens` | lista dei 14 allergeni + diete (per l'onboarding) |
| GET | `/admin/restaurants/{id}/menu/audit` | storico salvataggi/approvazioni menù per ristoratore |
| GET | `/admin/restaurants/{id}/registry.pdf` | export PDF registro allergeni del locale |

## Ordine dei moduli di sviluppo

1. Database (schema.sql) ← **questo step**
2. Backend: auth + endpoint allergeni/profilo
3. Backend: endpoint menù ristorante
4. App: onboarding + selezione allergie
5. App: scanner QR / codice locale
6. App: motore semaforo + UI menù
7. (Fase 2) Gemini Vision + pannello ristoratori
