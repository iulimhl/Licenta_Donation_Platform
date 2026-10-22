import os
import secrets
import sys
from pathlib import Path


if not os.environ.get("APP_SECRET_KEY"):
    secret_path = Path("/data/token-secret")
    try:
        descriptor = os.open(secret_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:
        os.environ["APP_SECRET_KEY"] = secret_path.read_text().strip()
    else:
        secret = secrets.token_urlsafe(32)
        with os.fdopen(descriptor, "w") as secret_file:
            secret_file.write(secret)
        os.environ["APP_SECRET_KEY"] = secret

os.execvp(sys.argv[1], sys.argv[1:])
