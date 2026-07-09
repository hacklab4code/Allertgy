"""Test E2E: login → preferiti → Plus checkout → limiti barcode."""
from datetime import datetime, timedelta, timezone

from app.legal import LEGAL_TERMS_VERSION, PRIVACY_VERSION, SAFETY_DISCLAIMER_VERSION
from app.models import Allergen, Restaurant, User
from app.security import hash_password


def _seed_customer_and_restaurant(db):
    allergen = Allergen(code="latte", name_it="Latte", emoji="🥛", is_diet=0, sort_order=1)
    db.add(allergen)

    customer = User(
        email="e2e-cliente@test.it",
        password_hash=hash_password("Cliente123!"),
        role="customer",
        terms_accepted_at=datetime.now(timezone.utc),
        privacy_accepted_at=datetime.now(timezone.utc),
        health_data_consent_at=datetime.now(timezone.utc),
        legal_terms_version=LEGAL_TERMS_VERSION,
        privacy_version=PRIVACY_VERSION,
        customer_plan="customer_free",
        customer_subscription_status="free",
    )
    db.add(customer)
    db.flush()

    restaurant = Restaurant(
        public_code="100099",
        name="Locale Test E2E",
        city="Milano",
        is_active=1,
        latitude=45.46,
        longitude=9.19,
    )
    db.add(restaurant)
    db.commit()
    db.refresh(customer)
    db.refresh(restaurant)
    return customer, restaurant


def test_e2e_login_favorites_plus_barcode(client, db_session):
    db = db_session
    customer, restaurant = _seed_customer_and_restaurant(db)

    # 1. Login
    login = client.post("/auth/login", json={
        "email": "e2e-cliente@test.it",
        "password": "Cliente123!",
    })
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Preferiti — aggiungi e sincronizza
    fav_add = client.post(f"/restaurants/{restaurant.public_code}/favorite", headers=headers)
    assert fav_add.status_code == 204

    fav_list = client.get("/restaurants/favorites/mine", headers=headers)
    assert fav_list.status_code == 200
    favs = fav_list.json()
    assert len(favs) == 1
    assert favs[0]["public_code"] == "100099"
    assert favs[0]["name"] == "Locale Test E2E"

    # 3. Lista leggera
    summary = client.get("/restaurants/summary")
    assert summary.status_code == 200
    items = summary.json()
    assert len(items) >= 1
    item = next(i for i in items if i["public_code"] == "100099")
    assert "nome_ristorante" in item
    assert "piatti" in item
    assert "indirizzo" not in item  # payload leggero

    # 4. Limite barcode free (20/mese)
    for i in range(20):
        scan = client.post("/profile/barcode-scan", headers=headers)
        assert scan.status_code == 200, f"scan {i+1}: {scan.text}"
        body = scan.json()
        assert body["allowed"] is True

    scan21 = client.post("/profile/barcode-scan", headers=headers)
    assert scan21.status_code == 403
    assert "limite" in scan21.json()["detail"].lower()

    remaining = client.get("/profile/barcode-scan/remaining", headers=headers)
    assert remaining.status_code == 200
    assert remaining.json()["remaining"] == 0

    # 5. Checkout Plus (mock senza Stripe)
    checkout = client.post("/billing/customer-checkout", headers=headers)
    assert checkout.status_code == 200, checkout.text
    assert "checkout_url" in checkout.json()

    profile = client.get("/profile", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["has_customer_plus"] is True
    assert profile.json()["customer_plan"] == "customer_plus"

    # 6. Dopo Plus — barcode illimitato (almeno la 21ª scan passa)
    scan_after_plus = client.post("/profile/barcode-scan", headers=headers)
    assert scan_after_plus.status_code == 200, scan_after_plus.text
    assert scan_after_plus.json()["remaining"] is None

    unlimited_remaining = client.get("/profile/barcode-scan/remaining", headers=headers)
    assert unlimited_remaining.json()["remaining"] is None


def test_e2e_trial_expiry(client, db_session):
    db = db_session
    owner = User(
        email="e2e-owner@test.it",
        password_hash=hash_password("Ristorante1!"),
        role="owner",
        terms_accepted_at=datetime.now(timezone.utc),
        privacy_accepted_at=datetime.now(timezone.utc),
        legal_terms_version=LEGAL_TERMS_VERSION,
        privacy_version=PRIVACY_VERSION,
    )
    db.add(owner)
    db.flush()

    r = Restaurant(
        public_code="100098",
        name="Locale Trial E2E",
        owner_user_id=owner.id,
        business_plan="pro_notify",
        subscription_status="trialing",
        trial_ends_at=datetime.now(timezone.utc) - timedelta(hours=1),
        is_verified=1,
    )
    db.add(r)
    db.commit()

    from app.services.subscription_maintenance import expire_trials_and_comped
    count = expire_trials_and_comped(db)
    db.refresh(r)

    assert count == 1
    assert r.business_plan == "free"
    assert r.subscription_status == "free"

    login = client.post("/auth/login", json={
        "email": "e2e-owner@test.it",
        "password": "Ristorante1!",
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    analytics = client.get(f"/admin/restaurants/{r.id}/analytics", headers=headers)
    assert analytics.status_code == 403
