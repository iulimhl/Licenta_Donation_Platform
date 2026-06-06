import json
from sqlalchemy.orm import Session
from models.user import User
from models.need import NeedModel

def get_public_organization_by_email(db: Session, email: str):
    org = db.query(User).filter(
        User.email == email,
        User.user_type == "organization",
        User.verification_status == "verified"
    ).first()

    if not org:
        return None

    needs = db.query(NeedModel).filter(
        NeedModel.organization_email == email
    ).all()

    parsed_gallery = []
    if org.gallery_images:
        try:
            parsed_gallery = json.loads(org.gallery_images)
        except Exception:
            parsed_gallery = []

    need_lists = []
    for need in needs:
        try:
            parsed_items = json.loads(need.items) if isinstance(need.items, str) else need.items
        except Exception:
            parsed_items = []

        need_lists.append({
            "id": need.id,
            "title": need.title,
            "description": need.description,
            "location": need.location,
            "organization_email": need.organization_email,
            "organization_name": org.name,
            "organization_logo_url": org.logo_url,
            "organization_cover_image_url": org.cover_image_url,
            "organization_verification_status": org.verification_status,
            "items": parsed_items or [],
            "created_at": need.created_at.isoformat() if need.created_at else None,
        })

    return {
        "id": org.id,
        "email": org.email,
        "name": org.name,
        "location": org.location,
        "city": org.city,
        "description": org.description,
        "phone": org.phone,
        "phone_visible": org.phone_visible,
        "website": org.website,
        "logo_url": org.logo_url,
        "lat": org.lat,
        "lng": org.lng,
        "verification_status": org.verification_status,
        "active_need_lists": len(needs),
        "gallery_count": len(parsed_gallery),
        "founded_year": org.founded_year,
        "mission": org.mission,
        "pickup_address": org.pickup_address,
        "cover_image_url": org.cover_image_url,
        "gallery_images": parsed_gallery,
        "need_lists": need_lists,
    }
