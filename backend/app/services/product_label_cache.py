"""Cache condivisa etichette prodotto analizzate con AI (per barcode)."""
from __future__ import annotations

from datetime import datetime
import json
from typing import Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import ProductLabelCache


def barcode_candidates(barcode: str) -> list[str]:
    digits = "".join(c for c in (barcode or "") if c.isdigit())
    if not digits:
        return []
    out: set[str] = {digits}
    if len(digits) == 12:
        out.add(f"0{digits}")
    if len(digits) < 13:
        out.add(digits.zfill(13))
    if len(digits) == 13 and digits.startswith("0"):
        out.add(digits[1:])
    return list(out)


def canonical_barcode(barcode: str) -> str:
    candidates = barcode_candidates(barcode)
    if not candidates:
        return (barcode or "").strip()
    return max(candidates, key=len)


def get_cached_label(db: Session, barcode: str) -> ProductLabelCache | None:
    codes = barcode_candidates(barcode)
    if not codes:
        return None
    return db.scalar(
        select(ProductLabelCache).where(ProductLabelCache.barcode.in_(codes)).limit(1)
    )


def upsert_cached_label(
    db: Session,
    *,
    barcode: str,
    product_name: str,
    brand: str,
    ingredients: str,
    allergeni_contenuti: Iterable[str],
    allergeni_tracce: Iterable[str],
    created_by_user_id: int | None = None,
    source: str = "ai_label",
    image_url: str | None = None,
    confidence_score: float = 1.0,
) -> ProductLabelCache:
    code = canonical_barcode(barcode)
    row = db.scalar(select(ProductLabelCache).where(ProductLabelCache.barcode == code))
    contenuti = list(allergeni_contenuti)
    tracce = list(allergeni_tracce)
    now = datetime.utcnow()
    if row:
        row.product_name = product_name or row.product_name
        row.brand = brand or row.brand
        row.ingredients = ingredients or row.ingredients
        row.allergeni_contenuti_json = json.dumps(contenuti)
        row.allergeni_tracce_json = json.dumps(tracce)
        row.source = source or getattr(row, "source", "ai_label")
        if image_url:
            row.image_url = image_url
        if confidence_score:
            row.confidence_score = confidence_score
        row.last_verified_at = now
        row.updated_at = now
        db.flush()
        return row
    row = ProductLabelCache(
        barcode=code,
        product_name=product_name,
        brand=brand,
        ingredients=ingredients,
        allergeni_contenuti_json=json.dumps(contenuti),
        allergeni_tracce_json=json.dumps(tracce),
        created_by_user_id=created_by_user_id,
        source=source,
        image_url=image_url,
        confidence_score=confidence_score,
        verification_count=1,
        report_count=0,
        last_verified_at=now,
    )
    db.add(row)
    db.flush()
    return row


def increment_product_verification(db: Session, barcode: str) -> bool:
    row = get_cached_label(db, barcode)
    if not row:
        return False
    row.verification_count = (getattr(row, "verification_count", 0) or 0) + 1
    row.last_verified_at = datetime.utcnow()
    db.flush()
    return True


def increment_product_report(db: Session, barcode: str) -> int:
    row = get_cached_label(db, barcode)
    if not row:
        return 0
    row.report_count = (getattr(row, "report_count", 0) or 0) + 1
    db.flush()
    return row.report_count


def cache_allergeni_contenuti(row: ProductLabelCache) -> list[str]:
    try:
        data = json.loads(row.allergeni_contenuti_json or "[]")
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []


def cache_allergeni_tracce(row: ProductLabelCache) -> list[str]:
    try:
        data = json.loads(row.allergeni_tracce_json or "[]")
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []

