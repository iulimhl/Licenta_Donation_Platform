from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Float
from datetime import datetime, timezone
from db.database import Base

class NeedModel(Base):
    __tablename__ = "needs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    location = Column(String)
    organization_email = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    image = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    

    items = Column(JSON, default=list)

