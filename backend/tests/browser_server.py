import os
import secrets
import sys
import tempfile
from pathlib import Path

import uvicorn


def run():
    with tempfile.TemporaryDirectory(prefix="donation-e2e-") as directory:
        database_path = Path(directory) / "donations.db"
        os.environ["DATABASE_URL"] = f"sqlite:///{database_path.as_posix()}"
        os.environ["CORS_ALLOWED_ORIGINS"] = "http://127.0.0.1:4173"
        os.environ["WARM_REGISTRY_CACHE"] = "false"
        os.environ["ALLOW_EMBEDDING_MODEL_DOWNLOAD"] = "false"
        os.environ["ENABLE_EMBEDDING_NAME_MATCH"] = "false"
        os.environ["APP_SECRET_KEY"] = secrets.token_urlsafe(32)
        sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "app"))

        from main import app
        from db.database import engine

        try:
            uvicorn.run(app, host="127.0.0.1", port=8001, log_level="warning")
        finally:
            engine.dispose()


if __name__ == "__main__":
    run()
