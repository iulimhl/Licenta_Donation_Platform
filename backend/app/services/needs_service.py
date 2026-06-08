from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from models.need import NeedModel
from models.user import User
from schemas.need import NeedCreate

def _attach_organization_data(db: Session, need):
    if not need:
        return None

    org = db.query(User).filter(User.email == need.organization_email).first()

    need_dict = {
        "id": need.id,
        "title": need.title,
        "description": need.description,
        "location": need.location,
        "organization_email": need.organization_email,
        "organization_name": org.name if org else need.organization_email,
        "organization_logo_url": org.logo_url if org else None,
        "organization_cover_image_url": org.cover_image_url if org else None,
        "organization_verification_status": org.verification_status if org else None,
        "image": need.image,
        "lat": need.lat,
        "lng": need.lng,
        "items": need.items,
        "created_at": need.created_at,

    }

    return need_dict


def get_all(db: Session):
    needs = db.query(NeedModel).all()
    return [_attach_organization_data(db, need) for need in needs]


def create_new(db: Session, payload: NeedCreate):
    need_data = payload.model_dump(exclude_unset=True)
    need_data["items"] = [item.model_dump() for item in payload.items]

    db_need = NeedModel(**need_data)
    db.add(db_need)
    db.commit()
    db.refresh(db_need)
    return _attach_organization_data(db, db_need)


def get_by_id(db: Session, need_id: int):
    db_need = db.query(NeedModel).filter(NeedModel.id == need_id).first()
    return _attach_organization_data(db, db_need)


def get_need_by_id(db: Session, need_id: int):
    db_need = db.query(NeedModel).filter(NeedModel.id == need_id).first()
    return _attach_organization_data(db, db_need)


def update_item_brought(db: Session, need_id: int, item_index: int, brought: int):
    db_need = db.query(NeedModel).filter(NeedModel.id == need_id).first()
    if not db_need:
        return None, "not_found"

    if item_index < 0 or item_index >= len(db_need.items):
        return None, "invalid_index"

    quantity = db_need.items[item_index].get("quantity", 0)
    db_need.items[item_index]["brought"] = max(0, min(brought, quantity))
    flag_modified(db_need, "items")

    db.commit()
    db.refresh(db_need)
    return _attach_organization_data(db, db_need), None


def update_by_id(db: Session, need_id: int, update_data: dict):
    db_need = db.query(NeedModel).filter(NeedModel.id == need_id).first()
    if not db_need:
        return None

    for key, value in update_data.items():
        if hasattr(db_need, key):
            setattr(db_need, key, value)

    flag_modified(db_need, "items")
    db.commit()
    db.refresh(db_need)
    return _attach_organization_data(db, db_need)


def delete_by_id(db: Session, need_id: int, actor_email: str | None):
    db_need = db.query(NeedModel).filter(NeedModel.id == need_id).first()
    if not db_need:
        return None, "not_found"

    actor = db.query(User).filter(User.email == actor_email).first() if actor_email else None
    is_owner = actor_email == db_need.organization_email
    is_admin = actor and actor.user_type == "admin"

    if not is_owner and not is_admin:
        return None, "forbidden"

    db.delete(db_need)
    db.commit()
    return db_need, None
