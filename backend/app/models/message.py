from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from datetime import datetime
from db.database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_email = Column(String, nullable=False)
    recipient_email = Column(String, nullable=False)
    donation_id = Column(Integer, nullable=True)
    need_id = Column(Integer, nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
