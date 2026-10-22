import pytest

from models.need import NeedModel


def test_verified_organization_can_publish_and_list_need(client, db_session, users, auth_headers, need_payload):
    users["organization"].verification_status = "verified"
    db_session.commit()
    response = client.post("/needs/", json={
        **need_payload, "organization_email": users["other"].email,
    }, headers=auth_headers("organization"))

    assert response.status_code == 200
    saved = db_session.get(NeedModel, response.json()["id"])
    assert saved.organization_email == users["organization"].email
    assert saved.items == need_payload["items"]
    detail = client.get(f"/needs/{saved.id}")
    assert detail.status_code == 200
    assert detail.json()["organization_name"] == users["organization"].name
    listing = client.get("/needs/")
    assert listing.status_code == 200
    assert [item["id"] for item in listing.json()] == [saved.id]


@pytest.mark.parametrize("role", ["owner", "organization"])
def test_regular_users_and_unverified_organizations_cannot_publish_need(
    client, db_session, auth_headers, need_payload, role
):
    response = client.post("/needs/", json=need_payload, headers=auth_headers(role))

    assert response.status_code == 403
    assert db_session.query(NeedModel).count() == 0


@pytest.mark.parametrize("role", ["organization", "admin"])
def test_organization_and_admin_can_edit_need(client, db_session, auth_headers, need, role):
    response = client.patch(f"/needs/{need.id}", json={
        "title": "Rechizite actualizate", "items": [{"name": "Pixuri", "quantity": 4, "brought": 1}],
    }, headers=auth_headers(role))

    assert response.status_code == 200
    db_session.refresh(need)
    assert need.title == "Rechizite actualizate"
    assert need.items == [{"name": "Pixuri", "quantity": 4, "brought": 1}]


def test_other_user_cannot_edit_need(client, db_session, auth_headers, need):
    original_title = need.title
    response = client.patch(f"/needs/{need.id}", json={"title": "Unauthorized"}, headers=auth_headers("other"))

    assert response.status_code == 403
    db_session.refresh(need)
    assert need.title == original_title


@pytest.mark.parametrize("brought, expected", [(-3, 0), (4, 4), (20, 10)])
def test_received_quantity_is_clamped_to_requested_amount(client, db_session, auth_headers, need, brought, expected):
    response = client.patch(
        f"/needs/{need.id}/item/0", params={"brought": brought}, headers=auth_headers("organization")
    )

    assert response.status_code == 200
    db_session.refresh(need)
    assert need.items[0]["brought"] == expected


def test_other_user_cannot_update_received_quantity(client, db_session, auth_headers, need):
    response = client.patch(f"/needs/{need.id}/item/0", params={"brought": 4}, headers=auth_headers("other"))

    assert response.status_code == 403
    db_session.refresh(need)
    assert need.items[0]["brought"] == 0


@pytest.mark.parametrize("role", ["organization", "admin"])
def test_organization_and_admin_can_delete_need(client, db_session, auth_headers, need, role):
    need_id = need.id
    response = client.delete(f"/needs/{need_id}", headers=auth_headers(role))

    assert response.status_code == 200
    assert db_session.query(NeedModel).filter_by(id=need_id).first() is None


def test_other_user_cannot_delete_need(client, db_session, auth_headers, need):
    response = client.delete(f"/needs/{need.id}", headers=auth_headers("other"))

    assert response.status_code == 403
    assert db_session.query(NeedModel).count() == 1
