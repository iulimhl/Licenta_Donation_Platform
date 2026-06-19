from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from dependencies.auth import get_current_user
from db.database import get_db
from models.user import User
from schemas.message import MessageCreate, MessageResponse, InboxConversationResponse, UnreadCountResponse
from services import messages_service

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("/", response_model=MessageResponse)
def send_message(
    payload: MessageCreate,
    sender_email: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if sender_email and sender_email != current_user.email:
        raise HTTPException(status_code=403, detail="You can only send messages as yourself")

    return messages_service.create_message(
        db=db,
        sender_email=current_user.email,
        recipient_email=payload.recipient_email,
        content=payload.content,
        donation_id=payload.donation_id,
        need_id=getattr(payload, 'need_id', None)
    )

@router.get("/conversation", response_model=list[MessageResponse])
def get_conversation(
    other_email: str,
    user_email: str | None = None,
    donation_id: int = Query(None),
    need_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_email and user_email != current_user.email:
        raise HTTPException(status_code=403, detail="You can only read your own conversations")

    return messages_service.get_conversation(db, current_user.email, other_email, donation_id, need_id)

@router.get("/inbox", response_model=list[InboxConversationResponse])
def get_inbox(
    user_email: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_email and user_email != current_user.email:
        raise HTTPException(status_code=403, detail="You can only read your own inbox")

    return messages_service.get_inbox(db, current_user.email)

@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    user_email: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_email and user_email != current_user.email:
        raise HTTPException(status_code=403, detail="You can only read your own notifications")

    return messages_service.get_unread_count(db, current_user.email)
