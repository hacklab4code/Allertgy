"""Definizione canonica dei piani commerciali AllerTgy.

Fonte unica usata da internal_admin (KPI/MRR) e billing (prova gratuita,
checkout, endpoint pubblico /billing/plans). I limiti qui (foto galleria,
menù digitale, risposta recensioni, priorità) devono restare allineati al
gating applicato negli endpoint (es. PLAN_PHOTO_LIMITS in routers/admin.py).
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
    },
    {
        "code": "verified",
        "name": "Verificato",
        "price_cents": 990,
        "tagline": "Badge verificato e più fiducia dai clienti.",
        "features": [
            "Tutto del piano Gratis",
            "Badge \"Locale verificato\"",
            "Fino a 3 foto in galleria",
            "Rispondi alle recensioni dei clienti",
        ],
        "photo_limit": 3,
        "has_menu": False,
        "has_review_reply": True,
        "has_priority": False,
    },
    {
        "code": "pro",
        "name": "Pro",
        "price_cents": 1990,
        "tagline": "Il menù digitale con allergeni per piatto.",
        "features": [
            "Tutto del piano Verificato",
            "Menù digitale con allergeni e tracce per piatto",
            "QR code per i tavoli e il banco",
            "Registro allergeni stampabile (PDF)",
            "Fino a 8 foto in galleria",
        ],
        "photo_limit": 8,
        "has_menu": True,
        "has_review_reply": True,
        "has_priority": False,
    },
    {
        "code": "premium",
        "name": "Premium",
        "price_cents": 3990,
        "tagline": "Massima visibilità e strumenti avanzati.",
        "features": [
            "Tutto del piano Pro",
            "Priorità nei risultati di ricerca",
            "Fino a 20 foto in galleria",
            "Gestione multi-sede e supporto prioritario",
        ],
        "photo_limit": 20,
        "has_menu": True,
        "has_review_reply": True,
        "has_priority": True,
    },
]

PLAN_PRICES = {p["code"]: int(p["price_cents"]) for p in PLAN_DEFINITIONS}
PAID_PLANS = {"verified", "pro", "premium"}
