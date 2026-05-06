from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str
    user_type: str = "user"
    organization_name: str | None = None
    location: str | None = None
    lat: float | None = None
    lng: float | None = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    email: str
    user_type: str
    organization_name: str | None = None

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    message: str
    email: str
    user_type: str
    organization_name: str | None = None

class RegisterResponse(BaseModel):
    message: str
    user_type: str