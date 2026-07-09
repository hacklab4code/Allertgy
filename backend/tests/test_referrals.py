"""Test programma invita-un-commerciante."""

from fastapi import status


def _register_customer(client, email: str) -> str:
    res = client.post("/auth/register", json={
        "email": email,
        "password": "Test1234!",
        "display_name": "Cliente",
        "role": "customer",
        "accept_terms": True,
        "accept_privacy": True,
        "accept_health_data": True,
    })
    assert res.status_code == status.HTTP_201_CREATED
    return res.json()["access_token"]


def _register_owner(client, email: str) -> str:
    res = client.post("/auth/register", json={
        "email": email,
        "password": "Owner1234!",
        "display_name": "Risto",
        "role": "owner",
        "accept_terms": True,
        "accept_privacy": True,
        "accept_owner_responsibility": True,
    })
    assert res.status_code == status.HTTP_201_CREATED
    return res.json()["access_token"]


class TestReferrals:
    def test_customer_gets_invite_code(self, client):
        token = _register_customer(client, "cliente1@example.com")
        res = client.get("/profile/referral", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert data["invite_code"]
        assert len(data["invite_code"]) == 8
        assert data["referrals_count"] == 0
        assert data["has_plus"] is False

    def test_owner_referral_grants_plus_to_customer(self, client):
        customer_token = _register_customer(client, "cliente2@example.com")
        referral = client.get(
            "/profile/referral",
            headers={"Authorization": f"Bearer {customer_token}"},
        ).json()
        invite_code = referral["invite_code"]

        owner_token = _register_owner(client, "owner2@example.com")
        create = client.post(
            "/admin/restaurants",
            headers={"Authorization": f"Bearer {owner_token}"},
            json={"name": "Trattoria Test", "city": "Milano", "invite_code": invite_code},
        )
        assert create.status_code == status.HTTP_201_CREATED
        restaurant = create.json()
        assert restaurant["business_plan"] == "pro_notify"
        assert restaurant["subscription_status"] == "comped"
        assert restaurant["trial_ends_at"] is not None

        profile = client.get(
            "/profile",
            headers={"Authorization": f"Bearer {customer_token}"},
        ).json()
        assert profile["customer_plan"] == "customer_plus"
        assert profile["customer_subscription_status"] == "comped"
        assert profile["has_customer_plus"] is True

        stats = client.get(
            "/profile/referral",
            headers={"Authorization": f"Bearer {customer_token}"},
        ).json()
        assert stats["referrals_count"] == 1
        assert stats["has_plus"] is True

    def test_invalid_invite_code_is_ignored(self, client):
        owner_token = _register_owner(client, "owner3@example.com")
        res = client.post(
            "/admin/restaurants",
            headers={"Authorization": f"Bearer {owner_token}"},
            json={"name": "Locale Solo", "city": "Roma", "invite_code": "BADCODE1"},
        )
        assert res.status_code == status.HTTP_201_CREATED

    def test_referral_endpoint_forbidden_for_owner(self, client):
        owner_token = _register_owner(client, "owner4@example.com")
        res = client.get(
            "/profile/referral",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert res.status_code == status.HTTP_403_FORBIDDEN
