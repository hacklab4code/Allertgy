"""Test per il servizio di risoluzione barcode multi-database ed estrazione allergeni."""
import pytest
from app.services.barcode_resolver import (
    extract_allergens_from_text,
    extract_dietary_flags,
    resolve_barcode_cascade,
)
from app.services.product_label_cache import upsert_cached_label


def test_extract_allergens_from_text_standard():
    text = "Farina di frumento, acqua, lievito, sale, olio di oliva. Può contenere tracce di soia e senape."
    contenuti, tracce = extract_allergens_from_text(text)
    assert "glutine" in contenuti
    assert "soia" in tracce
    assert "senape" in tracce
    assert "latte" not in contenuti


def test_extract_allergens_from_text_derivatives():
    text = "Cioccolato al latte (zucchero, burro di cacao, siero di latte in polvere, caseinato di sodio, lecitina di soia), nocciole intere (15%), lisozima da uovo (E1105). Conservante: anidride solforosa (E220)."
    contenuti, tracce = extract_allergens_from_text(text)
    assert "latte" in contenuti
    assert "soia" in contenuti
    assert "frutta_a_guscio" in contenuti
    assert "uova" in contenuti
    assert "solfiti" in contenuti


def test_extract_dietary_flags():
    vegan_text = "Prodotto 100% vegetale e senza glutine. Adatto ai vegani."
    flags = extract_dietary_flags(vegan_text)
    assert "vegano" in flags
    assert "vegetariano" in flags
    assert "senza_glutine" in flags


def test_resolve_barcode_from_cache(db_session):
    barcode = "8001234567890"
    upsert_cached_label(
        db_session,
        barcode=barcode,
        product_name="Biscotti Integrali Bio",
        brand="Mulino Sicuro",
        ingredients="Farina integrale di farro, zucchero di canna, olio di girasole. Può contenere tracce di mandorle.",
        allergeni_contenuti=["glutine"],
        allergeni_tracce=["frutta_a_guscio"],
        source="allertgy_verified",
        confidence_score=1.0,
    )
    db_session.commit()

    resolved = resolve_barcode_cascade(db_session, barcode)
    assert resolved is not None
    assert resolved.barcode == barcode
    assert resolved.product_name == "Biscotti Integrali Bio"
    assert "glutine" in resolved.allergeni_contenuti
    assert "frutta_a_guscio" in resolved.allergeni_tracce
    assert resolved.source == "allertgy_verified"


def test_barcode_resolve_api(client, db_session):
    res_reg = client.post("/auth/register", json={
        "email": "barcode_user@example.com",
        "password": "Password123!",
        "display_name": "Barcode Tester",
        "role": "customer",
        "accept_terms": True,
        "accept_privacy": True,
        "accept_health_data": True,
    })
    assert res_reg.status_code == 201
    token = res_reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    barcode = "8009876543210"
    upsert_cached_label(
        db_session,
        barcode=barcode,
        product_name="Pasta Senza Glutine",
        brand="PastaBio",
        ingredients="Farina di mais, farina di riso, acqua. Senza glutine.",
        allergeni_contenuti=[],
        allergeni_tracce=[],
        source="allertgy_verified",
    )
    db_session.commit()

    res = client.get(f"/profile/barcode/{barcode}/resolve", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["barcode"] == barcode
    assert data["product_name"] == "Pasta Senza Glutine"
    assert "senza_glutine" in data["dieta_flags"]

    # Test segnalazione ricetta cambiata
    rep = client.post(
        f"/profile/barcode/{barcode}/report",
        json={"reason": "recipe_changed", "note": "Hanno aggiunto tracce di soia"},
        headers=headers,
    )
    assert rep.status_code == 200
    assert rep.json()["success"] is True
    assert rep.json()["report_count"] == 1

