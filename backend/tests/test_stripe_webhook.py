"""Test webhook Stripe: firma, attivazione piano ristoratore, Plus cliente."""
from unittest.mock import MagicMock, patch

from sqlalchemy import select

from app.config import settings as app_settings
from app.models import Restaurant, User, VisibilityBoost
from app.security import hash_password


def _seed_restaurant(db, *, stripe_customer_id: str = "cus_test_owner") -> Restaurant:
    owner = User(
        email="owner-webhook@test.it",
        password_hash=hash_password("Owner123!"),
        role="owner",
    )
    db.add(owner)
    db.flush()
    restaurant = Restaurant(
        public_code="100088",
        name="Webhook Test Locale",
        city="Roma",
        owner_user_id=owner.id,
        stripe_customer_id=stripe_customer_id,
        business_plan="free",
        subscription_status="free",
        is_active=1,
    )
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    return restaurant


def _seed_customer(db, *, stripe_customer_id: str = "cus_test_customer") -> User:
    customer = User(
        email="customer-webhook@test.it",
        password_hash=hash_password("Cliente123!"),
        role="customer",
        customer_plan="customer_free",
        customer_subscription_status="free",
        customer_stripe_customer_id=stripe_customer_id,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@patch("app.routers.billing._stripe")
def test_webhook_rejects_invalid_signature(mock_stripe, client):
    app_settings.stripe_webhook_secret = "whsec_test"
    app_settings.stripe_secret_key = "sk_test_fake"
    mock_stripe.return_value.Webhook.construct_event.side_effect = ValueError("bad signature")

    resp = client.post(
        "/billing/webhook",
        content=b"{}",
        headers={"stripe-signature": "invalid"},
    )
    assert resp.status_code == 400


@patch("app.routers.billing._stripe")
def test_webhook_subscription_updated_activates_owner_plan(mock_stripe, client, db_session):
    app_settings.stripe_webhook_secret = "whsec_test"
    app_settings.stripe_secret_key = "sk_test_fake"
    app_settings.stripe_price_base = "price_base_test"
    app_settings.stripe_price_pro_notify = "price_pro_test"

    restaurant = _seed_restaurant(db_session)
    subscription = {
        "id": "sub_test_owner",
        "customer": restaurant.stripe_customer_id,
        "status": "active",
        "items": {"data": [{"price": {"id": "price_base_test"}}]},
    }
    mock_stripe.return_value.Webhook.construct_event.return_value = {
        "type": "customer.subscription.updated",
        "data": {"object": subscription},
    }

    resp = client.post(
        "/billing/webhook",
        content=b"{}",
        headers={"stripe-signature": "sig_ok"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"received": True}

    db_session.refresh(restaurant)
    assert restaurant.business_plan == "base"
    assert restaurant.subscription_status == "active"
    assert restaurant.is_verified == 1
    assert restaurant.stripe_subscription_id == "sub_test_owner"


@patch("app.routers.billing._stripe")
def test_webhook_checkout_completed_activates_customer_plus(mock_stripe, client, db_session):
    app_settings.stripe_webhook_secret = "whsec_test"
    app_settings.stripe_secret_key = "sk_test_fake"
    app_settings.stripe_price_customer_plus = "price_plus_test"

    customer = _seed_customer(db_session)
    subscription = {
        "id": "sub_test_plus",
        "customer": customer.customer_stripe_customer_id,
        "status": "active",
        "items": {"data": [{"price": {"id": "price_plus_test"}}]},
    }
    mock_stripe.return_value.Webhook.construct_event.return_value = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "customer": customer.customer_stripe_customer_id,
                "subscription": "sub_test_plus",
                "metadata": {"type": "customer_plus", "user_id": str(customer.id)},
            }
        },
    }
    mock_stripe.return_value.Subscription.retrieve.return_value = subscription

    resp = client.post(
        "/billing/webhook",
        content=b"{}",
        headers={"stripe-signature": "sig_ok"},
    )
    assert resp.status_code == 200

    db_session.refresh(customer)
    assert customer.customer_plan == "customer_plus"
    assert customer.customer_subscription_status == "active"
    assert customer.customer_stripe_subscription_id == "sub_test_plus"


@patch("app.routers.billing._stripe")
def test_webhook_subscription_deleted_downgrades_owner(mock_stripe, client, db_session):
    app_settings.stripe_webhook_secret = "whsec_test"
    app_settings.stripe_secret_key = "sk_test_fake"
    app_settings.stripe_price_base = "price_base_test"

    restaurant = _seed_restaurant(db_session)
    restaurant.business_plan = "base"
    restaurant.subscription_status = "active"
    restaurant.stripe_subscription_id = "sub_to_cancel"
    db_session.commit()

    subscription = {
        "id": "sub_to_cancel",
        "customer": restaurant.stripe_customer_id,
        "status": "canceled",
        "items": {"data": [{"price": {"id": "price_base_test"}}]},
    }
    mock_stripe.return_value.Webhook.construct_event.return_value = {
        "type": "customer.subscription.deleted",
        "data": {"object": subscription},
    }

    resp = client.post("/billing/webhook", content=b"{}", headers={"stripe-signature": "sig_ok"})
    assert resp.status_code == 200

    db_session.refresh(restaurant)
    assert restaurant.business_plan == "free"
    assert restaurant.subscription_status == "free"


@patch("app.routers.billing.send_payment_failed")
@patch("app.routers.billing._stripe")
def test_webhook_invoice_payment_failed_sets_past_due(mock_stripe, mock_email, client, db_session):
    app_settings.stripe_webhook_secret = "whsec_test"
    app_settings.stripe_secret_key = "sk_test_fake"

    restaurant = _seed_restaurant(db_session)
    restaurant.business_plan = "base"
    restaurant.subscription_status = "active"
    restaurant.billing_email = "billing@test.it"
    db_session.commit()

    mock_stripe.return_value.Webhook.construct_event.return_value = {
        "type": "invoice.payment_failed",
        "data": {"object": {"customer": restaurant.stripe_customer_id, "id": "in_fail_1"}},
    }

    resp = client.post("/billing/webhook", content=b"{}", headers={"stripe-signature": "sig_ok"})
    assert resp.status_code == 200

    db_session.refresh(restaurant)
    assert restaurant.subscription_status == "past_due"
    mock_email.assert_called_once()


@patch("app.routers.billing._stripe")
def test_webhook_payment_intent_succeeded_activates_boost(mock_stripe, client, db_session):
    app_settings.stripe_webhook_secret = "whsec_test"
    app_settings.stripe_secret_key = "sk_test_fake"

    restaurant = _seed_restaurant(db_session)
    mock_stripe.return_value.Webhook.construct_event.return_value = {
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": "pi_boost_test",
                "metadata": {"type": "visibility_boost", "restaurant_id": str(restaurant.id)},
            }
        },
    }

    resp = client.post("/billing/webhook", content=b"{}", headers={"stripe-signature": "sig_ok"})
    assert resp.status_code == 200

    boost = db_session.scalar(
        select(VisibilityBoost).where(
            VisibilityBoost.stripe_payment_intent_id == "pi_boost_test"
        )
    )
    assert boost is not None
    db_session.refresh(restaurant)
    assert restaurant.featured_priority == 10
