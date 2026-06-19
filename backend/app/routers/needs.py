from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies.auth import get_current_user
from db.database import get_db
from schemas.need import NeedCreate, NeedResponse, NeedUpdate
from services import needs_service
from models.need import NeedModel
from models.user import User

router = APIRouter(prefix="/needs", tags=["needs"])


@router.get("/", response_model=list[NeedResponse])
def list_needs(db: Session = Depends(get_db)):
    return needs_service.get_all(db)


@router.post("/", response_model=NeedResponse)
def create_need(
    payload: NeedCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.user_type != "organization":
        raise HTTPException(status_code=403, detail="Only organizations can post need lists")

    payload.organization_email = current_user.email
    org = current_user

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


@router.patch("/{need_id}", response_model=NeedResponse)
def update_need(
    need_id: int,
    payload: NeedUpdate,
    actor_email: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_need = db.query(NeedModel).filter(NeedModel.id == need_id).first()

    if not db_need:
        raise HTTPException(status_code=404, detail="Need list not found")

    if actor_email and actor_email != current_user.email:
        raise HTTPException(status_code=403, detail="You can only edit as yourself")

    is_owner = current_user.email == db_need.organization_email
    is_admin = current_user.user_type == "admin"

    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Only the organization or an admin can edit this need list")

    update_data = payload.model_dump(exclude_unset=True)
    updated_need = needs_service.update_by_id(db, need_id, update_data)
    return updated_need


@router.patch("/{need_id}/item/{item_index}")
def update_item_brought(
    need_id: int,
    item_index: int,
    brought: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_need = db.query(NeedModel).filter(NeedModel.id == need_id).first()
    if not db_need:
        raise HTTPException(status_code=404, detail="Need list not found")

    if current_user.email != db_need.organization_email and current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only the organization or an admin can update received quantities")

    updated_need, error = needs_service.update_item_brought(db, need_id, item_index, brought)

    if error == "not_found":
        raise HTTPException(status_code=404, detail="Need list not found")

    if error == "invalid_index":
        raise HTTPException(status_code=400, detail="Invalid item index")

    return updated_need


@router.delete("/{need_id}")
def delete_need(
    need_id: int,
    actor_email: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if actor_email and actor_email != current_user.email:
        raise HTTPException(status_code=403, detail="You can only delete as yourself")

    deleted_need, error = needs_service.delete_by_id(db, need_id, current_user.email)
    if not deleted_need:
        if error == "forbidden":
            raise HTTPException(status_code=403, detail="Only the organization or an admin can delete this need list")
        raise HTTPException(status_code=404, detail="Need list not found")
    return {"message": "Need deleted"}
