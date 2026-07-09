"""Boost visibilità: helper condivisi per API e ordinamento locali."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import VisibilityBoost


def restaurant_has_active_boost(db: Session, restaurant_id: int) -> bool:
    now = datetime.now(timezone.utc)
    found = db.scalar(
        select(VisibilityBoost.id).where(
            VisibilityBoost.restaurant_id == restaurant_id,
            VisibilityBoost.stripe_payment_intent_id.isnot(None),
            VisibilityBoost.expires_at.isnot(None),
            VisibilityBoost.expires_at > now,
        ).limit(1)
    )
    return found is not None


def active_boost_expires_map(db: Session, restaurant_ids: list[int] | None = None) -> dict[int, datetime]:
    """Mappa restaurant_id → expires_at per i boost attivi."""
    now = datetime.now(timezone.utc)
    stmt = select(VisibilityBoost.restaurant_id, VisibilityBoost.expires_at).where(
        VisibilityBoost.stripe_payment_intent_id.isnot(None),
        VisibilityBoost.expires_at.isnot(None),
        VisibilityBoost.expires_at > now,
    )
    if restaurant_ids:
        stmt = stmt.where(VisibilityBoost.restaurant_id.in_(restaurant_ids))
    rows = db.execute(stmt).all()
    result: dict[int, datetime] = {}
    for rid, expires_at in rows:
        if rid not in result or (expires_at and expires_at > result[rid]):
            result[rid] = expires_at
    return result
