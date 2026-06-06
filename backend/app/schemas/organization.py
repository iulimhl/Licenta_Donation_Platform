from typing import Any
from pydantic import BaseModel

class OrganizationPublicResponse(BaseModel):
    id: int
    email: str
    name: str | None = None
    location: str | None = None
    city: str | None = None
    description: str | None = None
    phone: str | None = None
    phone_visible: bool | None = None
    website: str | None = None
    logo_url: str | None = None
    lat: float | None = None
    lng: float | None = None
    verification_status: str | None = None
    active_need_lists: int
    completed_donations: int = 0
    gallery_count: int = 0

    founded_year: int | None = None
    mission: str | None = None
    pickup_address: str | None = None
    cover_image_url: str | None = None
    gallery_images: list[str] | None = None
    need_lists: list[dict[str, Any]] = []

    class Config:
        from_attributes = True
