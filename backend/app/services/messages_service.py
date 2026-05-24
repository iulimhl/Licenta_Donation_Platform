from sqlalchemy.orm import Session
from models.message import Message

def create_message(db: Session, sender_email: str, recipient_email: str, content: str, donation_id: int | None = None, need_id: int | None = None):
    # REPARAT: Salvăm și need_id în rândul nou din tabela bazei de date
    db_message = Message(
        sender_email=sender_email,
        recipient_email=recipient_email,
        donation_id=donation_id,
        need_id=need_id,  # <-- ADĂUGAT
        content=content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_conversation(db: Session, user_email: str, other_email: str, donation_id: int | None = None, need_id: int | None = None):
    # Interogăm istoricul dintre cei doi utilizatori
    query = db.query(Message).filter(
        ((Message.sender_email == user_email) & (Message.recipient_email == other_email)) |
        ((Message.sender_email == other_email) & (Message.recipient_email == user_email))
    )

    # REPARAT CONTEXT: Filtrăm mesajele strict în funcție de contextul paginii pe care te afli
    if donation_id:
        query = query.filter(Message.donation_id == donation_id)
    elif need_id:
        query = query.filter(Message.need_id == need_id)
    else:
        # Dacă e un chat direct (fără postare), aducem doar mesajele fără context
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

    for msg in messages:
        other_email = msg.recipient_email if msg.sender_email == user_email else msg.sender_email

        if other_email not in conversations:
            unread = db.query(Message).filter(
                (Message.recipient_email == user_email) &
                (Message.sender_email == other_email) &
                (Message.is_read == False)
            ).count()

            conversations[other_email] = {
                "other_email": other_email,
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