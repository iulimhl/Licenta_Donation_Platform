from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from schemas.auth import UserCreate, UserLogin, UserResponse, LoginResponse, RegisterResponse
from services import auth_service

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
        "organization_name": user.organization_name,
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
        "organization_name": user.organization_name,
        "location": user.location,
        "lat": user.lat,
        "lng": user.lng,
        "cif": user.cif,
        "verification_status": user.verification_status,
        "verification_score": user.verification_score
    }