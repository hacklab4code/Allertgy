"""Cache condivisa etichette prodotto analizzate con AI (per barcode)."""
from __future__ import annotations

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
    created_by_user_id: int | None,
) -> ProductLabelCache:
    code = canonical_barcode(barcode)
    row = db.scalar(select(ProductLabelCache).where(ProductLabelCache.barcode == code))
    contenuti = list(allergeni_contenuti)
    tracce = list(allergeni_tracce)
    if row:
        row.product_name = product_name or row.product_name
        row.brand = brand or row.brand
        row.ingredients = ingredients or row.ingredients
        row.allergeni_contenuti_json = json.dumps(contenuti)
        row.allergeni_tracce_json = json.dumps(tracce)
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
    )
    db.add(row)
    db.flush()
    return row


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
