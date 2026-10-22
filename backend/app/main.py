import os
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
from sqlalchemy import inspect, text

from db.database import engine, Base
from routers import ping, donations, auth, needs, messages, home, organizations, verification, recommendations, files
from services.local_registry_service import warm_registry_cache

import models.donation as donation_model
import models.need as need_model
import models.message as message_model
import models.user as user_model

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
API_PREFIX = os.getenv("API_PREFIX", "").rstrip("/")
FRONTEND_DIR = os.getenv("FRONTEND_DIR")

Base.metadata.create_all(bind=engine)

if engine.dialect.name == "postgresql":
    with engine.begin() as connection:
        for table in Base.metadata.sorted_tables:
            table_name = engine.dialect.identifier_preparer.quote(table.name)
            connection.execute(text(f"ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY"))

def ensure_schema_updates():
    inspector = inspect(engine)
    donation_columns = {column["name"] for column in inspector.get_columns("donations")}
    need_columns = {column["name"] for column in inspector.get_columns("needs")}
    user_columns = {column["name"] for column in inspector.get_columns("users")}

    with engine.begin() as connection:
        if "reserved_by_email" not in donation_columns:
            connection.execute(text("ALTER TABLE donations ADD COLUMN reserved_by_email VARCHAR"))
        if "recommendation_embedding" not in donation_columns:
            connection.execute(text("ALTER TABLE donations ADD COLUMN recommendation_embedding JSON"))
        if "item_embeddings" not in need_columns:
            connection.execute(text("ALTER TABLE needs ADD COLUMN item_embeddings JSON"))
        if "rejection_reason" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN rejection_reason TEXT"))

ensure_schema_updates()

def warm_registry_cache_safely():
    try:
        warm_registry_cache()
    except Exception as exc:
        print(f"Registry cache warmup failed: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("WARM_REGISTRY_CACHE", "true").lower() == "true":
        threading.Thread(target=warm_registry_cache_safely, daemon=True).start()
    yield


app = FastAPI(
    title="IASIdoneaza API", lifespan=lifespan,
    docs_url=f"{API_PREFIX}/docs", redoc_url=f"{API_PREFIX}/redoc",
    openapi_url=f"{API_PREFIX}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    home.router, ping.router, donations.router, needs.router, auth.router,
    messages.router, organizations.router, verification.router,
    verification.document_router, recommendations.router, files.router,
):
    app.include_router(router, prefix=API_PREFIX)

(UPLOADS_DIR / "verification_documents").mkdir(parents=True, exist_ok=True)
(UPLOADS_DIR / "profiles").mkdir(parents=True, exist_ok=True)

@app.get(f"{API_PREFIX}/")
def read_root():
    return {"message": "Welcome to IASIdoneaza API"}


if FRONTEND_DIR:
    frontend_directory = Path(FRONTEND_DIR).resolve()

    @app.get("/{path:path}", include_in_schema=False)
    def serve_frontend(path: str):
        if API_PREFIX and (path == API_PREFIX.lstrip("/") or path.startswith(f"{API_PREFIX.lstrip('/')}/")):
            raise HTTPException(status_code=404, detail="Not found")
        requested_file = (frontend_directory / path).resolve()
        if not requested_file.is_relative_to(frontend_directory):
            raise HTTPException(status_code=404, detail="Not found")
        if requested_file.is_file():
            return FileResponse(requested_file)
        return FileResponse(frontend_directory / "index.html")
