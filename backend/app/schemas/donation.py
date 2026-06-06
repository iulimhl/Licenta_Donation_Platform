from pydantic import BaseModel

class DonationCreate(BaseModel):
    title: str
    location: str
    category: str
    description: str | None = None
    image: str | None = None
    owner_email: str | None = None
    reserved_by_email: str | None = None
    lat: float | None = None
    lng: float | None = None


class DonationResponse(BaseModel):
    id: int
    title: str
    location: str
    category: str
    description: str | None = None
    image: str | None = None
    owner_email: str | None = None
    reserved_by_email: str | None = None
    status: str
    donor_name: str | None = None
    phone: str | None = None
    phone_visible: bool | None = None

    class Config:
        from_attributes = True
