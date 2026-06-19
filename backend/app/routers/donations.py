from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies.auth import get_current_user
from db.database import get_db
from models.user import User
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
        raise HTTPException(status_code=404, detail="Donation not found")
    return donation


@router.post("/", response_model=DonationResponse)
def create_donation(
    payload: DonationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return donations_service.create_new(db, payload, current_user.email)


@router.put("/{donation_id}", response_model=DonationResponse)
def update_donation(
    donation_id: int,
    payload: DonationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated, error = donations_service.update_existing(db, donation_id, payload, current_user.email)
    if not updated:
        if error == "forbidden":
            raise HTTPException(status_code=403, detail="Only the owner or an admin can edit this donation")
        raise HTTPException(status_code=404, detail="Donation not found")
    return updated


@router.patch("/{donation_id}/status", response_model=DonationResponse)
def update_status(
    donation_id: int,
    new_status: str,
    user_email: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_email and user_email != current_user.email:
        raise HTTPException(status_code=403, detail="You can only update donations as yourself")

    updated, error = donations_service.update_status_for_user(db, donation_id, new_status, current_user.email)
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
def delete_donation(
    donation_id: int,
    actor_email: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if actor_email and actor_email != current_user.email:
        raise HTTPException(status_code=403, detail="You can only delete as yourself")

    deleted, error = donations_service.delete_by_id(db, donation_id, current_user.email)
    if not deleted:
        if error == "forbidden":
            raise HTTPException(status_code=403, detail="Only the owner or an admin can delete this donation")
        raise HTTPException(status_code=404, detail="Donation not found")
    return {"message": "Donation deleted successfully"}
