"""Definizione canonica dei piani commerciali AllerTgy.

Fonte unica usata da internal_admin (KPI/MRR) e billing (prova gratuita,
checkout, endpoint pubblico /billing/plans). I limiti qui devono restare
allineati al gating applicato negli endpoint (es. PLAN_PHOTO_LIMITS in
routers/admin.py).
"""
from __future__ import annotations

TRIAL_DAYS = 14

PLAN_DEFINITIONS = [
    {
        "code": "free",
        "name": "Gratis",
        "price_cents": 0,
        "tagline": "Scheda mappa.",
        "features": [
            "Scheda locale sulla mappa",
            "Nome, città, indirizzo e orari",
            "1 foto del locale",
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
        "tagline": "Semaforo clienti + QR + PDF.",
        "trial_days": TRIAL_DAYS,
        "features": [
            "14 giorni di prova gratuita",
            "Semaforo personalizzato per ogni cliente con allergie",
            "QR code al tavolo e al banco",
            "Registro allergeni PDF stampabile",
            "Menù digitale con allergeni per piatto",
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
        "name": "Pro",
        "price_cents": 1900,          # €19,00/mese
        "tagline": "Come Base + Push, AI e statistiche.",
        "trial_days": TRIAL_DAYS,
        "features": [
            "Tutto del piano Base",
            "Notifiche push ai clienti che ti preferiscono",
            "Analisi AI menù illimitate",
            "Statistiche su scansioni e allergeni cercati",
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
        "name": "Gratis",
        "price_cents": 0,
        "tagline": "Scan + semaforo + 1 profilo.",
        "features": [
            "Scansione QR ristorante",
            "Semaforo personalizzato",
            "1 profilo allergie",
        ],
        "sub_profile_limit": 0,
        "barcode_scan_limit_month": 20,
        "medical_ai_limit_month": 0,
        "product_label_ai_limit_month": 0,
        "shared_profile_permanent": False,
    },
    {
        "code": "customer_plus",
        "name": "Plus Famiglia",
        "price_cents": 399,           # €3,99/mese · opzionale
        "tagline": "Famiglia, spesa e profili condivisi.",
        "features": [
            "Sottoprofili famiglia illimitati",
            "Condivisione profilo 24h o permanente",
            "Scanner spesa illimitato",
            "Analisi AI etichette (30/mese) quando il prodotto non è in database",
            "5 analisi AI documenti medici/mese",
        ],
        "sub_profile_limit": None,
        "barcode_scan_limit_month": None,
        "medical_ai_limit_month": 5,
        "product_label_ai_limit_month": 30,
        "shared_profile_permanent": True,
    },
]

BOOST_VISIBILITY = {
    "code": "visibility_boost",
    "name": "Boost Visibilità",
    "price_cents": 990,              # €9,90 pagamento singolo
    "duration_days": 30,
    "tagline": "Visibilità 30 giorni.",
    "description": (
        "Pagamento unico senza abbonamento. Il locale compare in cima ai risultati "
        "di ricerca e nella lista locali vicini per 30 giorni."
    ),
}

PLAN_PRICES = {p["code"]: int(p["price_cents"]) for p in PLAN_DEFINITIONS}
PAID_PLANS = {"base", "pro_notify"}
NOTIFY_PLANS = {"pro_notify"}
CUSTOMER_PLAN_PRICES = {p["code"]: int(p["price_cents"]) for p in CUSTOMER_PLAN_DEFINITIONS}

# Alias legacy (DB esistenti): verified→base, pro/premium→pro_notify
LEGACY_PLAN_ALIASES: dict[str, str] = {
    "verified": "base",
    "pro": "pro_notify",
    "premium": "pro_notify",
}

MENU_PLANS = {"free", "base", "pro_notify", *LEGACY_PLAN_ALIASES}
MENU_ACCESS_STATUSES = {"trialing", "active", "comped"}
REPLY_PLANS = {"base", "pro_notify", "verified", "pro", "premium"}

PLAN_PHOTO_LIMITS: dict[str, int] = {
    "free": 1,
    "base": 10,
    "pro_notify": 20,
    # legacy
    "verified": 3,
    "pro": 8,
    "premium": 20,
}


def normalize_plan(code: str | None) -> str:
    """Mappa codici piano legacy ai codici canonici."""
    if not code:
        return "free"
    return LEGACY_PLAN_ALIASES.get(code, code)


def restaurant_has_menu_access(business_plan: str | None, subscription_status: str | None) -> bool:
    plan = normalize_plan(business_plan)
    status = subscription_status or "free"
    return status == "comped" or (plan in PAID_PLANS and status in MENU_ACCESS_STATUSES)


def restaurant_can_reply_to_reviews(business_plan: str | None, subscription_status: str | None) -> bool:
    plan = business_plan or "free"
    status = subscription_status or "free"
    return plan in REPLY_PLANS and status in MENU_ACCESS_STATUSES
