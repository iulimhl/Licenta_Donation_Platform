from sqlalchemy.orm import Session
from models.user import User
from schemas.auth import UserCreate, UserLogin
from core.security import get_password_hash, verify_password

def register_new_user(db: Session, payload: UserCreate):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        return None, "email_exists"

    hashed_pwd = get_password_hash(payload.password)

    new_user = User(
        email=payload.email,
        hashed_password=hashed_pwd,
        user_type=payload.user_type,
        organization_name=payload.organization_name if payload.user_type == "organization" else None,
        location=payload.location if payload.user_type == "organization" else None,
        lat=payload.lat if payload.user_type == "organization" else None,
        lng=payload.lng if payload.user_type == "organization" else None,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user, None

def login_user(db: Session, payload: UserLogin):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        return None

    if not verify_password(payload.password, user.hashed_password):
        return None

    return user

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()