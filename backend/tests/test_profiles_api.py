import json

import pytest


@pytest.fixture
def profile_files(tmp_path, monkeypatch, app):
    from routers import auth

    monkeypatch.setattr(auth, "BASE_DIR", tmp_path)
    monkeypatch.setattr(auth, "UPLOADS_DIR", tmp_path / "uploads")
    return tmp_path


def test_profile_update_persists_editable_fields_and_gallery(client, db_session, users, auth_headers):
    response = client.patch(f"/auth/user/{users['owner'].email}", json={
        "name": "Updated donor", "city": "Iasi", "phone_visible": True,
        "description": "Donez carti", "gallery_images": ["/one.jpg", "/two.jpg"],
    }, headers=auth_headers("owner"))

    assert response.status_code == 200
    assert response.json()["gallery_images"] == ["/one.jpg", "/two.jpg"]
    db_session.refresh(users["owner"])
    assert users["owner"].name == "Updated donor"
    assert users["owner"].phone_visible is True
    assert json.loads(users["owner"].gallery_images) == ["/one.jpg", "/two.jpg"]


def test_other_user_cannot_update_profile(client, db_session, users, auth_headers):
    response = client.patch(
        f"/auth/user/{users['owner'].email}",
        json={"name": "Unauthorized"}, headers=auth_headers("other"),
    )

    assert response.status_code == 403
    db_session.refresh(users["owner"])
    assert users["owner"].name == "Donor"


@pytest.mark.parametrize("storage", ["local", "database"])
def test_profile_image_upload_saves_file_and_url(
    client, db_session, users, auth_headers, profile_files, monkeypatch, storage
):
    from models.uploaded_file import UploadedFile

    monkeypatch.setenv("UPLOAD_STORAGE", storage)
    response = client.post(
        f"/auth/user/{users['owner'].email}/upload-logo",
        files={"file": ("photo.png", b"image-content", "image/png")},
        headers=auth_headers("owner"),
    )

    assert response.status_code == 200
    url = response.json()["logo_url"]
    if storage == "local":
        assert (profile_files / url.lstrip("/")).read_bytes() == b"image-content"
    else:
        assert db_session.get(UploadedFile, url).content == b"image-content"
        downloaded = client.get(url)
        assert downloaded.status_code == 200
        assert downloaded.content == b"image-content"
        assert list(profile_files.rglob("*.png")) == []
    db_session.refresh(users["owner"])
    assert users["owner"].logo_url == url


@pytest.mark.parametrize("filename, content, expected", [
    ("script.exe", b"image", 400),
    ("photo.jpg", b"x" * 11, 413),
])
def test_invalid_profile_upload_is_rejected(
    client, auth_headers, users, profile_files, monkeypatch, filename, content, expected
):
    from services import upload_security

    monkeypatch.setattr(upload_security, "MAX_UPLOAD_SIZE", 10)
    response = client.post(
        f"/auth/user/{users['owner'].email}/upload-logo",
        files={"file": (filename, content, "image/jpeg")},
        headers=auth_headers("owner"),
    )

    assert response.status_code == expected
    assert list(profile_files.rglob("*.jpg")) == []
