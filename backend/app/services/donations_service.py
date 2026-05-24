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


# ADĂUGATĂ: Funcție pentru a citi o singură donație (folosită de ruta GET /{donation_id})
def get_by_id(db: Session, donation_id: int):
    return db.query(DonationModel).filter(DonationModel.id == donation_id).first()


# ADĂUGATĂ: Funcție pentru a actualiza câmpurile donației (folosită de ruta PUT /{donation_id})
def update_existing(db: Session, donation_id: int, payload: DonationCreate):
    db_item = db.query(DonationModel).filter(DonationModel.id == donation_id).first()
    if not db_item:
        return None

    # Suprascriem valorile vechi cu cele noi venite din formularul React
    db_item.title = payload.title
    db_item.description = payload.description
    db_item.location = payload.location
    db_item.category = payload.category

    db.commit()
    db.refresh(db_item)
    return db_item


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