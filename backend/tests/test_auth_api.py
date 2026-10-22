import pytest

from core.security import verify_password
from models.user import User


@pytest.fixture
def registration_payload():
    return {"email": "new@example.invalid", "password": "DonationTest123!", "name": "New donor"}


def test_register_login_and_access_own_profile(client, db_session, registration_payload):
    registered = client.post("/auth/register", json=registration_payload)

    assert registered.status_code == 200
    saved = db_session.query(User).filter_by(email=registration_payload["email"]).one()
    assert saved.hashed_password != registration_payload["password"]
    assert verify_password(registration_payload["password"], saved.hashed_password)
    assert "hashed_password" not in registered.json()

    logged_in = client.post("/auth/login", json={
        "email": registration_payload["email"],
        "password": registration_payload["password"],
    })

    assert logged_in.status_code == 200
    token = logged_in.json()["auth_token"]
    profile = client.get(
        f"/auth/user/{saved.email}", headers={"Authorization": f"Bearer {token}"}
    )
    assert profile.status_code == 200
    assert profile.json()["email"] == registration_payload["email"]
    assert "hashed_password" not in profile.json()


def test_duplicate_registration_does_not_create_second_account(client, db_session, registration_payload):
    first = client.post("/auth/register", json=registration_payload)
    assert first.status_code == 200

    response = client.post("/auth/register", json=registration_payload)

    assert response.status_code == 400
    assert db_session.query(User).filter_by(email=registration_payload["email"]).count() == 1


def test_organization_registration_requires_admin_verification(client, db_session, registration_payload):
    response = client.post("/auth/register", json={
        **registration_payload, "user_type": "organization", "cif": "12345678"
    })

    assert response.status_code == 200
    saved = db_session.query(User).filter_by(email=registration_payload["email"]).one()
    assert saved.user_type == "organization"
    assert saved.cif == "12345678"
    assert saved.verification_status == "pending"
    assert saved.verified is False


def test_wrong_password_cannot_log_in(client, registration_payload):
    registered = client.post("/auth/register", json=registration_payload)
    assert registered.status_code == 200

    response = client.post("/auth/login", json={
        "email": registration_payload["email"], "password": "WrongPassword123!"
    })

    assert response.status_code == 400
    assert "auth_token" not in response.json()


def test_weak_password_is_rejected(client, db_session, registration_payload):
    response = client.post("/auth/register", json={**registration_payload, "password": "123"})

    assert response.status_code == 422
    assert db_session.query(User).count() == 0


@pytest.mark.parametrize("role", ["admin", "unknown"])
def test_registration_rejects_privileged_and_invalid_roles(client, db_session, registration_payload, role):
    response = client.post("/auth/register", json={**registration_payload, "user_type": role})

    assert response.status_code == 422
    assert db_session.query(User).count() == 0


def test_expired_token_cannot_access_profile(client, users, monkeypatch):
    from services import token_service

    monkeypatch.setattr(token_service, "TOKEN_TTL_SECONDS", -1)
    token = token_service.create_auth_token(users["owner"].email)

    response = client.get(
        f"/auth/user/{users['owner'].email}", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 401


def test_invalid_token_cannot_access_profile(client, users):
    response = client.get(
        f"/auth/user/{users['owner'].email}", headers={"Authorization": "Bearer invalid-token"}
    )

    assert response.status_code == 401


def test_user_cannot_access_another_private_profile(client, auth_headers, users):
    response = client.get(f"/auth/user/{users['owner'].email}", headers=auth_headers("other"))

    assert response.status_code == 403


def test_regular_user_cannot_approve_organization(client, db_session, auth_headers, users):
    organization = users["organization"]

    response = client.patch(f"/verification/approve/{organization.id}", headers=auth_headers("owner"))

    assert response.status_code == 403
    db_session.refresh(organization)
    assert organization.verification_status == "pending"
    assert organization.verified is False


def test_admin_can_approve_organization(client, db_session, auth_headers, users):
    organization = users["organization"]

    response = client.patch(f"/verification/approve/{organization.id}", headers=auth_headers("admin"))

    assert response.status_code == 200
    db_session.refresh(organization)
    assert organization.verification_status == "verified"
    assert organization.verified is True


@pytest.mark.parametrize("role, expected_status", [("owner", 403), ("organization", 403), ("admin", 200)])
def test_pending_verifications_require_admin(client, auth_headers, users, role, expected_status):
    response = client.get("/verification/pending", headers=auth_headers(role))

    assert response.status_code == expected_status
    if role == "admin":
        assert [item["email"] for item in response.json()] == [users["organization"].email]
