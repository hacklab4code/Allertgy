"""Definizione canonica dei piani commerciali AllerTgy.

Fonte unica usata da internal_admin (KPI/MRR) e billing (prova gratuita,
checkout, endpoint pubblico /billing/plans). I limiti qui devono restare
allineati al gating applicato negli endpoint (es. PLAN_PHOTO_LIMITS in
routers/admin.py).
"""

TRIAL_DAYS = 14

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
        "tagline": "Carica il menù: i clienti scoprono cosa possono mangiare da te.",
        "trial_days": TRIAL_DAYS,
        "features": [
            "14 giorni di prova gratuita",
            "Badge \"Locale verificato\"",
            "Semaforo personalizzato per ogni cliente con allergie",
            "Fino a 10 foto in galleria",
            "QR code per tavoli e banco",
            "Registro allergeni stampabile (PDF)",
            "Rispondi alle recensioni dei clienti",
            "5 analisi AI menù/mese",
            "Traduzioni menù in 2 lingue",
        ],
        "photo_limit": 10,
        "has_menu": True,
        "has_review_reply": True,
        "has_priority": False,
        "has_push_notify": False,
        "ai_menu_scans_per_month": 5,
        "translation_languages": 2,
        "analytics_level": "base",
    },
    {
        "code": "pro_notify",
        "name": "Pro Crescita",
        "price_cents": 1900,          # €19,00/mese
        "tagline": "Come Base, più strumenti per far tornare i clienti allergy-friendly.",
        "trial_days": TRIAL_DAYS,
        "features": [
            "Tutto del piano Base",
            "Invia notifiche push agli utenti che ti hanno aggiunto ai preferiti",
            "Promuovi sconti, novità e offerte speciali direttamente sul loro telefono",
            "Analisi AI menù illimitate",
            "Traduzioni automatiche in 15 lingue",
            "Statistiche avanzate su scansioni e allergeni cercati",
            "Badge \"Allergy-friendly\" in evidenza",
            "Fino a 20 foto in galleria",
        ],
        "photo_limit": 20,
        "has_menu": True,
        "has_review_reply": True,
        "has_priority": False,
        "has_push_notify": True,
        "ai_menu_scans_per_month": None,
        "translation_languages": 15,
        "analytics_level": "advanced",
    },
]

CUSTOMER_PLAN_DEFINITIONS = [
    {
        "code": "customer_free",
        "name": "Cliente Gratis",
        "price_cents": 0,
        "tagline": "Il semaforo al tavolo resta sempre gratuito.",
        "features": [
            "Scansione QR ristorante e semaforo personalizzato",
            "1 profilo allergie personale",
            "Preferiti locali limitati",
            "Recensioni allergy-focused",
        ],
        "sub_profile_limit": 0,
        "barcode_scan_limit_month": 20,
        "medical_ai_limit_month": 0,
        "shared_profile_permanent": False,
    },
    {
        "code": "customer_plus",
        "name": "Plus Famiglia",
        "price_cents": 399,           # €3,99/mese
        "tagline": "Per famiglie, feste e spesa quotidiana con profili condivisi.",
        "features": [
            "Sottoprofili famiglia illimitati",
            "Condivisione profilo 24h o permanente",
            "Scanner spesa illimitato e cronologia cloud",
            "Notifiche menù aggiornati e locali vicini",
            "5 analisi AI documenti medici/mese",
            "Carta allergie esportabile",
        ],
        "sub_profile_limit": None,
        "barcode_scan_limit_month": None,
        "medical_ai_limit_month": 5,
        "shared_profile_permanent": True,
    },
]

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

PLAN_PRICES = {p["code"]: int(p["price_cents"]) for p in PLAN_DEFINITIONS}
PAID_PLANS = {"base", "pro_notify"}
NOTIFY_PLANS = {"pro_notify"}
CUSTOMER_PLAN_PRICES = {p["code"]: int(p["price_cents"]) for p in CUSTOMER_PLAN_DEFINITIONS}
