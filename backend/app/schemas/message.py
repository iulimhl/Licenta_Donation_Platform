from pydantic import BaseModel, ConfigDict
from datetime import datetime

class MessageCreate(BaseModel):
    recipient_email: str
    content: str
    donation_id: int | None = None
    need_id: int | None = None

class MessageResponse(BaseModel):
    id: int
    sender_email: str
    recipient_email: str
    donation_id: int | None
    need_id: int | None = None
    content: str
    created_at: datetime
    is_read: bool

    model_config = ConfigDict(from_attributes=True)

class InboxConversationResponse(BaseModel):
    other_email: str
    last_message: str
    last_message_date: datetime
    is_read: bool
    unread_count: int

class UnreadCountResponse(BaseModel):
    unread_count: int