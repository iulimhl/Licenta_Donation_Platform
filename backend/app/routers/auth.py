from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from db.database import get_db
from schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    LoginResponse,
    RegisterResponse,
    UserUpdate,
    UserPublicResponse,
)
from services import auth_service
from models.user import User
import os
import json
import shutil
import uuid
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    new_user, error = auth_service.register_new_user(db, payload)

    if error == "email_exists":
        raise HTTPException(status_code=400, detail="Email deja existent")

    return {
        "message": "Cont creat cu succes!",
        "user_type": new_user.user_type
    }


@router.post("/login", response_model=LoginResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    user = auth_service.login_user(db, payload)

    if not user:
        raise HTTPException(status_code=400, detail="Email sau parolă incorectă")

    return {
        "message": "Succes!",
        "email": user.email,
        "user_type": user.user_type,
        "name": user.name,
        "verification_status": user.verification_status
    }


@router.get("/user/{email}", response_model=UserResponse)
def get_user_info(email: str, db: Session = Depends(get_db)):
    user = auth_service.get_user_by_email(db, email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "email": user.email,
        "user_type": user.user_type,
        "name": user.name,
        "location": user.location,
        "lat": user.lat,
        "lng": user.lng,
        "cif": user.cif,
        "verification_status": user.verification_status,
        "verification_score": user.verification_score,
        "description": user.description,
        "phone": user.phone,
        "phone_visible": user.phone_visible,
        "website": user.website,
        "logo_url": user.logo_url,
        "city": user.city,
        "founded_year": user.founded_year,
        "mission": user.mission,
        "pickup_address": user.pickup_address,
        "cover_image_url": user.cover_image_url,
        "gallery_images": user.gallery_images,
    }


@router.get("/public/{email}", response_model=UserPublicResponse)
def get_public_user_profile(email: str, db: Session = Depends(get_db)):
    user = auth_service.get_public_user_profile(db, email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.patch("/user/{email}", response_model=UserResponse)
def update_user_info(email: str, payload: UserUpdate, db: Session = Depends(get_db)):
    user = auth_service.update_user_profile(db, email, payload)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "email": user.email,
        "user_type": user.user_type,
        "name": user.name,
        "location": user.location,
        "lat": user.lat,
        "lng": user.lng,
        "cif": user.cif,
        "verification_status": user.verification_status,
        "verification_score": user.verification_score,
        "description": user.description,
        "phone": user.phone,
        "phone_visible": user.phone_visible,
        "website": user.website,
        "logo_url": user.logo_url,
        "city": user.city,
        "founded_year": user.founded_year,
        "mission": user.mission,
        "pickup_address": user.pickup_address,
        "cover_image_url": user.cover_image_url,
        "gallery_images": user.gallery_images,
    }


def save_uploaded_file(file: UploadFile, folder: Path):
    folder.mkdir(parents=True, exist_ok=True)

    extension = os.path.splitext(file.filename)[1].lower()
    allowed_extensions = {".png", ".jpg", ".jpeg", ".webp"}

    if extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    unique_name = f"{uuid.uuid4().hex}{extension}"
    file_path = folder / unique_name

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return file_path


@router.post("/user/{email}/upload-logo")
def upload_logo(email: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    safe_email = email.replace("@", "_").replace(".", "_")
    folder = UPLOADS_DIR / "profiles" / safe_email / "logo"

    saved_path = save_uploaded_file(file, folder)

    relative_url = "/" + saved_path.relative_to(BASE_DIR).as_posix()
    user.logo_url = relative_url

    db.commit()
    db.refresh(user)

    return {"logo_url": user.logo_url}


@router.post("/user/{email}/upload-cover")
def upload_cover(email: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    safe_email = email.replace("@", "_").replace(".", "_")
    folder = UPLOADS_DIR / "profiles" / safe_email / "cover"

    saved_path = save_uploaded_file(file, folder)

    relative_url = "/" + saved_path.relative_to(BASE_DIR).as_posix()
    user.cover_image_url = relative_url

    db.commit()
    db.refresh(user)

    return {"cover_image_url": user.cover_image_url}


@router.post("/user/{email}/upload-gallery")
def upload_gallery(email: str, files: list[UploadFile] = File(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    safe_email = email.replace("@", "_").replace(".", "_")
    folder = UPLOADS_DIR / "profiles" / safe_email / "gallery"

    current_gallery = []
    if user.gallery_images:
        try:
            current_gallery = json.loads(user.gallery_images)
        except Exception:
            current_gallery = []

    new_images = []
    for file in files:
        saved_path = save_uploaded_file(file, folder)
        relative_url = "/" + saved_path.relative_to(BASE_DIR).as_posix()
        new_images.append(relative_url)

    updated_gallery = current_gallery + new_images
    user.gallery_images = json.dumps(updated_gallery)

    db.commit()
    db.refresh(user)

    return {"gallery_images": updated_gallery}