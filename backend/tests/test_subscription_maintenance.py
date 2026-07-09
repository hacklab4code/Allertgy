"""Test scadenza trial/comped e limiti piano."""
from datetime import datetime, timedelta, timezone

from app.models import Restaurant, User
from app.services.subscription_maintenance import expire_trials_and_comped


def test_expire_trials_and_comped(db_session):
    db = db_session
    owner = User(
        email="owner-exp@test.it",
        password_hash="x",
        role="owner",
    )
    db.add(owner)
    db.flush()

    r = Restaurant(
        public_code="900001",
        name="Locale Trial",
        owner_user_id=owner.id,
        business_plan="pro_notify",
        subscription_status="trialing",
        trial_ends_at=datetime.now(timezone.utc) - timedelta(days=1),
        is_verified=1,
    )
    db.add(r)
    db.commit()

    count = expire_trials_and_comped(db)
    db.refresh(r)

    assert count == 1
    assert r.business_plan == "free"
    assert r.subscription_status == "free"
    assert r.is_verified == 0
