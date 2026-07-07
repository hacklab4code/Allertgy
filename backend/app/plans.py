"""Definizione canonica dei piani commerciali AllerTgy.

Fonte unica usata da internal_admin (KPI/MRR) e billing (prova gratuita,
checkout, endpoint pubblico /billing/plans). I limiti qui devono restare
allineati al gating applicato negli endpoint (es. PLAN_PHOTO_LIMITS in
routers/admin.py).

Struttura piani (aggiornata luglio 2026):
  free        → scheda base, nessun pagamento
  base        → €9/mese  | trial 30 gg | menu + tutte le funzioni
  pro_notify  → €19/mese | trial 30 gg | tutto Base + notifiche push ai preferiti
  [add-on] visibility_boost → one-time €9,90 / 30 giorni di priorità
"""

TRIAL_DAYS = 30

# ──────────────────────────────────────────────────────────────────────────────
# Abbonamenti mensili
# ──────────────────────────────────────────────────────────────────────────────
PLAN_DEFINITIONS = [
    {
        "code": "free",
        "name": "Gratis",
        "price_cents": 0,
        "tagline": "Scheda base per farti trovare sulla mappa.",
        "features": [
            "Scheda locale con nome, indirizzo e orari",
            "1 foto del locale",
            "Presenza nell'elenco e nella ricerca clienti",
        ],
        "photo_limit": 1,
        "has_menu": False,
        "has_review_reply": False,
        "has_priority": False,
        "has_push_notify": False,
    },
    {
        "code": "base",
        "name": "Base",
        "price_cents": 900,           # €9,00/mese
        "tagline": "Carica il tuo menù e gestisci il locale con tutti gli strumenti.",
        "trial_days": TRIAL_DAYS,
        "features": [
            "30 giorni di prova gratuita",
            "Badge \"Locale verificato\"",
            "Menù digitale con allergeni e tracce",
            "Fino a 10 foto in galleria",
            "QR code per tavoli e banco",
            "Registro allergeni stampabile (PDF)",
            "Rispondi alle recensioni dei clienti",
        ],
        "photo_limit": 10,
        "has_menu": True,
        "has_review_reply": True,
        "has_priority": False,
        "has_push_notify": False,
    },
    {
        "code": "pro_notify",
        "name": "Pro Notifiche",
        "price_cents": 1900,          # €19,00/mese
        "tagline": "Come Base, più la possibilità di inviare notifiche push ai tuoi clienti fedeli.",
        "trial_days": TRIAL_DAYS,
        "features": [
            "Tutto del piano Base",
            "Invia notifiche push agli utenti che ti hanno aggiunto ai preferiti",
            "Promuovi sconti, novità e offerte speciali direttamente sul loro telefono",
            "Fino a 20 foto in galleria",
        ],
        "photo_limit": 20,
        "has_menu": True,
        "has_review_reply": True,
        "has_priority": False,
        "has_push_notify": True,
    },
]

# ──────────────────────────────────────────────────────────────────────────────
# Add-on una-tantum: Boost Visibilità
# ──────────────────────────────────────────────────────────────────────────────
BOOST_VISIBILITY = {
    "code": "visibility_boost",
    "name": "Boost Visibilità",
    "price_cents": 990,              # €9,90 pagamento singolo
    "duration_days": 30,             # 30 giorni di priorità elevata
    "tagline": "Metti il tuo locale in cima ai risultati di ricerca per 30 giorni.",
    "description": (
        "Pagamento unico senza abbonamento. Attivabile in qualsiasi momento, "
        "anche più volte. Aumenta la tua posizione nei risultati di ricerca "
        "e nella lista locali vicini."
    ),
}

# ──────────────────────────────────────────────────────────────────────────────
# Dizionari di supporto
# ──────────────────────────────────────────────────────────────────────────────
PLAN_PRICES: dict[str, int] = {p["code"]: int(p["price_cents"]) for p in PLAN_DEFINITIONS}
PAID_PLANS: set[str] = {"base", "pro_notify"}
NOTIFY_PLANS: set[str] = {"pro_notify"}
