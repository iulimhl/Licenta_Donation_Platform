import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db import database
from models.donation import DonationModel
from models.need import NeedModel
from models.user import User
from services import embedding_storage_service, local_registry_service, token_service


@pytest.fixture(scope="session")
def app(tmp_path_factory):
    bootstrap_dir = tmp_path_factory.mktemp("app_startup")
    engine = create_engine(
        f"sqlite:///{(bootstrap_dir / 'startup.db').as_posix()}",
        connect_args={"check_same_thread": False},
    )
    try:
        with pytest.MonkeyPatch.context() as patch:
            patch.setattr(database, "engine", engine)
            patch.setattr(database, "SessionLocal", sessionmaker(bind=engine))
            patch.setattr(local_registry_service, "warm_registry_cache", lambda: None)
            with pytest.MonkeyPatch.context() as directory_patch:
                directory_patch.chdir(bootstrap_dir)
                from main import app as application

            yield application
    finally:
        engine.dispose()


@pytest.fixture
def db_session(app, tmp_path):
    engine = create_engine(
        f"sqlite:///{(tmp_path / 'donations.db').as_posix()}",
        connect_args={"check_same_thread": False},
    )
    database.Base.metadata.create_all(bind=engine)
    try:
        with sessionmaker(bind=engine)() as session:
            yield session
    finally:
        engine.dispose()


@pytest.fixture
def client(app, db_session, monkeypatch):
    from services import recommendations_service

    def override_get_db():
        with sessionmaker(bind=db_session.get_bind())() as request_session:
            yield request_session

    monkeypatch.setattr(token_service, "SECRET_KEY", "donation-platform-test-secret")
    monkeypatch.setattr(embedding_storage_service, "get_text_embedding", lambda text: None)
    monkeypatch.setattr(recommendations_service, "is_semantic_matching_available", lambda: False)
    app.dependency_overrides[database.get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(database.get_db, None)


@pytest.fixture
def users(db_session):
    accounts = {
        "owner": User(email="owner@example.invalid", name="Donor", user_type="user"),
        "recipient": User(email="recipient@example.invalid", name="Recipient", user_type="user"),
        "other": User(email="other@example.invalid", name="Other", user_type="user"),
        "organization": User(
            email="organization@example.invalid",
            name="Organization",
            user_type="organization",
            verification_status="pending",
            verified=False,
        ),
        "admin": User(email="admin@example.invalid", name="Admin", user_type="admin"),
    }
    db_session.add_all(accounts.values())
    db_session.commit()
    return accounts


@pytest.fixture
def auth_headers(users):
    def headers_for(role):
        token = token_service.create_auth_token(users[role].email)
        return {"Authorization": f"Bearer {token}"}

    return headers_for


@pytest.fixture
def donation_payload():
    return {
        "title": "Haine pentru copii",
        "description": "Haine pentru copii de 5-7 ani, in stare buna",
        "category": "Haine",
        "location": "Iasi",
        "image": "/uploads/test-donation.jpg",
    }


@pytest.fixture
def donation(db_session, users, donation_payload):
    item = DonationModel(**donation_payload, owner_email=users["owner"].email)
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)
    return item


@pytest.fixture
def need_payload():
    return {
        "title": "Rechizite pentru copii",
        "description": "Caiete pentru inceputul scolii",
        "location": "Iasi",
        "items": [{"name": "Caiete", "quantity": 10, "brought": 0}],
    }


@pytest.fixture
def need(db_session, users, need_payload):
    item = NeedModel(**need_payload, organization_email=users["organization"].email)
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)
    return item
