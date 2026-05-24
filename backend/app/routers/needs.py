from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from schemas.need import NeedCreate, NeedResponse
from services import needs_service

router = APIRouter(prefix="/needs", tags=["needs"])

@router.get("/", response_model=list[NeedResponse])
def list_needs(db: Session = Depends(get_db)):
    return needs_service.get_all(db)

@router.post("/", response_model=NeedResponse)
def create_need(payload: NeedCreate, db: Session = Depends(get_db)):
    return needs_service.create_new(db, payload)

@router.get("/{need_id}", response_model=NeedResponse)
def get_need(need_id: int, db: Session = Depends(get_db)):
    db_need = needs_service.get_by_id(db, need_id)
    if not db_need:
        raise HTTPException(status_code=404, detail="Lista nu a fost găsită")
    return db_need

@router.patch("/{need_id}/item/{item_index}")
def update_item_brought(need_id: int, item_index: int, brought: int, db: Session = Depends(get_db)):
    updated_need, error = needs_service.update_item_brought(db, need_id, item_index, brought)

    if error == "not_found":
        raise HTTPException(status_code=404, detail="Lista nu a fost găsită")

    if error == "invalid_index":
        raise HTTPException(status_code=400, detail="Item index invalid")

    return updated_need

@router.patch("/{need_id}")
def update_need(need_id: int, update_data: dict, db: Session = Depends(get_db)):
    updated_need = needs_service.update_by_id(db, need_id, update_data)
    if not updated_need:
        raise HTTPException(status_code=404, detail="Lista nu a fost găsită")
    return updated_need

@router.delete("/{need_id}")
def delete_need(need_id: int, db: Session = Depends(get_db)):
    deleted_need = needs_service.delete_by_id(db, need_id)
    if not deleted_need:
        raise HTTPException(status_code=404, detail="Lista nu a fost găsită")
    return {"message": "Need deleted"}