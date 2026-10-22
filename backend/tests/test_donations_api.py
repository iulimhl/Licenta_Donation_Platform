import pytest

from models.donation import DonationModel


def test_create_donation_saves_authenticated_owner(client, db_session, auth_headers, users, donation_payload):
    payload = {**donation_payload, "owner_email": users["other"].email}

    response = client.post("/donations/", json=payload, headers=auth_headers("owner"))

    assert response.status_code == 200
    saved = db_session.get(DonationModel, response.json()["id"])
    assert saved.title == donation_payload["title"]
    assert saved.owner_email == users["owner"].email
    assert saved.status == "available"
    assert saved.reserved_by_email is None
    detail = client.get(f"/donations/{saved.id}")
    assert detail.status_code == 200
    assert detail.json()["title"] == donation_payload["title"]


def test_create_donation_requires_authentication(client, db_session, donation_payload):
    response = client.post("/donations/", json=donation_payload)

    assert response.status_code == 401
    assert db_session.query(DonationModel).count() == 0


def test_organization_cannot_post_donation(client, db_session, auth_headers, donation_payload):
    response = client.post("/donations/", json=donation_payload, headers=auth_headers("organization"))

    assert response.status_code == 403
    assert db_session.query(DonationModel).count() == 0


def test_create_donation_rejects_missing_title(client, db_session, auth_headers, donation_payload):
    donation_payload.pop("title")

    response = client.post("/donations/", json=donation_payload, headers=auth_headers("owner"))

    assert response.status_code == 422
    assert db_session.query(DonationModel).count() == 0


@pytest.mark.parametrize("role", ["owner", "admin"])
def test_owner_and_admin_can_edit_donation(client, db_session, auth_headers, donation, donation_payload, role):
    payload = {**donation_payload, "title": "Haine si incaltaminte"}

    response = client.put(f"/donations/{donation.id}", json=payload, headers=auth_headers(role))

    assert response.status_code == 200
    db_session.refresh(donation)
    assert donation.title == payload["title"]


def test_other_user_cannot_edit_donation(client, db_session, auth_headers, donation, donation_payload):
    original_title = donation.title
    payload = {**donation_payload, "title": "Modified without permission"}

    response = client.put(f"/donations/{donation.id}", json=payload, headers=auth_headers("other"))

    assert response.status_code == 403
    db_session.refresh(donation)
    assert donation.title == original_title


def test_other_user_cannot_delete_donation(client, db_session, auth_headers, donation):
    donation_id = donation.id

    response = client.delete(f"/donations/{donation_id}", headers=auth_headers("other"))

    assert response.status_code == 403
    db_session.expire_all()
    assert db_session.get(DonationModel, donation_id) is not None


@pytest.mark.parametrize("role", ["owner", "admin"])
def test_owner_and_admin_can_delete_donation(client, db_session, auth_headers, donation, role):
    donation_id = donation.id

    response = client.delete(f"/donations/{donation_id}", headers=auth_headers(role))

    assert response.status_code == 200
    assert db_session.query(DonationModel).filter_by(id=donation_id).first() is None


def test_missing_donation_returns_not_found(client):
    response = client.get("/donations/999999")

    assert response.status_code == 404


def test_user_can_reserve_and_cancel_donation(client, db_session, auth_headers, users, donation):
    path = f"/donations/{donation.id}/status"

    reserved = client.patch(path, params={"new_status": "reserved"}, headers=auth_headers("recipient"))

    assert reserved.status_code == 200
    db_session.refresh(donation)
    assert donation.status == "reserved"
    assert donation.reserved_by_email == users["recipient"].email

    cancelled = client.patch(path, params={"new_status": "available"}, headers=auth_headers("recipient"))

    assert cancelled.status_code == 200
    db_session.refresh(donation)
    assert donation.status == "available"
    assert donation.reserved_by_email is None


@pytest.mark.parametrize("new_status, expected_status", [("reserved", 409), ("available", 403)])
def test_other_user_cannot_take_or_cancel_reservation(
    client, db_session, auth_headers, users, donation, new_status, expected_status
):
    path = f"/donations/{donation.id}/status"
    reserved = client.patch(path, params={"new_status": "reserved"}, headers=auth_headers("recipient"))
    assert reserved.status_code == 200

    response = client.patch(path, params={"new_status": new_status}, headers=auth_headers("other"))

    assert response.status_code == expected_status
    db_session.refresh(donation)
    assert donation.status == "reserved"
    assert donation.reserved_by_email == users["recipient"].email


def test_other_user_cannot_deactivate_donation(client, db_session, auth_headers, donation):
    response = client.patch(
        f"/donations/{donation.id}/status",
        params={"new_status": "inactive"},
        headers=auth_headers("other"),
    )

    assert response.status_code == 403
    db_session.refresh(donation)
    assert donation.status == "available"


def test_invalid_status_does_not_modify_donation(client, db_session, auth_headers, donation):
    response = client.patch(
        f"/donations/{donation.id}/status",
        params={"new_status": "unknown"},
        headers=auth_headers("owner"),
    )

    assert response.status_code == 400
    db_session.refresh(donation)
    assert donation.status == "available"
