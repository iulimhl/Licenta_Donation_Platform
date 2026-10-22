from datetime import datetime, timedelta, timezone

import pytest

from models.donation import DonationModel
from models.need import NeedModel


def test_home_feed_orders_items_and_excludes_inactive_donations(client, db_session, donation, need):
    now = datetime.now(timezone.utc)
    donation.created_at = now - timedelta(days=1)
    need.created_at = now
    hidden = DonationModel(
        title="Already donated", owner_email=donation.owner_email, image="hidden.jpg", status="inactive",
    )
    db_session.add(hidden)
    db_session.commit()

    response = client.get("/home/feed")

    assert response.status_code == 200
    assert [(item["item_type"], item["id"]) for item in response.json()] == [
        ("need", need.id), ("donation", donation.id),
    ]


def test_home_stats_count_only_available_and_completed_items(client, db_session, donation, need):
    db_session.add_all([
        DonationModel(title="Completed", image="done.jpg", owner_email=donation.owner_email, status="inactive"),
        DonationModel(title="Reserved", image="reserved.jpg", owner_email=donation.owner_email, status="reserved"),
        NeedModel(title="Complete", items=[{"name": "Books", "quantity": 2, "brought": 2}]),
        NeedModel(title="Empty", items=[]),
    ])
    db_session.commit()

    response = client.get("/home/stats")

    assert response.status_code == 200
    assert response.json() == {"available_items": 1, "need_lists": 3, "completed_donations": 2}


def test_map_only_lists_verified_organizations(client, db_session, users):
    assert client.get("/organizations/map").json() == []
    users["organization"].verification_status = "verified"
    users["organization"].lat = 47.16
    users["organization"].lng = 27.58
    db_session.commit()

    response = client.get("/organizations/map")

    assert response.status_code == 200
    assert [item["email"] for item in response.json()] == [users["organization"].email]
    assert response.json()[0]["lat"] == pytest.approx(47.16)


def test_health_endpoints(client):
    assert client.get("/").status_code == 200
    assert client.get("/ping").status_code == 200

def test_verified_organization_has_public_profile(client, db_session, users, need):
    organization = users["organization"]
    organization.verification_status = "verified"
    db_session.commit()

    response = client.get(f"/organizations/public/{organization.email}")

    assert response.status_code == 200
    assert response.json()["name"] == organization.name
    assert response.json()["active_need_lists"] == 1
    assert response.json()["need_lists"][0]["id"] == need.id
    assert "hashed_password" not in response.json()


def test_unverified_organization_is_not_public(client, users):
    response = client.get(f"/organizations/public/{users['organization'].email}")

    assert response.status_code == 404


def test_public_user_profile_only_lists_active_donations(client, db_session, users, donation):
    db_session.add(DonationModel(
        title="Hidden", owner_email=users["owner"].email, image="hidden.jpg", status="inactive",
    ))
    db_session.commit()

    response = client.get(f"/auth/public/{users['owner'].email}")

    assert response.status_code == 200
    assert [item["id"] for item in response.json()["active_donations"]] == [donation.id]
    assert "hashed_password" not in response.json()
