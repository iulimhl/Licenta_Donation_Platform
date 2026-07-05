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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message, error = messages_service.create_message(
        db=db,
        sender_email=current_user.email,
        recipient_email=payload.recipient_email,
        content=payload.content,
        donation_id=payload.donation_id,
        need_id=getattr(payload, 'need_id', None)
    )

    if error == "recipient_not_found":
        raise HTTPException(status_code=404, detail="Recipient not found")

    if error == "same_user":
        raise HTTPException(status_code=400, detail="You cannot send messages to yourself")

    if error in {"donation_not_found", "need_not_found"}:
        raise HTTPException(status_code=404, detail="Conversation context not found")

    if error == "invalid_context":
        raise HTTPException(status_code=403, detail="You cannot use this conversation context")

    return message

@router.get("/conversation", response_model=list[MessageResponse])
def get_conversation(
    other_email: str,
    donation_id: int = Query(None),
    need_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return messages_service.get_conversation(db, current_user.email, other_email, donation_id, need_id)

@router.get("/inbox", response_model=list[InboxConversationResponse])
def get_inbox(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return messages_service.get_inbox(db, current_user.email)

@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return messages_service.get_unread_count(db, current_user.email)

@router.get("/sent-offers")
def get_sent_offers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return messages_service.get_sent_offers(db, current_user.email)


@router.post("/offers/{offer_id}/confirm", response_model=MessageResponse)
def confirm_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message, _need, error = messages_service.confirm_offer(db, offer_id, current_user.email)

    if error == "offer_not_found":
        raise HTTPException(status_code=404, detail="Offer not found")

    if error == "not_offer":
        raise HTTPException(status_code=400, detail="This message is not an item offer")

    if error == "forbidden":
        raise HTTPException(status_code=403, detail="Only the receiving organization can confirm this offer")

    if error in {"missing_need", "need_not_found"}:
        raise HTTPException(status_code=404, detail="Need list not found for this offer")

    if error == "invalid_item":
        raise HTTPException(status_code=400, detail="The offered item no longer exists")

    if error == "item_fulfilled":
        raise HTTPException(status_code=409, detail="This item is already fulfilled")

    return message
