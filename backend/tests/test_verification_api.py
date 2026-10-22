import pandas as pd
import pytest

from services import local_registry_service as registry


@pytest.fixture
def registry_data(monkeypatch):
    sources = {key: pd.DataFrame() for key in [
        "asociatii", "fundatii", "federatii", "uniuni",
        "furnizori_acreditati", "servicii_licentiate",
    ]}
    sources["furnizori_acreditati"] = pd.DataFrame({
        "Denumire furnizor": ["Asociatia Sprijin Copii"], "CUI/CIF": [12345678],
    })
    monkeypatch.setattr(registry, "_REGISTRY_CACHE", sources)
    monkeypatch.setattr(registry, "semantic_name_score", lambda first, second: None)


@pytest.fixture
def document_directory(tmp_path, monkeypatch, app):
    from routers import verification

    directory = tmp_path / "documents"
    directory.mkdir()
    monkeypatch.setattr(verification, "UPLOAD_DIR", str(directory))
    return directory


@pytest.mark.parametrize("name, cif, found", [
    ("Asociatia Sprijin Copii", "RO12345678", True),
    ("Complet Necunoscut", "99999999", False),
])
def test_registry_verification_requires_admin_approval(
    client, db_session, users, auth_headers, registry_data, name, cif, found
):
    response = client.post("/verification/organization", json={
        "email": users["organization"].email, "name": name, "cif": cif,
    }, headers=auth_headers("organization"))

    assert response.status_code == 200
    assert response.json()["found"] is found
    db_session.refresh(users["organization"])
    assert users["organization"].verification_status == "pending"
    assert users["organization"].verified is False


def test_user_cannot_verify_another_organization(client, users, auth_headers):
    response = client.post("/verification/organization", json={
        "email": users["organization"].email, "name": "Test", "cif": "12345678",
    }, headers=auth_headers("owner"))

    assert response.status_code == 403


def test_admin_can_reject_organization_with_reason(client, db_session, users, auth_headers):
    response = client.patch(
        f"/verification/reject/{users['organization'].id}",
        json={"reason": "Document ilizibil"}, headers=auth_headers("admin"),
    )

    assert response.status_code == 200
    db_session.refresh(users["organization"])
    assert users["organization"].verification_status == "rejected"
    assert users["organization"].verified is False
    assert users["organization"].rejection_reason == "Document ilizibil"


def test_organization_can_upload_document(client, db_session, users, auth_headers, document_directory):
    response = client.post(
        "/verification/upload-document", data={"email": users["organization"].email},
        files={"file": ("certificate.pdf", b"%PDF-test", "application/pdf")},
        headers=auth_headers("organization"),
    )

    assert response.status_code == 200
    url = response.json()["document_url"]
    assert (document_directory / url.rsplit("/", 1)[-1]).read_bytes() == b"%PDF-test"
    db_session.refresh(users["organization"])
    assert users["organization"].document_url == url


def test_user_cannot_upload_document_for_another_account(client, users, auth_headers, document_directory):
    response = client.post(
        "/verification/upload-document", data={"email": users["organization"].email},
        files={"file": ("certificate.pdf", b"%PDF-test", "application/pdf")},
        headers=auth_headers("owner"),
    )

    assert response.status_code == 403
    assert list(document_directory.iterdir()) == []
