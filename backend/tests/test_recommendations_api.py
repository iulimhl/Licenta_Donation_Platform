import pytest

from models.donation import DonationModel
from models.need import NeedModel


@pytest.fixture
def need(db_session, users):
    item = NeedModel(
        title="Haine pentru copii",
        description="Haine pentru copii de 5-7 ani",
        location="Iasi",
        organization_email=users["organization"].email,
        items=[{"name": "Haine", "quantity": 5, "brought": 0}],
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)
    return item


def test_recommendations_work_without_embedding_model(client, donation, need):
    response = client.get(f"/recommendations/donations/{donation.id}")

    assert response.status_code == 200
    result = response.json()
    assert result["model_available"] is False
    assert len(result["recommendations"]) == 1
    assert result["recommendations"][0]["need_id"] == need.id
    assert result["recommendations"][0]["semantic_score"] == 0
    assert result["recommendations"][0]["remaining_quantity"] == 5


def test_fulfilled_need_is_not_recommended(client, db_session, donation, need):
    need.items = [{"name": "Haine", "quantity": 5, "brought": 5}]
    db_session.commit()

    response = client.get(f"/recommendations/donations/{donation.id}")

    assert response.status_code == 200
    assert response.json()["recommendations"] == []


@pytest.mark.parametrize("status", ["reserved", "inactive"])
def test_unavailable_donation_is_not_recommended(client, db_session, donation, need, status):
    donation.status = status
    db_session.commit()

    response = client.get(f"/recommendations/needs/{need.id}")

    assert response.status_code == 200
    assert response.json()["recommendations"][0]["matches"] == []


def test_unrelated_donation_is_not_recommended(client, db_session, donation, need):
    donation.title = "Birou din lemn"
    donation.category = "Mobila"
    donation.description = "Birou cu sertare"
    db_session.commit()

    response = client.get(f"/recommendations/needs/{need.id}")

    assert response.status_code == 200
    assert response.json()["recommendations"][0]["matches"] == []


def test_recommendations_are_ranked_and_limited(client, db_session, donation, need, users):
    need.item_embeddings = [{
        "text": "Haine. Haine pentru copii. Haine pentru copii de 5-7 ani",
        "vector": [1.0, 0.0],
    }]
    donation.recommendation_embedding = {
        "text": "Haine pentru copii. Haine. Haine pentru copii de 5-7 ani, in stare buna",
        "vector": [1.0, 0.0],
    }
    alternative = DonationModel(
        title="Imbracaminte", category="Textile", description="Articole textile",
        location="Iasi", image="/uploads/alternative.jpg", owner_email=users["owner"].email,
        recommendation_embedding={
            "text": "Imbracaminte. Textile. Articole textile", "vector": [0.8, 0.6],
        },
    )
    db_session.add(alternative)
    db_session.commit()

    response = client.get(f"/recommendations/needs/{need.id}", params={"limit": 2})

    assert response.status_code == 200
    matches = response.json()["recommendations"][0]["matches"]
    assert [match["donation_id"] for match in matches] == [donation.id, alternative.id]
    assert matches[0]["semantic_score"] == pytest.approx(100)
    assert matches[1]["semantic_score"] == pytest.approx(80)
    limited = client.get(f"/recommendations/needs/{need.id}", params={"limit": 1})
    assert limited.status_code == 200
    assert [match["donation_id"] for match in limited.json()["recommendations"][0]["matches"]] == [donation.id]


@pytest.mark.parametrize("resource", ["needs", "donations"])
def test_recommendations_for_missing_resource_return_not_found(client, resource):
    response = client.get(f"/recommendations/{resource}/999999")

    assert response.status_code == 404
