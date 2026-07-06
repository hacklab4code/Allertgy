"""Slug leggibili per le pagine pubbliche ristorante (/r/{slug})."""
from __future__ import annotations

import re
import unicodedata

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Restaurant


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    value = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return value[:140]


def ensure_slug(db: Session, restaurant: Restaurant) -> None:
    """Genera lo slug da nome+città; fallback col codice pubblico se duplicato."""
    base = slugify(f"{restaurant.name} {restaurant.city or ''}".strip())
    if not base:
        base = f"locale-{restaurant.public_code}"
    slug = base
    taken = db.scalar(
        select(Restaurant).where(
            Restaurant.slug == slug, Restaurant.id != restaurant.id
        )
    )
    if taken:
        slug = f"{base}-{restaurant.public_code}"
    restaurant.slug = slug
