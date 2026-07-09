"""Test per endpoint /auth — registrazione, login, forgot/reset password."""

import pytest
from fastapi import status


class TestRegister:
    def test_register_customer_ok(self, client):
        """Registrazione cliente standard con tutti i consensi."""
        res = client.post("/auth/register", json={
            "email": "test@example.com",
            "password": "Test1234!",
            "display_name": "Test",
            "role": "customer",
            "accept_terms": True,
            "accept_privacy": True,
            "accept_health_data": True,
            "accept_owner_responsibility": False,
        })
        assert res.status_code == status.HTTP_201_CREATED
        data = res.json()
        assert "access_token" in data
        assert data["role"] == "customer"

    def test_register_owner_ok(self, client):
        """Registrazione ristoratore con responsabilità."""
        res = client.post("/auth/register", json={
            "email": "owner@example.com",
            "password": "Owner1234!",
            "display_name": "Risto",
            "role": "owner",
            "accept_terms": True,
            "accept_privacy": True,
            "accept_health_data": False,
            "accept_owner_responsibility": True,
        })
        assert res.status_code == status.HTTP_201_CREATED
        data = res.json()
        assert "access_token" in data
        assert data["role"] == "owner"

    def test_register_duplicate_email(self, client):
        """Email già registrata → 409."""
        payload = {
            "email": "dupe@example.com",
            "password": "Test1234!",
            "role": "customer",
            "accept_terms": True,
            "accept_privacy": True,
            "accept_health_data": True,
        }
        res1 = client.post("/auth/register", json=payload)
        assert res1.status_code == status.HTTP_201_CREATED

        res2 = client.post("/auth/register", json=payload)
        assert res2.status_code == status.HTTP_409_CONFLICT

    def test_register_missing_consent(self, client):
        """Mancata accettazione termini → 400."""
        res = client.post("/auth/register", json={
            "email": "noconsent@example.com",
            "password": "Test1234!",
            "role": "customer",
            "accept_terms": False,
            "accept_privacy": True,
            "accept_health_data": True,
        })
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_weak_password(self, client):
        """Password debole → 400."""
        res = client.post("/auth/register", json={
            "email": "weak@example.com",
            "password": "password1",
            "role": "customer",
            "accept_terms": True,
            "accept_privacy": True,
            "accept_health_data": True,
        })
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_customer_needs_health_consent(self, client):
        """Cliente senza consenso dati salute → 400."""
        res = client.post("/auth/register", json={
            "email": "nohealth@example.com",
            "password": "Test1234!",
            "role": "customer",
            "accept_terms": True,
            "accept_privacy": True,
            "accept_health_data": False,
        })
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_owner_needs_responsibility(self, client):
        """Ristoratore senza responsabilità → 400."""
        res = client.post("/auth/register", json={
            "email": "noresp@example.com",
            "password": "Test1234!",
            "role": "owner",
            "accept_terms": True,
            "accept_privacy": True,
            "accept_health_data": False,
            "accept_owner_responsibility": False,
        })
        assert res.status_code == status.HTTP_400_BAD_REQUEST


class TestLogin:
    @pytest.fixture(autouse=True)
    def _register_customer(self, client):
        """Registra un utente prima di ogni test di login."""
        client.post("/auth/register", json={
            "email": "login@example.com",
            "password": "Login1234!",
            "role": "customer",
            "accept_terms": True,
            "accept_privacy": True,
            "accept_health_data": True,
        })

    def test_login_ok(self, client):
        """Login con credenziali valide."""
        res = client.post("/auth/login", json={
            "email": "login@example.com",
            "password": "Login1234!",
        })
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert "access_token" in data
        assert data["role"] == "customer"

    def test_login_wrong_password(self, client):
        """Password errata → 401."""
        res = client.post("/auth/login", json={
            "email": "login@example.com",
            "password": "WrongPass1!",
        })
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_email(self, client):
        """Email inesistente → 401 (stesso errore, anti-enumeration)."""
        res = client.post("/auth/login", json={
            "email": "noone@example.com",
            "password": "Test1234!",
        })
        assert res.status_code == status.HTTP_401_UNAUTHORIZED


class TestForgotPassword:
    def test_forgot_password_known_email(self, client):
        """Reset per email esistente → 202."""
        client.post("/auth/register", json={
            "email": "reset@example.com",
            "password": "Reset1234!",
            "role": "customer",
            "accept_terms": True,
            "accept_privacy": True,
            "accept_health_data": True,
        })
        res = client.post("/auth/forgot-password", json={
            "email": "reset@example.com",
        })
        assert res.status_code == status.HTTP_202_ACCEPTED

    def test_forgot_password_unknown_email(self, client):
        """Reset per email sconosciuta → 202 (stessa risposta, anti-enumeration)."""
        res = client.post("/auth/forgot-password", json={
            "email": "unknown@example.com",
        })
        assert res.status_code == status.HTTP_202_ACCEPTED


class TestHealth:
    def test_health_endpoint(self, client):
        """Endpoint /health funziona."""
        res = client.get("/health")
        assert res.status_code == status.HTTP_200_OK
        assert res.json() == {"status": "ok"}