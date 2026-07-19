"""Abbonamenti reali via Stripe Billing + add-on Boost Visibilità + notifiche push.

Se STRIPE_SECRET_KEY non è configurata gli endpoint rispondono 503 con un
messaggio chiaro: il resto dell'app continua a funzionare (i piani possono
essere gestiti a mano dall'admin interno come oggi).

Configurazione Stripe attesa (dashboard.stripe.com):
- 2 Price ricorrenti mensili → STRIPE_PRICE_BASE / _PRO_NOTIFY
- 1 Price one-time           → STRIPE_PRICE_BOOST  (€9,90 / 30 gg)
- un webhook endpoint → POST {PUBLIC_API_URL}/billing/webhook con eventi:
  checkout.session.completed, customer.subscription.updated,
  customer.subscription.deleted, invoice.paid, invoice.payment_failed,
  payment_intent.succeeded
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import DeviceToken, Invoice, Restaurant, User, UserFavorite, VisibilityBoost
from ..plans import (
    BOOST_VISIBILITY,
    CUSTOMER_PLAN_DEFINITIONS,
    NOTIFY_PLANS,
    PLAN_DEFINITIONS,
    PLAN_PRICES,
    TRIAL_DAYS,
)
from ..schemas import (
    BoostSessionOut,
    CheckoutSessionIn,
    CheckoutSessionOut,
    CustomerCheckoutOut,
    CustomerPortalOut,
    InvoiceOut,
    PlanDefinitionOut,
    PortalSessionIn,
    PortalSessionOut,
    RestaurantOut,
    SendNotificationIn,
    SendNotificationOut,
    StartBoostIn,
    StartTrialIn,
    VisibilityBoostOut,
)
from ..security import require_owner, get_current_user
from ..services.push import notify_users
from ..services.emailer import send_payment_confirmation, send_payment_failed

router = APIRouter(prefix="/billing", tags=["billing"])

PLAN_PRICE_CENTS = {k: v for k, v in PLAN_PRICES.items() if k != "free"}
PLAN_NAMES = {p["code"]: p["name"] for p in PLAN_DEFINITIONS}

_STRIPE_UNAVAILABLE = (
    "Pagamenti non ancora attivi: configura STRIPE_SECRET_KEY nel backend."
)


def _stripe_dev_mock_allowed() -> bool:
    """Mock locale senza Stripe: solo in sviluppo, mai in produzione."""
    return not settings.is_production and not settings.stripe_configured


# ──────────────────────────────────────────────────────────────────────────────
# Endpoint pubblico – piani disponibili
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/plans", response_model=list[PlanDefinitionOut])
def list_plans():
    """Elenco pubblico dei piani con specifiche: usato da app e sito."""
    return [PlanDefinitionOut(**p) for p in PLAN_DEFINITIONS]


@router.get("/customer-plans")
def list_customer_plans():
    """Piani cliente freemium: scan/semaforo restano gratuiti, Plus sblocca famiglia e condivisione."""
    return CUSTOMER_PLAN_DEFINITIONS


@router.post("/customer-checkout", response_model=CustomerCheckoutOut)
def create_customer_checkout(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Checkout Stripe per Plus Famiglia (€3,99/mese)."""
    if user.role != "customer":
        raise HTTPException(403, "Solo i clienti possono acquistare Plus Famiglia")
    if user.has_customer_plus and user.customer_subscription_status in {"active", "trialing"}:
        raise HTTPException(400, "Hai già Plus Famiglia attivo")

    if not settings.stripe_configured:
        if settings.is_production:
            raise HTTPException(503, _STRIPE_UNAVAILABLE)
        if not _stripe_dev_mock_allowed():
            raise HTTPException(503, _STRIPE_UNAVAILABLE)
        now = datetime.now(timezone.utc)
        user.customer_plan = "customer_plus"
        user.customer_subscription_status = "active"
        user.customer_plan_started_at = now
        db.commit()
        return CustomerCheckoutOut(
            checkout_url=f"{settings.public_web_url}/dashboard?customer_billing=success"
        )

    stripe = _stripe()
    if not settings.stripe_price_customer_plus:
        raise HTTPException(503, "Prezzo Stripe Plus Famiglia non configurato (STRIPE_PRICE_CUSTOMER_PLUS)")

    if not user.customer_stripe_customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            name=user.display_name or user.email,
            metadata={"user_id": str(user.id), "type": "customer_plus"},
        )
        user.customer_stripe_customer_id = customer.id
        db.commit()

    session = stripe.checkout.Session.create(
        customer=user.customer_stripe_customer_id,
        mode="subscription",
        line_items=[{"price": settings.stripe_price_customer_plus, "quantity": 1}],
        success_url=f"{settings.public_web_url}/?customer_billing=success",
        cancel_url=f"{settings.public_web_url}/?customer_billing=cancel",
        metadata={"user_id": str(user.id), "type": "customer_plus"},
        subscription_data={"metadata": {"user_id": str(user.id), "type": "customer_plus"}},
    )
    return CustomerCheckoutOut(checkout_url=session.url)


