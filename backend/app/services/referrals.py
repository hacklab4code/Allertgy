"""Programma invita-un-commerciante: il cliente che porta un locale ottiene Plus omaggio
e il commerciante invitato riceve 1 mese di piano Pro."""
from __future__ import annotations

import secrets
import string
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import MerchantReferral, Restaurant, User
from ..plans import PLAN_PRICES
from ..services.push import notify_users

INVITE_CODE_LEN = 8
CUSTOMER_PLUS_PLAN = "customer_plus"
OWNER_PRO_PLAN = "pro_notify"
REFERRAL_OWNER_PRO_DAYS = 30
ACTIVE_CUSTOMER_STATUSES = {"active", "comped", "trialing"}
ACTIVE_OWNER_STATUSES = {"trialing", "active", "comped"}


def _code_alphabet() -> str:
    return string.ascii_uppercase + string.digits


def generate_invite_code(db: Session) -> str:
    """Genera un codice invito univoco per un cliente."""
    alphabet = _code_alphabet()
    for _ in range(40):
        code = "".join(secrets.choice(alphabet) for _ in range(INVITE_CODE_LEN))
        exists = db.scalar(select(User.id).where(User.invite_code == code))
        if not exists:
            return code
    raise RuntimeError("Impossibile generare un codice invito univoco")


def ensure_customer_invite_code(user: User, db: Session) -> str:
    if user.invite_code:
        return user.invite_code
    user.invite_code = generate_invite_code(db)
    db.flush()
    return user.invite_code


def normalize_invite_code(code: str | None) -> str | None:
    if not code:
        return None
    normalized = code.strip().upper().replace("-", "").replace(" ", "")
    return normalized or None


def resolve_referrer(invite_code: str | None, db: Session) -> User | None:
    normalized = normalize_invite_code(invite_code)
    if not normalized:
        return None
    return db.scalar(
        select(User).where(
            User.invite_code == normalized,
            User.role == "customer",
        )
    )


def customer_has_plus(user: User) -> bool:
    return (
        (user.customer_plan or "customer_free") == CUSTOMER_PLUS_PLAN
        and (user.customer_subscription_status or "free") in ACTIVE_CUSTOMER_STATUSES
    )


def grant_customer_plus_comped(user: User, db: Session) -> bool:
    """Assegna Plus Famiglia omaggio. Ritorna True se è stato appena attivato."""
    if customer_has_plus(user):
        return False
    now = datetime.now(timezone.utc)
    user.customer_plan = CUSTOMER_PLUS_PLAN
    user.customer_subscription_status = "comped"
    if not user.customer_plan_started_at:
        user.customer_plan_started_at = now
    db.flush()
    return True


def owner_already_referred(owner_user_id: int, db: Session) -> bool:
    return bool(
        db.scalar(
            select(func.count())
            .select_from(MerchantReferral)
            .where(MerchantReferral.referred_owner_user_id == owner_user_id)
        )
    )


def grant_referred_restaurant_pro_month(restaurant: Restaurant, db: Session) -> bool:
    """Assegna 1 mese di piano Pro al locale portato con codice invito."""
    status = restaurant.subscription_status or "free"
    plan = restaurant.business_plan or "free"
    if plan != "free" and status in ACTIVE_OWNER_STATUSES:
        return False

    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=REFERRAL_OWNER_PRO_DAYS)
    restaurant.business_plan = OWNER_PRO_PLAN
    restaurant.subscription_status = "comped"
    restaurant.plan_price_cents = PLAN_PRICES.get(OWNER_PRO_PLAN, 0)
    restaurant.is_verified = 1
    restaurant.plan_started_at = now
    restaurant.trial_ends_at = expires
    note = (
        f"Omaggio referral: piano Pro {REFERRAL_OWNER_PRO_DAYS} giorni "
        f"(scadenza {expires.strftime('%d/%m/%Y')})."
    )
    if restaurant.commercial_notes:
        restaurant.commercial_notes = f"{restaurant.commercial_notes}\n{note}"
    else:
        restaurant.commercial_notes = note
    db.flush()
    return True


def process_merchant_referral(
    *,
    referrer: User,
    owner: User,
    restaurant: Restaurant,
    db: Session,
) -> dict[str, bool]:
    """Registra il referral e premia cliente + commerciante."""
    if owner_already_referred(owner.id, db):
        return {"customer_rewarded": False, "owner_rewarded": False}

    now = datetime.now(timezone.utc)
    db.add(
        MerchantReferral(
            referrer_user_id=referrer.id,
            referred_owner_user_id=owner.id,
            restaurant_id=restaurant.id,
            reward_granted_at=now,
        )
    )
    restaurant.referred_by_user_id = referrer.id

    customer_rewarded = grant_customer_plus_comped(referrer, db)
    owner_rewarded = grant_referred_restaurant_pro_month(restaurant, db)

    if customer_rewarded:
        notify_users(
            db,
            [referrer.id],
            "referral_reward",
            "Plus Famiglia omaggio!",
            f"Hai portato {restaurant.name} su AllerTgy: il piano Plus Famiglia è attivo gratis per te.",
            {
                "restaurant_id": restaurant.id,
                "restaurant_name": restaurant.name,
                "customer_plan": CUSTOMER_PLUS_PLAN,
            },
        )

    if owner_rewarded:
        notify_users(
            db,
            [owner.id],
            "referral_welcome_pro",
            "Pro omaggio 30 giorni!",
            (
                f"Benvenuto su AllerTgy! Con il codice invito di un cliente, "
                f"{restaurant.name} ha il piano Pro gratis per {REFERRAL_OWNER_PRO_DAYS} giorni."
            ),
            {
                "restaurant_id": restaurant.id,
                "restaurant_name": restaurant.name,
                "business_plan": OWNER_PRO_PLAN,
                "trial_ends_at": restaurant.trial_ends_at.isoformat() if restaurant.trial_ends_at else None,
            },
        )

    return {"customer_rewarded": customer_rewarded, "owner_rewarded": owner_rewarded}


def referral_stats(user: User, db: Session) -> dict:
    count = db.scalar(
        select(func.count())
        .select_from(MerchantReferral)
        .where(MerchantReferral.referrer_user_id == user.id)
    ) or 0
    return {
        "invite_code": ensure_customer_invite_code(user, db) if user.role == "customer" else None,
        "referrals_count": int(count),
        "customer_plan": user.customer_plan or "customer_free",
        "customer_subscription_status": user.customer_subscription_status or "free",
        "has_plus": customer_has_plus(user),
    }
