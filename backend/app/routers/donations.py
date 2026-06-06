from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from schemas.donation import DonationCreate, DonationResponse
from services import donations_service

router = APIRouter(prefix="/donations", tags=["donations"])

@router.get("/", response_model=list[DonationResponse])
def list_donations(db: Session = Depends(get_db)):
    return donations_service.get_all(db)

@router.get("/{donation_id}", response_model=DonationResponse)
def get_single_donation(donation_id: int, db: Session = Depends(get_db)):
    donation = donations_service.get_by_id(db, donation_id)
    if not donation:
        raise HTTPException(status_code=404, detail="Donația nu a fost găsită")
    return donation

@router.post("/", response_model=DonationResponse)
def create_donation(payload: DonationCreate, db: Session = Depends(get_db)):
    return donations_service.create_new(db, payload)

@router.put("/{donation_id}", response_model=DonationResponse)
def update_donation(donation_id: int, payload: DonationCreate, db: Session = Depends(get_db)):
    updated = donations_service.update_existing(db, donation_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Donația nu a fost găsită sau nu aveți drepturi")
    return updated

@router.patch("/{donation_id}/status", response_model=DonationResponse)
def update_status(
    donation_id: int,
    new_status: str,
    user_email: str | None = None,
    db: Session = Depends(get_db)
):
    updated, error = donations_service.update_status_for_user(db, donation_id, new_status, user_email)
    if not updated:
        if error == "already_reserved":
            raise HTTPException(status_code=409, detail="This donation is already reserved by another user")
        if error == "not_reserver":
            raise HTTPException(status_code=403, detail="Only the user who reserved this donation can cancel the reservation")
        if error == "not_owner":
            raise HTTPException(status_code=403, detail="Only the owner can mark this donation as inactive")
        raise HTTPException(status_code=400, detail="Invalid status or donation not found")
    return updated

@router.delete("/{donation_id}")
def delete_donation(donation_id: int, db: Session = Depends(get_db)):
    deleted = donations_service.delete_by_id(db, donation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Donația nu a fost găsită")
    return {"message": "Donația a fost ștearsă cu succes"}
