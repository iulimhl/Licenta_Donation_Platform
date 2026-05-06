from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db.database import get_db
from schemas.message import MessageCreate, MessageResponse, InboxConversationResponse, UnreadCountResponse
from services import messages_service

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("/", response_model=MessageResponse)
def send_message(payload: MessageCreate, sender_email: str, db: Session = Depends(get_db)):
    if not sender_email:
        raise HTTPException(status_code=400, detail="Sender email is required")

    return messages_service.create_message(
        db=db,
        sender_email=sender_email,
        recipient_email=payload.recipient_email,
        content=payload.content,
        donation_id=payload.donation_id
    )

@router.get("/conversation", response_model=list[MessageResponse])
def get_conversation(
    other_email: str,
    user_email: str,
    donation_id: int = Query(None),
    db: Session = Depends(get_db)
):
    if not user_email:
        raise HTTPException(status_code=400, detail="User email is required")

    return messages_service.get_conversation(db, user_email, other_email, donation_id)

@router.get("/inbox", response_model=list[InboxConversationResponse])
def get_inbox(user_email: str, db: Session = Depends(get_db)):
    if not user_email:
        raise HTTPException(status_code=400, detail="User email is required")

    return messages_service.get_inbox(db, user_email)

@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(user_email: str, db: Session = Depends(get_db)):
    if not user_email:
        raise HTTPException(status_code=400, detail="User email is required")

    return messages_service.get_unread_count(db, user_email)