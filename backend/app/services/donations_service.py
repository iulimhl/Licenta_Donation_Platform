from sqlalchemy.orm import Session
from models.donation import DonationModel
from schemas.donation import DonationCreate

def create_new(db: Session, payload: DonationCreate):
    db_item = DonationModel(**payload.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_all(db: Session):
    return db.query(DonationModel).all()

def delete_by_id(db: Session, donation_id: int):
    db_item = db.query(DonationModel).filter(DonationModel.id == donation_id).first()
    if not db_item:
        return None
    db.delete(db_item)
    db.commit()
    return db_item

def update_status(db: Session, donation_id: int, new_status: str):
    db_item = db.query(DonationModel).filter(DonationModel.id == donation_id).first()
    if not db_item:
        return None
    db_item.status = new_status
    db.commit()
    db.refresh(db_item)
    return db_item