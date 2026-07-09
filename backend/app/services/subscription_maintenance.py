"""Scadenza trial/comped e manutenzione periodica abbonamenti."""
from __future__ import annotations

import threading
from datetime import datetime, timezone

from sqlalchemy import select

from ..database import SessionLocal
from ..models import Restaurant

_MAINTENANCE_INTERVAL_SEC = 3600  # ogni ora


def expire_trials_and_comped(db) -> int:
    """Declassa locali con trial/comped scaduti e senza abbonamento Stripe attivo."""
    now = datetime.now(timezone.utc)
    expired = db.scalars(
        select(Restaurant).where(
            Restaurant.subscription_status.in_(("trialing", "comped")),
            Restaurant.trial_ends_at.is_not(None),
            Restaurant.trial_ends_at < now,
            Restaurant.stripe_subscription_id.is_(None),
        )
    ).all()
    count = 0
    for r in expired:
        r.business_plan = "free"
        r.subscription_status = "free"
        r.plan_price_cents = 0
        r.is_verified = 0
        r.trial_ends_at = None
        count += 1
    if count:
        db.commit()
    return count


def run_maintenance_once() -> None:
    db = SessionLocal()
    try:
        n = expire_trials_and_comped(db)
        if n:
            print(f"🔁 Subscription maintenance: {n} locale/i declassati a Free")
    finally:
        db.close()


def _maintenance_loop() -> None:
    while True:
        try:
            run_maintenance_once()
        except Exception as e:
            print(f"❌ Subscription maintenance error: {e}")
        threading.Event().wait(_MAINTENANCE_INTERVAL_SEC)


def start_subscription_maintenance() -> None:
    threading.Thread(target=_maintenance_loop, daemon=True, name="subscription-maintenance").start()
