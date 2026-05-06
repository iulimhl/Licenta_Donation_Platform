# routers/organizations.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from models.user import User

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/map")
def get_organizations_for_map(db: Session = Depends(get_db)):
    orgs = db.query(User).filter(
        User.user_type == "organization",
        User.lat != None,
        User.lng != None
    ).all()

    return [
        {
            "id": org.id,
            "name": org.organization_name,
            "location": org.location,
            "lat": org.lat,
            "lng": org.lng
        } for org in orgs
    ]