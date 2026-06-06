from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.user import User
from schemas.organization import OrganizationPublicResponse
from services import organizations_service

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/map")
def get_organizations_for_map(db: Session = Depends(get_db)):
    orgs = db.query(User).filter(
        User.user_type == "organization",
        User.verification_status == "verified"
    ).all()

    return [
        {
            "id": org.id,
            "email": org.email,
            "name": org.name,
            "location": org.location,
            "city": org.city,
            "pickup_address": org.pickup_address,
            "lat": org.lat,
            "lng": org.lng
        } for org in orgs
    ]


@router.get("/public/{email}", response_model=OrganizationPublicResponse)
def get_public_organization(email: str, db: Session = Depends(get_db)):
    org = organizations_service.get_public_organization_by_email(db, email)

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return org
