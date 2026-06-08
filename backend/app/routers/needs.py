from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from schemas.need import NeedCreate, NeedResponse
from services import needs_service
from models.user import User

router = APIRouter(prefix="/needs", tags=["needs"])


@router.get("/", response_model=list[NeedResponse])
def list_needs(db: Session = Depends(get_db)):
    return needs_service.get_all(db)


@router.post("/", response_model=NeedResponse)
def create_need(payload: NeedCreate, db: Session = Depends(get_db)):
    org = db.query(User).filter(User.email == payload.organization_email).first()

    if not org or org.user_type != "organization":
        raise HTTPException(status_code=403, detail="Only organizations can post need lists")

    if org.verification_status != "verified":
        raise HTTPException(
            status_code=403,
            detail="Organization must be verified before posting need lists"
        )

    return needs_service.create_new(db, payload)


@router.get("/{need_id}", response_model=NeedResponse)
def get_need(need_id: int, db: Session = Depends(get_db)):
    db_need = needs_service.get_need_by_id(db, need_id)

    if not db_need:
        raise HTTPException(status_code=404, detail="Need not found")

    return db_need


@router.patch("/{need_id}/item/{item_index}")
def update_item_brought(need_id: int, item_index: int, brought: int, db: Session = Depends(get_db)):
    updated_need, error = needs_service.update_item_brought(db, need_id, item_index, brought)

    if error == "not_found":
        raise HTTPException(status_code=404, detail="Need list not found")

    if error == "invalid_index":
        raise HTTPException(status_code=400, detail="Invalid item index")

    return updated_need


@router.delete("/{need_id}")
def delete_need(need_id: int, actor_email: str | None = None, db: Session = Depends(get_db)):
    deleted_need, error = needs_service.delete_by_id(db, need_id, actor_email)
    if not deleted_need:
        if error == "forbidden":
            raise HTTPException(status_code=403, detail="Only the organization or an admin can delete this need list")
        raise HTTPException(status_code=404, detail="Need list not found")
    return {"message": "Need deleted"}