@router.post("/customer-portal", response_model=CustomerPortalOut)
def create_customer_portal(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Portale Stripe per gestire abbonamento Plus Famiglia."""
    if user.role != "customer":
        raise HTTPException(403, "Solo i clienti possono gestire Plus Famiglia")
    stripe = _stripe()
    if not user.customer_stripe_customer_id:
        raise HTTPException(400, "Nessun abbonamento Plus attivo")
    session = stripe.billing_portal.Session.create(
        customer=user.customer_stripe_customer_id,
        return_url=f"{settings.public_web_url}/",
    )
    return CustomerPortalOut(portal_url=session.url)


# ──────────────────────────────────────────────────────────────────────────────
# Helpers Stripe
# ──────────────────────────────────────────────────────────────────────────────
def _stripe():
    if not settings.stripe_configured:
        raise HTTPException(
            503,
            "Pagamenti non ancora attivi: configura STRIPE_SECRET_KEY nel backend.",
        )
    try:
        import stripe
    except ImportError:
        raise HTTPException(503, "Modulo 'stripe' non installato nel backend")
    stripe.api_key = settings.stripe_secret_key
    return stripe


def _price_id_for_plan(plan: str) -> str:
    price_id = {
        "base": settings.stripe_price_base,
        "pro_notify": settings.stripe_price_pro_notify,
    }.get(plan, "")
    if not price_id:
        raise HTTPException(503, f"Prezzo Stripe non configurato per il piano '{plan}'")
    return price_id


def _plan_for_price_id(price_id: str) -> str | None:
    mapping = {
        settings.stripe_price_base: "base",
        settings.stripe_price_pro_notify: "pro_notify",
    }
    return mapping.get(price_id)


def _customer_plan_for_price_id(price_id: str) -> str | None:
    if price_id and price_id == settings.stripe_price_customer_plus:
        return "customer_plus"
    return None


def _user_by_customer(customer_id: str, db: Session) -> User | None:
    return db.scalar(
        select(User).where(User.customer_stripe_customer_id == customer_id)
    )


def _my_restaurant(rid: int, user: User, db: Session) -> Restaurant:
    r = db.get(Restaurant, rid)
    if not r or r.owner_user_id != user.id:
        raise HTTPException(404, "Ristorante non trovato")
    return r


# ──────────────────────────────────────────────────────────────────────────────
# Trial gratuito 14 giorni
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/start-trial", response_model=RestaurantOut)
def start_trial(
    data: StartTrialIn,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Avvia la prova gratuita di 14 giorni senza pagamento.

    Non richiede Stripe: sblocca subito le funzioni del piano scelto. Alla
    scadenza il locale resta in prova finché non attiva un abbonamento reale
    (il declassamento automatico avviene solo tramite Stripe/dunning).
    """
    r = _my_restaurant(data.restaurant_id, user, db)
    # Se Stripe non è configurato o è in modalità test, allentiamo il controllo per facilitare i test dei piani
    is_test_mode = not settings.stripe_configured or "test" in (settings.stripe_secret_key or "").lower()
    if not is_test_mode:
        if (r.subscription_status or "free") in {"trialing", "active", "comped"}:
            raise HTTPException(400, "Questo locale ha già un piano attivo o una prova in corso.")
        if r.plan_started_at:
            raise HTTPException(400, "La prova gratuita è già stata utilizzata per questo locale.")

    now = datetime.now(timezone.utc)
    r.business_plan = data.plan
    r.subscription_status = "trialing"
    r.plan_price_cents = PLAN_PRICES.get(data.plan, 0)
    r.is_verified = 1
    r.plan_started_at = now
    r.trial_ends_at = now + timedelta(days=TRIAL_DAYS)
    db.commit()
    db.refresh(r)
    return r


# ──────────────────────────────────────────────────────────────────────────────
# Checkout abbonamento mensile
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/checkout-session", response_model=CheckoutSessionOut)
def create_checkout_session(
    data: CheckoutSessionIn,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    r = _my_restaurant(data.restaurant_id, user, db)
    status = r.subscription_status or "free"
    if status == "comped":
        raise HTTPException(400, "Questo locale ha un piano omaggio attivo.")
    if status == "active" and r.stripe_subscription_id:
        raise HTTPException(
            400,
            "Questo locale ha già un abbonamento attivo. "
            "Usa il portale clienti per modificare il piano.",
        )
    if not settings.stripe_configured:
        if settings.is_production:
            raise HTTPException(503, _STRIPE_UNAVAILABLE)
        if not _stripe_dev_mock_allowed():
            raise HTTPException(503, _STRIPE_UNAVAILABLE)
        r.business_plan = data.plan
        r.subscription_status = "active"
        r.plan_price_cents = PLAN_PRICES.get(data.plan, 0)
        r.plan_started_at = datetime.now(timezone.utc)
        db.commit()
        return CheckoutSessionOut(checkout_url=f"{settings.public_web_url}/dashboard?billing=success")

    stripe = _stripe()
    price_id = _price_id_for_plan(data.plan)

    if not r.stripe_customer_id:
        customer = stripe.Customer.create(
            email=r.billing_email or user.email,
            name=r.name,
            metadata={"restaurant_id": str(r.id)},
        )
        r.stripe_customer_id = customer.id
        db.commit()

    session = stripe.checkout.Session.create(
        customer=r.stripe_customer_id,
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{settings.public_web_url}/dashboard?billing=success",
        cancel_url=f"{settings.public_web_url}/dashboard?billing=cancel",
        metadata={"restaurant_id": str(r.id), "plan": data.plan},
        subscription_data={"metadata": {"restaurant_id": str(r.id), "plan": data.plan}},
        automatic_tax={"enabled": True},
        tax_id_collection={"enabled": True},
    )
    return CheckoutSessionOut(checkout_url=session.url)


# ──────────────────────────────────────────────────────────────────────────────
# Boost Visibilità – pagamento one-time
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/boost", response_model=BoostSessionOut)
def create_boost_session(
    data: StartBoostIn,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Crea un checkout Stripe one-time per il Boost Visibilità (€9,90 / 30 giorni).

    Disponibile per tutti i piani (anche Free). Il boost è attivato
    automaticamente al webhook payment_intent.succeeded.
    """
    r = _my_restaurant(data.restaurant_id, user, db)
    if not settings.stripe_configured:
        if settings.is_production:
            raise HTTPException(503, _STRIPE_UNAVAILABLE)
        if not _stripe_dev_mock_allowed():
            raise HTTPException(503, _STRIPE_UNAVAILABLE)
        from ..models import VisibilityBoost
        now = datetime.now(timezone.utc)
        db.add(VisibilityBoost(
            restaurant_id=r.id,
            stripe_payment_intent_id=f"mock_boost_{r.id}_{int(now.timestamp())}",
            amount_cents=990,
            activated_at=now,
            expires_at=now + timedelta(days=30),
        ))
        r.featured_priority = max(r.featured_priority or 0, 10)
        db.commit()
        return BoostSessionOut(
            activated=True,
            message="Boost Visibilità attivato per 30 giorni.",
        )

    stripe = _stripe()

    if not settings.stripe_price_boost:
        raise HTTPException(503, "Prezzo Stripe Boost non configurato (STRIPE_PRICE_BOOST)")

    if not r.stripe_customer_id:
        customer = stripe.Customer.create(
            email=r.billing_email or user.email,
            name=r.name,
            metadata={"restaurant_id": str(r.id)},
        )
        r.stripe_customer_id = customer.id
        db.commit()

    session = stripe.checkout.Session.create(
        customer=r.stripe_customer_id,
        mode="payment",
        line_items=[{"price": settings.stripe_price_boost, "quantity": 1}],
        success_url=f"{settings.public_web_url}/dashboard?boost=success",
        cancel_url=f"{settings.public_web_url}/dashboard?boost=cancel",
        metadata={
            "restaurant_id": str(r.id),
            "type": "visibility_boost",
        },
        payment_intent_data={
            "metadata": {
                "restaurant_id": str(r.id),
                "type": "visibility_boost",
            }
        },
    )
    return BoostSessionOut(checkout_url=session.url)

@router.get("/boosts/{restaurant_id}", response_model=list[VisibilityBoostOut])
def list_boosts(
    restaurant_id: int,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Lista dei boost acquistati per un ristorante (attivi e scaduti)."""
    r = _my_restaurant(restaurant_id, user, db)
    return db.scalars(
        select(VisibilityBoost)
        .where(VisibilityBoost.restaurant_id == r.id)
        .order_by(VisibilityBoost.created_at.desc())
    ).all()


# ──────────────────────────────────────────────────────────────────────────────
# Notifiche push ai preferiti (solo piano Pro Notifiche)
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/send-notification", response_model=SendNotificationOut)
def send_push_notification(
    data: SendNotificationIn,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Invia una notifica push agli utenti che hanno aggiunto il locale ai preferiti.

    Disponibile solo per il piano Pro Notifiche (business_plan = 'pro_notify').
    Usa le Expo Push Notifications API.
    """
    r = _my_restaurant(data.restaurant_id, user, db)

    # Verifica piano
    if r.business_plan not in NOTIFY_PLANS or r.subscription_status not in {"trialing", "active", "comped"}:
        raise HTTPException(
            403,
            "Il piano Pro è richiesto per inviare notifiche push. "
            "Passa al piano Pro (€19/mese)."
        )

    # Recupera tutti i device token degli utenti che hanno messo il locale nei preferiti
    favorite_user_ids = db.scalars(
        select(UserFavorite.user_id).where(UserFavorite.restaurant_id == r.id)
    ).all()

    if not favorite_user_ids:
        return SendNotificationOut(sent_count=0, message="Nessun utente ha salvato questo locale nei preferiti.")

    # Invia via notify_users (salva a DB e invia push in thread separato)
    payload = {
        "restaurant_id": r.id,
        "restaurant_name": r.name,
        "public_code": r.public_code,
        "title": data.title,
        "body": data.body,
    }
    notify_users(
        db=db,
        user_ids=list(favorite_user_ids),
        notif_type="promo",
        title=data.title,
        body=data.body,
        payload=payload,
    )
    db.commit()

    # Conta quanti dispositivi hanno un token registrato tra i follower
    device_count = db.scalar(
        select(func.count(DeviceToken.expo_token)).where(DeviceToken.user_id.in_(favorite_user_ids))
    ) or 0

    return SendNotificationOut(
        sent_count=device_count,
        message=f"Notifica salvata a DB e inviata a {device_count} dispositivi.",
    )


@router.get("/followers-count/{restaurant_id}")
def get_followers_count(
    restaurant_id: int,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Ritorna il numero di clienti fedeli (che hanno messo il locale tra i preferiti)."""
    r = _my_restaurant(restaurant_id, user, db)
    from sqlalchemy import func
    count = db.scalar(
        select(func.count(UserFavorite.user_id)).where(UserFavorite.restaurant_id == r.id)
    )
    return {"count": count or 0}


def _send_expo_push(tokens: list[str], title: str, body: str, restaurant_name: str) -> int:
    """Invia notifiche push tramite Expo Push API."""
    import urllib.request
    import json

    messages = [
        {
            "to": token,
            "sound": "default",
            "title": title,
            "body": body,
            "data": {"restaurant_name": restaurant_name},
        }
        for token in tokens
        if token.startswith("ExponentPushToken[") or token.startswith("ExpoPushToken[")
    ]

    if not messages:
        return 0

    try:
        payload = json.dumps(messages).encode()
        req = urllib.request.Request(
            "https://exp.host/--/api/v2/push/send",
            data=payload,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
        )
        urllib.request.urlopen(req, timeout=10)
        return len(messages)
    except Exception:
        return 0


# ──────────────────────────────────────────────────────────────────────────────
# Customer Portal (gestione abbonamento, disdetta)
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/portal-session", response_model=PortalSessionOut)
def create_portal_session(
    data: PortalSessionIn,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Stripe Customer Portal: upgrade/downgrade, disdetta, metodo di pagamento."""
    stripe = _stripe()
    r = _my_restaurant(data.restaurant_id, user, db)
    if not r.stripe_customer_id:
        raise HTTPException(400, "Nessun abbonamento attivo per questo locale")
    session = stripe.billing_portal.Session.create(
        customer=r.stripe_customer_id,
        return_url=f"{settings.public_web_url}/dashboard",
    )
    return PortalSessionOut(portal_url=session.url)


# ──────────────────────────────────────────────────────────────────────────────
# Fatture
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/invoices/{restaurant_id}", response_model=list[InvoiceOut])
def list_invoices(
    restaurant_id: int,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    r = _my_restaurant(restaurant_id, user, db)
    return db.scalars(
        select(Invoice)
        .where(Invoice.restaurant_id == r.id)
        .order_by(Invoice.created_at.desc())
    ).all()


# ──────────────────────────────────────────────────────────────────────────────
# Helpers webhook
# ──────────────────────────────────────────────────────────────────────────────
def _restaurant_by_customer(customer_id: str, db: Session) -> Restaurant | None:
    return db.scalar(
        select(Restaurant).where(Restaurant.stripe_customer_id == customer_id)
    )


def _apply_subscription_state(r: Restaurant, subscription, db: Session) -> None:
    """Allinea piano e stato del locale allo stato della subscription Stripe."""
    status_map = {
        "trialing": "trialing",
        "active": "active",
        "past_due": "past_due",
        "canceled": "canceled",
        "unpaid": "past_due",
        "incomplete": "past_due",
        "incomplete_expired": "canceled",
        "paused": "canceled",
    }
    price_id = None
    items = subscription.get("items", {}).get("data", [])
    if items:
        price_id = items[0].get("price", {}).get("id")
    plan = _plan_for_price_id(price_id) if price_id else None

    r.stripe_subscription_id = subscription.get("id")
    r.stripe_price_id = price_id
    new_status = status_map.get(subscription.get("status"), "free")
    r.subscription_status = new_status

    if new_status in {"trialing", "active"} and plan:
        r.business_plan = plan
        r.plan_price_cents = PLAN_PRICE_CENTS.get(plan, 0)
        r.is_verified = 1
        if not r.plan_started_at:
            r.plan_started_at = datetime.now(timezone.utc)
    elif new_status == "canceled":
        # Disdetta o fine periodo di grazia (dunning): declassa a Free
        r.business_plan = "free"
        r.subscription_status = "free"
        r.plan_price_cents = 0
        r.is_verified = 0
        r.stripe_subscription_id = None
        r.stripe_price_id = None
    db.commit()


def _apply_customer_subscription_state(user: User, subscription, db: Session) -> None:
    """Allinea piano Plus Famiglia allo stato subscription Stripe."""
    status_map = {
        "trialing": "trialing",
        "active": "active",
        "past_due": "past_due",
        "canceled": "free",
        "unpaid": "past_due",
        "incomplete": "past_due",
        "incomplete_expired": "free",
        "paused": "free",
    }
    price_id = None
    items = subscription.get("items", {}).get("data", [])
    if items:
        price_id = items[0].get("price", {}).get("id")
    plan = _customer_plan_for_price_id(price_id) if price_id else None

    user.customer_stripe_subscription_id = subscription.get("id")
    new_status = status_map.get(subscription.get("status"), "free")
    user.customer_subscription_status = new_status

    if new_status in {"trialing", "active"} and plan:
        user.customer_plan = plan
        if not user.customer_plan_started_at:
            user.customer_plan_started_at = datetime.now(timezone.utc)
    elif new_status in {"free", "canceled"} or subscription.get("status") == "canceled":
        user.customer_plan = "customer_free"
        user.customer_subscription_status = "free"
        user.customer_stripe_subscription_id = None
    db.commit()


# ──────────────────────────────────────────────────────────────────────────────
# Webhook Stripe
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    stripe = _stripe()
    if not settings.stripe_webhook_secret:
        raise HTTPException(503, "STRIPE_WEBHOOK_SECRET non configurato")
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(
            payload, signature, settings.stripe_webhook_secret
        )
    except Exception:
        raise HTTPException(400, "Firma webhook non valida")

    obj = event["data"]["object"]

    if event["type"] in {"customer.subscription.updated", "customer.subscription.deleted"}:
        r = _restaurant_by_customer(obj.get("customer", ""), db)
        if r:
            _apply_subscription_state(r, obj, db)
        else:
            u = _user_by_customer(obj.get("customer", ""), db)
            if u:
                _apply_customer_subscription_state(u, obj, db)

    elif event["type"] == "checkout.session.completed":
        meta = obj.get("metadata", {})
        if meta.get("type") == "customer_plus":
            uid = int(meta.get("user_id", 0))
            u = db.get(User, uid) if uid else _user_by_customer(obj.get("customer", ""), db)
            if u and obj.get("subscription"):
                subscription = stripe.Subscription.retrieve(obj["subscription"])
                _apply_customer_subscription_state(u, subscription, db)
        else:
            r = _restaurant_by_customer(obj.get("customer", ""), db)
            if r and obj.get("subscription"):
                subscription = stripe.Subscription.retrieve(obj["subscription"])
                _apply_subscription_state(r, subscription, db)

    elif event["type"] == "invoice.paid":
        r = _restaurant_by_customer(obj.get("customer", ""), db)
        if r:
            stripe_invoice_id = obj.get("id", "")
            if stripe_invoice_id and not db.scalar(
                select(Invoice).where(Invoice.stripe_invoice_id == stripe_invoice_id)
            ):
                db.add(Invoice(
                    restaurant_id=r.id,
                    stripe_invoice_id=stripe_invoice_id,
                    amount_cents=obj.get("amount_paid", 0),
                    status="paid",
                    pdf_url=obj.get("invoice_pdf"),
                ))
                db.commit()
            email = r.billing_email or r.email_contact
            if email:
                send_payment_confirmation(
                    email,
                    PLAN_NAMES.get(r.business_plan or "", r.business_plan or ""),
                    obj.get("amount_paid", 0),
                    obj.get("invoice_pdf"),
                )

    elif event["type"] == "invoice.payment_failed":
        r = _restaurant_by_customer(obj.get("customer", ""), db)
        if r:
            r.subscription_status = "past_due"
            db.commit()
            email = r.billing_email or r.email_contact
            if email:
                send_payment_failed(
                    email,
                    PLAN_NAMES.get(r.business_plan or "", r.business_plan or ""),
                )

    elif event["type"] == "payment_intent.succeeded":
        # Gestisce il pagamento one-time del Boost Visibilità
        meta = obj.get("metadata", {})
        if meta.get("type") == "visibility_boost":
            restaurant_id = int(meta.get("restaurant_id", 0))
            pi_id = obj.get("id", "")
            if restaurant_id and pi_id:
                existing = db.scalar(
                    select(VisibilityBoost).where(
                        VisibilityBoost.stripe_payment_intent_id == pi_id
                    )
                )
                if not existing:
                    now = datetime.now(timezone.utc)
                    duration = BOOST_VISIBILITY["duration_days"]
                    db.add(VisibilityBoost(
                        restaurant_id=restaurant_id,
                        stripe_payment_intent_id=pi_id,
                        amount_cents=BOOST_VISIBILITY["price_cents"],
                        duration_days=duration,
                        activated_at=now,
                        expires_at=now + timedelta(days=duration),
                    ))
                    # Aggiorna featured_priority del ristorante
                    r = db.get(Restaurant, restaurant_id)
                    if r:
                        r.featured_priority = max(r.featured_priority or 0, 10)
                    db.commit()

    return {"received": True}
