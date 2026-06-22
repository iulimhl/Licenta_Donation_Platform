from sqlalchemy.orm import Session
from models.donation import DonationModel
from models.message import Message
from models.need import NeedModel
from models.user import User

def create_message(db: Session, sender_email: str, recipient_email: str, content: str, donation_id: int | None = None, need_id: int | None = None):
    recipient = db.query(User).filter(User.email == recipient_email).first()
    if not recipient:
        return None, "recipient_not_found"

    if sender_email == recipient_email:
        return None, "same_user"

    participants = {sender_email, recipient_email}

    if donation_id is not None:
        donation = db.query(DonationModel).filter(DonationModel.id == donation_id).first()
        if not donation:
            return None, "donation_not_found"
        if donation.owner_email not in participants:
            return None, "invalid_context"

    if need_id is not None:
        need = db.query(NeedModel).filter(NeedModel.id == need_id).first()
        if not need:
            return None, "need_not_found"
        if need.organization_email not in participants:
            return None, "invalid_context"

    db_message = Message(
        sender_email=sender_email,
        recipient_email=recipient_email,
        donation_id=donation_id,
        need_id=need_id,
        content=content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message, None

def get_conversation(db: Session, user_email: str, other_email: str, donation_id: int | None = None, need_id: int | None = None):
    query = db.query(Message).filter(
        ((Message.sender_email == user_email) & (Message.recipient_email == other_email)) |
        ((Message.sender_email == other_email) & (Message.recipient_email == user_email))
    )

    if donation_id:
        query = query.filter(Message.donation_id == donation_id)
    elif need_id:
        query = query.filter(Message.need_id == need_id)
    else:
        query = query.filter(Message.donation_id == None, Message.need_id == None)

    messages = query.order_by(Message.created_at).all()

    for msg in messages:
        if msg.recipient_email == user_email and not msg.is_read:
            msg.is_read = True

    db.commit()
    return messages

def get_inbox(db: Session, user_email: str):
    messages = db.query(Message).filter(
        (Message.sender_email == user_email) | (Message.recipient_email == user_email)
    ).order_by(Message.created_at.desc()).all()

    conversations = {}
    other_emails = {
        msg.recipient_email if msg.sender_email == user_email else msg.sender_email
        for msg in messages
    }
    users = db.query(User).filter(User.email.in_(other_emails)).all() if other_emails else []
    user_lookup = {user.email: user for user in users}

    for msg in messages:
        other_email = msg.recipient_email if msg.sender_email == user_email else msg.sender_email
        key = (other_email, msg.donation_id, msg.need_id)

        if key not in conversations:
            other_user = user_lookup.get(other_email)
            unread = db.query(Message).filter(
                (Message.recipient_email == user_email) &
                (Message.sender_email == other_email) &
                (Message.donation_id == msg.donation_id) &
                (Message.need_id == msg.need_id) &
                (Message.is_read == False)
            ).count()

            conversations[key] = {
                "other_email": other_email,
                "other_name": other_user.name if other_user else None,
                "other_logo_url": other_user.logo_url if other_user else None,
                "donation_id": msg.donation_id,
                "need_id": msg.need_id,
                "last_message": msg.content,
                "last_message_date": msg.created_at,
                "is_read": msg.is_read if msg.recipient_email == user_email else True,
                "unread_count": unread
            }

    return list(conversations.values())

def get_unread_count(db: Session, user_email: str):
    unread_count = db.query(Message).filter(
        (Message.recipient_email == user_email) &
        (Message.is_read == False)
    ).count()

    return {"unread_count": unread_count}
