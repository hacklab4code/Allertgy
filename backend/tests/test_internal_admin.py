"""Test admin interno: monitoraggio e gestione clienti Plus."""
from datetime import datetime, timezone

from app.legal import LEGAL_TERMS_VERSION, PRIVACY_VERSION
from app.models import User
from app.security import hash_password

ADMIN_HEADERS = {"X-Admin-Key": "test-admin-key"}


def _seed_customer(db, email="admin-cliente@test.it"):
    user = User(
        email=email,
        password_hash=hash_password("Cliente123!"),
        role="customer",
        terms_accepted_at=datetime.now(timezone.utc),
        privacy_accepted_at=datetime.now(timezone.utc),
        legal_terms_version=LEGAL_TERMS_VERSION,
        privacy_version=PRIVACY_VERSION,
        customer_plan="customer_free",
        customer_subscription_status="free",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_internal_summary_includes_customer_metrics(client, db_session):
    _seed_customer(db_session)

    res = client.get("/internal-admin/summary", headers=ADMIN_HEADERS)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["total_customers"] >= 1
    assert "customers_plus_active" in data
    assert "customers_plus_comped" in data
    assert "customer_mrr_cents" in data
    assert "customers_by_plan" in data


def test_internal_users_list_customer_fields(client, db_session):
    customer = _seed_customer(db_session)

    res = client.get("/internal-admin/users", headers=ADMIN_HEADERS)
    assert res.status_code == 200, res.text
    users = res.json()
    row = next(u for u in users if u["id"] == customer.id)
    assert row["role"] == "customer"
    assert row["customer_plan"] == "customer_free"
    assert row["has_customer_plus"] is False
    assert "barcode_scans_month" in row
    assert "referrals_count" in row


def test_internal_customer_detail_and_grant_plus(client, db_session):
    customer = _seed_customer(db_session)

    detail = client.get(f"/internal-admin/users/{customer.id}", headers=ADMIN_HEADERS)
    assert detail.status_code == 200, detail.text
    assert detail.json()["email"] == customer.email
    assert detail.json()["allergen_codes"] == []

    grant = client.patch(
        f"/internal-admin/users/{customer.id}/customer",
        headers=ADMIN_HEADERS,
        json={"customer_plan": "customer_plus", "customer_subscription_status": "comped"},
    )
    assert grant.status_code == 200, grant.text
    body = grant.json()
    assert body["customer_plan"] == "customer_plus"
    assert body["customer_subscription_status"] == "comped"
    assert body["has_customer_plus"] is True

    revoke = client.patch(
        f"/internal-admin/users/{customer.id}/customer",
        headers=ADMIN_HEADERS,
        json={"customer_plan": "customer_free", "customer_subscription_status": "free"},
    )
    assert revoke.status_code == 200, revoke.text
    assert revoke.json()["customer_plan"] == "customer_free"
    assert revoke.json()["has_customer_plus"] is False


def test_internal_customer_patch_rejects_owner(client, db_session):
    owner = User(
        email="admin-owner@test.it",
        password_hash=hash_password("Owner123!"),
        role="owner",
        terms_accepted_at=datetime.now(timezone.utc),
        privacy_accepted_at=datetime.now(timezone.utc),
        legal_terms_version=LEGAL_TERMS_VERSION,
        privacy_version=PRIVACY_VERSION,
    )
    db_session.add(owner)
    db_session.commit()
    db_session.refresh(owner)

    res = client.patch(
        f"/internal-admin/users/{owner.id}/customer",
        headers=ADMIN_HEADERS,
        json={"customer_plan": "customer_plus"},
    )
    assert res.status_code == 400
