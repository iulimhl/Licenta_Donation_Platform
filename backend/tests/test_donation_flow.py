from models.donation import DonationModel
from sqlalchemy.orm import Session


def test_registered_users_can_publish_reserve_and_cancel_donation(client, db_session, donation_payload):
    donor = client.post("/auth/register", json={
        "email": "flow-donor@example.invalid", "password": "DonationFlow123!", "name": "Flow donor"
    })
    recipient = client.post("/auth/register", json={
        "email": "flow-recipient@example.invalid", "password": "DonationFlow123!", "name": "Flow recipient"
    })
    assert donor.status_code == 200
    assert recipient.status_code == 200

    donor_login = client.post("/auth/login", json={
        "email": "flow-donor@example.invalid", "password": "DonationFlow123!"
    })
    recipient_login = client.post("/auth/login", json={
        "email": "flow-recipient@example.invalid", "password": "DonationFlow123!"
    })
    assert donor_login.status_code == 200
    assert recipient_login.status_code == 200
    donor_headers = {"Authorization": f"Bearer {donor_login.json()['auth_token']}"}
    recipient_headers = {"Authorization": f"Bearer {recipient_login.json()['auth_token']}"}

    created = client.post("/donations/", json=donation_payload, headers=donor_headers)
    assert created.status_code == 200
    donation_id = created.json()["id"]

    listings = client.get("/donations/")
    assert listings.status_code == 200
    assert donation_id in [item["id"] for item in listings.json()]

    reserved = client.patch(
        f"/donations/{donation_id}/status", params={"new_status": "reserved"}, headers=recipient_headers
    )
    assert reserved.status_code == 200
    assert reserved.json()["reserved_by_email"] == "flow-recipient@example.invalid"

    cancelled = client.patch(
        f"/donations/{donation_id}/status", params={"new_status": "available"}, headers=recipient_headers
    )
    assert cancelled.status_code == 200
    with Session(db_session.get_bind()) as persisted_session:
        saved = persisted_session.get(DonationModel, donation_id)
        assert saved.owner_email == "flow-donor@example.invalid"
        assert saved.status == "available"
        assert saved.reserved_by_email is None
