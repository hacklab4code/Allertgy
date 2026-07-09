"""Enforcement dei limiti definiti in plans.py (barcode, AI menù, analytics)."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import CustomerUsage, Restaurant, User
from ..plans import CUSTOMER_PLAN_DEFINITIONS, NOTIFY_PLANS, PLAN_DEFINITIONS
from ..services.referrals import customer_has_plus

CUSTOMER_PLANS_BY_CODE = {p["code"]: p for p in CUSTOMER_PLAN_DEFINITIONS}
OWNER_PLANS_BY_CODE = {p["code"]: p for p in PLAN_DEFINITIONS}

MENU_ACCESS_STATUSES = {"trialing", "active", "comped"}


def _month_start() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def count_monthly_usage(db: Session, user_id: int, usage_type: str) -> int:
    return int(
        db.scalar(
            select(func.count())
            .select_from(CustomerUsage)
            .where(
                CustomerUsage.user_id == user_id,
                CustomerUsage.usage_type == usage_type,
                CustomerUsage.created_at >= _month_start(),
            )
        )
        or 0
    )


def record_usage(db: Session, user_id: int, usage_type: str) -> None:
    db.add(CustomerUsage(user_id=user_id, usage_type=usage_type))
    db.flush()


def customer_barcode_limit(user: User) -> int | None:
    plan = CUSTOMER_PLANS_BY_CODE.get(user.customer_plan or "customer_free", {})
    return plan.get("barcode_scan_limit_month")


def ensure_barcode_scan_allowed(user: User, db: Session) -> int | None:
    """Registra una scansione barcode se consentita. Ritorna scans rimanenti o None se illimitato."""
    limit = customer_barcode_limit(user)
    if limit is None:
        record_usage(db, user.id, "barcode_scan")
        return None
    used = count_monthly_usage(db, user.id, "barcode_scan")
    if used >= limit:
        raise HTTPException(
            403,
            f"Hai raggiunto il limite di {limit} scansioni barcode questo mese. "
            "Passa a Plus Famiglia per scansioni illimitate.",
        )
    record_usage(db, user.id, "barcode_scan")
    return max(0, limit - used - 1)


def owner_ai_menu_limit(restaurant: Restaurant) -> int | None:
    plan = OWNER_PLANS_BY_CODE.get(restaurant.business_plan or "free", {})
    return plan.get("ai_menu_scans_per_month")


def ensure_owner_ai_menu_scan_allowed(user: User, db: Session) -> None:
    """Limite analisi AI menù per ristoratore (5/mese Base, illimitato Pro)."""
    restaurants = db.scalars(
        select(Restaurant).where(
            Restaurant.owner_user_id == user.id,
            Restaurant.subscription_status.in_(MENU_ACCESS_STATUSES),
        )
    ).all()
    if not restaurants:
        raise HTTPException(403, "Attiva un piano per usare l'analisi AI del menù.")
    if any(owner_ai_menu_limit(r) is None for r in restaurants):
        record_usage(db, user.id, "ai_menu_scan")
        return
    limit = min((owner_ai_menu_limit(r) or 5) for r in restaurants)
    used = count_monthly_usage(db, user.id, "ai_menu_scan")
    if used >= limit:
        raise HTTPException(
            403,
            f"Hai raggiunto il limite di {limit} analisi AI menù questo mese. "
            "Passa al piano Pro per analisi illimitate.",
        )
    record_usage(db, user.id, "ai_menu_scan")


def ensure_ai_menu_scan_allowed(user: User, restaurant: Restaurant, db: Session) -> None:
    status = restaurant.subscription_status or "free"
    if status not in MENU_ACCESS_STATUSES:
        raise HTTPException(403, "Attiva un piano per usare l'analisi AI del menù.")
    limit = owner_ai_menu_limit(restaurant)
    if limit is None:
        record_usage(db, user.id, "ai_menu_scan")
        return
    used = count_monthly_usage(db, user.id, "ai_menu_scan")
    if used >= limit:
        raise HTTPException(
            403,
            f"Hai raggiunto il limite di {limit} analisi AI menù questo mese. "
            "Passa al piano Pro per analisi illimitate.",
        )
    record_usage(db, user.id, "ai_menu_scan")


def ensure_analytics_access(restaurant: Restaurant) -> None:
    plan = restaurant.business_plan or "free"
    status = restaurant.subscription_status or "free"
    if plan not in NOTIFY_PLANS or status not in MENU_ACCESS_STATUSES:
        raise HTTPException(
            403,
            "Le statistiche avanzate sono disponibili solo con il piano Pro (€19/mese).",
        )


def remaining_barcode_scans(user: User, db: Session) -> int | None:
    limit = customer_barcode_limit(user)
    if limit is None:
        return None
    used = count_monthly_usage(db, user.id, "barcode_scan")
    return max(0, limit - used)
