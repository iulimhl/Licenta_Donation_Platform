from sqlalchemy.orm import Session
from models.user import User
from schemas.auth import UserCreate, UserLogin, UserUpdate
from core.security import get_password_hash, verify_password
from models.donation import DonationModel
import json

def get_public_user_profile(db: Session, email: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None

    donations = db.query(DonationModel).filter(
        DonationModel.owner_email == email,
        DonationModel.status != "inactive"
    ).all()

    active_donations = []
    for donation in donations:
        first_image = donation.image
        try:
            parsed_images = json.loads(donation.image) if donation.image else []
            if isinstance(parsed_images, list) and parsed_images:
                first_image = parsed_images[0]
        except Exception:
            pass

        active_donations.append({
            "id": donation.id,
            "title": donation.title,
            "location": donation.location,
            "category": donation.category,
            "status": donation.status,
            "image": first_image,
        })

    return {
        "email": user.email,
        "user_type": user.user_type,
        "name": user.name,
        "location": user.location,
        "city": user.city,
        "logo_url": user.logo_url,
        "active_donations": active_donations,
    }

def register_new_user(db: Session, payload: UserCreate):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        return None, "email_exists"

    hashed_pwd = get_password_hash(payload.password)
    is_org = payload.user_type == "organization"

    new_user = User(
        email=payload.email,
        hashed_password=hashed_pwd,
        user_type=payload.user_type,
        name=payload.name,
        cif=payload.cif if is_org else None,
        location=payload.location if is_org else None,
        lat=payload.lat if is_org else None,
        lng=payload.lng if is_org else None,
        phone=payload.phone,
        phone_visible=payload.phone_visible if payload.phone_visible is not None else False,
        verification_status="pending" if is_org else None,
        verification_score=0 if is_org else None,
        verified=False if is_org else True,
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
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None

    if hasattr(user, "gallery_images") and isinstance(user.gallery_images, str):
        try:
            user.gallery_images = json.loads(user.gallery_images)
        except Exception:
            user.gallery_images = []

    return user


def update_user_profile(db: Session, email: str, payload: UserUpdate):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None

    update_data = payload.model_dump(exclude_unset=True)

    if "gallery_images" in update_data and update_data["gallery_images"] is not None:
        update_data["gallery_images"] = json.dumps(update_data["gallery_images"])

    for key, value in update_data.items():
        if hasattr(user, key):
            setattr(user, key, value)

    db.commit()
    db.refresh(user)

    if hasattr(user, "gallery_images") and isinstance(user.gallery_images, str):
        try:
            user.gallery_images = json.loads(user.gallery_images)
        except Exception:
            user.gallery_images = []

    return user