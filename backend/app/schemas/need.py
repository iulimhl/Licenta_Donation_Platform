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

class NeedResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    location: str
    organization_email: str | None = None
    organization_name: str | None = None
    image: str | None = None
    lat: float | None = None
    lng: float | None = None
    items: list
    created_at: datetime | None = None

    class Config:
        from_attributes = True