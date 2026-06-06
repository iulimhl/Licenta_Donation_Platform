from pydantic import BaseModel, field_validator
import re
from typing import Optional

class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    user_type: str = "user"
    location: str | None = None
    lat: float | None = None
    lng: float | None = None
    cif: str | None = None
    phone: str | None = None
    phone_visible: bool | None = False

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        if len(value) < 8:
            raise ValueError("Password must have at least 8 characters")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain at least one number")
        return value


class UserLogin(BaseModel):
    email: str
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    lat: float | None = None
    lng: float | None = None
    phone: str | None = None
    phone_visible: bool | None = None
    website: str | None = None
    city: str | None = None
    description: str | None = None
    founded_year: int | None = None
    mission: str | None = None
    pickup_address: str | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None
    gallery_images: list[str] | None = None


class UserResponse(BaseModel):
    email: str
    user_type: str
    name: Optional[str] = None
    location: str | None = None
    lat: float | None = None
    lng: float | None = None
    cif: str | None = None
    verification_status: str | None = None
    verification_score: float | None = None

    description: str | None = None
    phone: str | None = None
    phone_visible: bool | None = None
    website: str | None = None
    logo_url: str | None = None
    city: str | None = None
    founded_year: int | None = None
    mission: str | None = None
    pickup_address: str | None = None
    cover_image_url: str | None = None
    gallery_images: list[str] | None = None

    class Config:
        from_attributes = True


class UserPublicResponse(BaseModel):
    email: str
    user_type: str
    name: str | None = None
    location: str | None = None
    city: str | None = None
    logo_url: str | None = None
    active_donations: list[dict] = []

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    message: str
    email: str
    user_type: str
    name: str | None = None
    verification_status: str | None = None


class RegisterResponse(BaseModel):
    message: str
    user_type: str
