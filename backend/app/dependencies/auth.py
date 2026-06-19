from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from models.user import User
from services.token_service import verify_auth_token


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    email = verify_auth_token(authorization.replace("Bearer ", "", 1).strip())
    if not email:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")

    return user


def require_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return current_user


def require_self_or_admin(email: str, current_user: User):
    if current_user.email != email and current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="You can only access your own account")
