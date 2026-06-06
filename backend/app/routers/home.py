from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from schemas.home import HomeStatsResponse
from services import home_service
from models.donation import DonationModel
from models.need import NeedModel
from models.user import User
from services.donations_service import _attach_donor_data

router = APIRouter(prefix="/home", tags=["home"])


@router.get("/feed")
def get_home_feed(db: Session = Depends(get_db)):
    donations = db.query(DonationModel).all()
    needs = db.query(NeedModel).all()

    feed = []

    for donation in donations:
        if donation.status == "inactive":
            continue
        _attach_donor_data(db, donation)

        feed.append({
            "id": donation.id,
            "item_type": "donation",
            "title": donation.title,
            "description": donation.description,
            "location": donation.location,
            "image": donation.image,
            "category": donation.category,
            "status": donation.status,
            "owner_email": donation.owner_email,
            "reserved_by_email": donation.reserved_by_email,
            "donor_name": getattr(donation, "donor_name", None),
            "created_at": donation.created_at.isoformat() if donation.created_at else None,
        })

    for need in needs:
        org = db.query(User).filter(User.email == need.organization_email).first()

        feed.append({
            "id": need.id,
            "item_type": "need",
            "title": need.title,
            "description": need.description,
            "location": need.location,
            "image": getattr(need, "image", None),
            "organization_email": need.organization_email,
            "organization_name": org.name if org else need.organization_email,
            "organization_logo_url": org.logo_url if org else None,
            "organization_cover_image_url": org.cover_image_url if org else None,
            "organization_verification_status": org.verification_status if org else None,
            "items": need.items,
            "created_at": need.created_at.isoformat() if need.created_at else None,
        })

    feed.sort(
        key=lambda item: item["created_at"] if item["created_at"] else "",
        reverse=True
    )

    return feed


@router.get("/stats", response_model=HomeStatsResponse)
def get_home_stats(db: Session = Depends(get_db)):
    return home_service.get_home_stats(db)
