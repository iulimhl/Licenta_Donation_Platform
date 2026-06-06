from sqlalchemy.orm import Session
from models.donation import DonationModel
from models.user import User
from schemas.donation import DonationCreate


def _attach_donor_data(db: Session, donation):
    if donation:
        user_profile = db.query(User).filter(User.email == donation.owner_email).first()

        setattr(donation, "donor_name", user_profile.name if user_profile else "Anonymous")
        setattr(donation, "phone", user_profile.phone if user_profile else None)
        setattr(donation, "phone_visible", user_profile.phone_visible if user_profile else False)

    return donation


def create_new(db: Session, payload: DonationCreate):
    db_item = DonationModel(**payload.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return _attach_donor_data(db, db_item)


def get_all(db: Session):
    donations = db.query(DonationModel).all()
    for d in donations:
        _attach_donor_data(db, d)
    return donations


def get_by_id(db: Session, donation_id: int):
    donation = db.query(DonationModel).filter(DonationModel.id == donation_id).first()
    return _attach_donor_data(db, donation)


def update_existing(db: Session, donation_id: int, payload: DonationCreate):
    db_item = db.query(DonationModel).filter(DonationModel.id == donation_id).first()
    if not db_item:
        return None

    db_item.title = payload.title
    db_item.description = payload.description
    db_item.location = payload.location
    db_item.category = payload.category

    if payload.image is not None:
        db_item.image = payload.image

    db.commit()
    db.refresh(db_item)
    return _attach_donor_data(db, db_item)


def delete_by_id(db: Session, donation_id: int):
    db_item = db.query(DonationModel).filter(DonationModel.id == donation_id).first()
    if not db_item:
        return None
    db.delete(db_item)
    db.commit()
    return db_item


def update_status(db: Session, donation_id: int, new_status: str):
    updated, _ = update_status_for_user(db, donation_id, new_status, None)
    return updated


def update_status_for_user(db: Session, donation_id: int, new_status: str, actor_email: str | None):
    allowed_statuses = {"available", "reserved", "inactive"}

    if new_status not in allowed_statuses:
        return None, "invalid_status"

    db_item = db.query(DonationModel).filter(DonationModel.id == donation_id).first()
    if not db_item:
        return None, "not_found"

    actor_email = (actor_email or "").strip() or None
    is_owner = actor_email == db_item.owner_email
    is_reserved_by_actor = actor_email and actor_email == db_item.reserved_by_email

    if new_status == "reserved":
        if db_item.status == "reserved" and db_item.reserved_by_email and not is_reserved_by_actor and not is_owner:
            return None, "already_reserved"
        db_item.reserved_by_email = None if is_owner else actor_email

    if new_status == "available":
        if db_item.status == "reserved" and db_item.reserved_by_email and not is_reserved_by_actor and not is_owner:
            return None, "not_reserver"
        db_item.reserved_by_email = None

    if new_status == "inactive":
        if actor_email and not is_owner:
            return None, "not_owner"
        db_item.reserved_by_email = None

    db_item.status = new_status
    db.commit()
    db.refresh(db_item)
    return _attach_donor_data(db, db_item), None
