import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("APP_SECRET_KEY") or secrets.token_urlsafe(32)
TOKEN_TTL_SECONDS = int(os.getenv("AUTH_TOKEN_TTL_SECONDS", str(60 * 60 * 24 * 7)))


def _encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _sign(payload: str) -> str:
    signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).digest()
    return _encode(signature)


def create_auth_token(email: str) -> str:
    payload = {
        "email": email,
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    encoded_payload = _encode(json.dumps(payload, separators=(",", ":")).encode())
    return f"{encoded_payload}.{_sign(encoded_payload)}"


def verify_auth_token(token: str | None) -> str | None:
    if not token or "." not in token:
        return None

    payload_part, signature_part = token.rsplit(".", 1)
    expected_signature = _sign(payload_part)

    if not hmac.compare_digest(signature_part, expected_signature):
        return None

    try:
        payload = json.loads(_decode(payload_part))
    except Exception:
        return None

    if int(payload.get("exp", 0)) < int(time.time()):
        return None

    return payload.get("email")
