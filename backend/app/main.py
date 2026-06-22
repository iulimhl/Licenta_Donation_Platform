import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from sqlalchemy import inspect, text

from db.database import engine, Base
from routers import ping, donations, auth, needs, messages, home, organizations, verification, recommendations
from services.local_registry_service import warm_registry_cache

import models.donation as donation_model
import models.need as need_model
import models.message as message_model
import models.user as user_model

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"

Base.metadata.create_all(bind=engine)

def ensure_schema_updates():
    inspector = inspect(engine)
    donation_columns = {column["name"] for column in inspector.get_columns("donations")}
    need_columns = {column["name"] for column in inspector.get_columns("needs")}

    with engine.begin() as connection:
        if "reserved_by_email" not in donation_columns:
            connection.execute(text("ALTER TABLE donations ADD COLUMN reserved_by_email VARCHAR"))
        if "recommendation_embedding" not in donation_columns:
            connection.execute(text("ALTER TABLE donations ADD COLUMN recommendation_embedding JSON"))
        if "item_embeddings" not in need_columns:
            connection.execute(text("ALTER TABLE needs ADD COLUMN item_embeddings JSON"))

ensure_schema_updates()

def warm_registry_cache_safely():
    try:
        warm_registry_cache()
    except Exception as exc:
        print(f"Registry cache warmup failed: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=warm_registry_cache_safely, daemon=True).start()
    yield


app = FastAPI(title="IASIdoneaza API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(home.router)
app.include_router(ping.router)
app.include_router(donations.router)
app.include_router(needs.router)
app.include_router(auth.router)
app.include_router(messages.router)
app.include_router(organizations.router)
app.include_router(verification.router)
app.include_router(recommendations.router)

(UPLOADS_DIR / "verification_documents").mkdir(parents=True, exist_ok=True)
(UPLOADS_DIR / "profiles").mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to IASIdoneaza API"}
