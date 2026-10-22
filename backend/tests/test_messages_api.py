import pytest

from models.message import Message


def test_conversation_updates_inbox_and_unread_counts(client, db_session, users, auth_headers):
    sent = client.post("/messages/", json={
        "recipient_email": users["recipient"].email, "content": "Buna, cand putem preda donatia?",
    }, headers=auth_headers("owner"))
    assert sent.status_code == 200
    assert sent.json()["sender_email"] == users["owner"].email
    inbox = client.get("/messages/inbox", headers=auth_headers("recipient"))
    assert inbox.status_code == 200
    assert inbox.json()[0]["unread_count"] == 1
    assert inbox.json()[0]["other_name"] == users["owner"].name
    unread = client.get("/messages/unread-count", headers=auth_headers("recipient"))
    assert unread.json() == {"unread_count": 1}
    unrelated = client.get("/messages/inbox", headers=auth_headers("other"))
    assert unrelated.json() == []

    conversation = client.get("/messages/conversation", params={
        "other_email": users["owner"].email,
    }, headers=auth_headers("recipient"))

    assert conversation.status_code == 200
    assert [item["id"] for item in conversation.json()] == [sent.json()["id"]]
    db_session.expire_all()
    assert db_session.get(Message, sent.json()["id"]).is_read is True
    assert client.get("/messages/unread-count", headers=auth_headers("recipient")).json() == {"unread_count": 0}
    reply = client.post("/messages/", json={
        "recipient_email": users["owner"].email, "content": "Maine",
    }, headers=auth_headers("recipient"))
    assert reply.status_code == 200
    assert client.get("/messages/inbox", headers=auth_headers("recipient")).json()[0]["last_message"] == "Maine"


@pytest.mark.parametrize("context", ["donation", "need"])
def test_context_owner_must_participate_in_conversation(
    client, db_session, users, auth_headers, donation, need, context
):
    context_id = donation.id if context == "donation" else need.id
    response = client.post("/messages/", json={
        "recipient_email": users["other"].email, "content": "Hello", f"{context}_id": context_id,
    }, headers=auth_headers("recipient"))

    assert response.status_code == 403
    assert db_session.query(Message).count() == 0


def test_confirmed_offer_updates_quantity_once_and_caps_amount(client, db_session, users, auth_headers, need):
    sent = client.post("/messages/", json={
        "recipient_email": users["organization"].email, "need_id": need.id,
        "content": "[OFFER:item_index=0;amount=20] Pot aduce caiete.",
    }, headers=auth_headers("owner"))
    assert sent.status_code == 200
    offer_id = sent.json()["id"]
    offers = client.get("/messages/sent-offers", headers=auth_headers("owner"))
    assert offers.status_code == 200
    assert offers.json()[0]["amount"] == 20
    assert offers.json()[0]["item_name"] == "Caiete"
    assert client.get("/messages/sent-offers", headers=auth_headers("other")).json() == []

    confirmed = client.post(f"/messages/offers/{offer_id}/confirm", headers=auth_headers("organization"))

    assert confirmed.status_code == 200
    assert "amount=10]" in confirmed.json()["content"]
    db_session.refresh(need)
    assert need.items[0]["brought"] == 10
    repeated = client.post(f"/messages/offers/{offer_id}/confirm", headers=auth_headers("organization"))
    assert repeated.status_code == 200
    assert repeated.json()["id"] == confirmed.json()["id"]
    assert db_session.query(Message).count() == 2

def test_missing_recipient_is_rejected(client, db_session, auth_headers):
    response = client.post("/messages/", json={
        "recipient_email": "missing@example.invalid", "content": "Hello",
    }, headers=auth_headers("owner"))

    assert response.status_code == 404
    assert db_session.query(Message).count() == 0


def test_donation_conversation_is_separate_from_direct_messages(client, users, auth_headers, donation):
    payload = {"recipient_email": users["owner"].email, "content": "Buna"}
    sent = client.post("/messages/", json={**payload, "donation_id": donation.id},
                       headers=auth_headers("recipient"))
    direct = client.post("/messages/", json=payload, headers=auth_headers("recipient"))
    assert sent.status_code == 200
    assert direct.status_code == 200

    response = client.get("/messages/conversation", params={
        "other_email": users["recipient"].email, "donation_id": donation.id,
    }, headers=auth_headers("owner"))

    assert response.status_code == 200
    assert [item["id"] for item in response.json()] == [sent.json()["id"]]


def test_other_user_cannot_confirm_offer(client, db_session, users, auth_headers, need):
    offer = Message(
        sender_email=users["owner"].email, recipient_email=users["organization"].email,
        need_id=need.id, content="[OFFER:item_index=0;amount=2] Caiete",
    )
    db_session.add(offer)
    db_session.commit()

    response = client.post(f"/messages/offers/{offer.id}/confirm", headers=auth_headers("other"))

    assert response.status_code == 403
    db_session.refresh(need)
    assert need.items[0]["brought"] == 0
    assert db_session.query(Message).count() == 1
