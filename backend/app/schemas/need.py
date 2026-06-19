from pydantic import BaseModel
from typing import List
from datetime import datetime

class NeedItem(BaseModel):
    name: str
    quantity: int
    brought: int = 0

class NeedCreate(BaseModel):
    title: str
    description: str | None = None
    location: str
    organization_email: str | None = None
    image: str | None = None
    lat: float | None = None
    lng: float | None = None
    items: List[NeedItem]

class NeedUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    image: str | None = None
    lat: float | None = None
    lng: float | None = None
    items: List[NeedItem] | None = None

class NeedResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    location: str
    organization_email: str | None = None
    organization_name: str | None = None
    organization_logo_url: str | None = None
    organization_cover_image_url: str | None = None
    organization_verification_status: str | None = None
    image: str | None = None
    lat: float | None = None
    lng: float | None = None
    items: List[NeedItem]
    created_at: datetime | None = None

    class Config:
        from_attributes = True
