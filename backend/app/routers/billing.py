"""Abbonamenti reali via Stripe Billing: Checkout, Customer Portal, webhook.

Se STRIPE_SECRET_KEY non è configurata gli endpoint rispondono 503 con un
messaggio chiaro: il resto dell'app continua a funzionare (i piani possono
essere gestiti a mano dall'admin interno come oggi).

Configurazione Stripe attesa (dashboard.stripe.com):
- 3 Price ricorrenti mensili → STRIPE_PRICE_VERIFIED / _PRO / _PREMIUM
- un webhook endpoint → POST {PUBLIC_API_URL}/billing/webhook con eventi:
  checkout.session.completed, customer.subscription.updated,
  customer.subscription.deleted, invoice.paid, invoice.payment_failed
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import Invoice, Restaurant, User
from ..plans import PLAN_DEFINITIONS, PLAN_PRICES, TRIAL_DAYS
from ..schemas import (
    CheckoutSessionIn,
    CheckoutSessionOut,
    InvoiceOut,
    PlanDefinitionOut,
    PortalSessionIn,
    PortalSessionOut,
    RestaurantOut,
    StartTrialIn,
)
from ..security import require_owner
from ..services.emailer import send_payment_confirmation, send_payment_failed

router = APIRouter(prefix="/billing", tags=["billing"])

PLAN_PRICE_CENTS = {k: v for k, v in PLAN_PRICES.items() if k != "free"}
PLAN_NAMES = {p["code"]: p["name"] for p in PLAN_DEFINITIONS}


@router.get("/plans", response_model=list[PlanDefinitionOut])
def list_plans():
    """Elenco pubblico dei piani con specifiche: usato da app e sito."""
    return [PlanDefinitionOut(**p) for p in PLAN_DEFINITIONS]


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
        "verified": settings.stripe_price_verified,
        "pro": settings.stripe_price_pro,
        "premium": settings.stripe_price_premium,
    }.get(plan, "")
    if not price_id:
        raise HTTPException(503, f"Prezzo Stripe non configurato per il piano '{plan}'")
    return price_id


def _plan_for_price_id(price_id: str) -> str | None:
    mapping = {
        settings.stripe_price_verified: "verified",
        settings.stripe_price_pro: "pro",
        settings.stripe_price_premium: "premium",
    }
    return mapping.get(price_id)


def _my_restaurant(rid: int, user: User, db: Session) -> Restaurant:
    r = db.get(Restaurant, rid)
    if not r or r.owner_user_id != user.id:
        raise HTTPException(404, "Ristorante non trovato")
    return r


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


@router.post("/checkout-session", response_model=CheckoutSessionOut)
def create_checkout_session(
    data: CheckoutSessionIn,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    stripe = _stripe()
    r = _my_restaurant(data.restaurant_id, user, db)
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

    elif event["type"] == "checkout.session.completed":
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

    return {"received": True}
