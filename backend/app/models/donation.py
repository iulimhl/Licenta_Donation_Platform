from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON
from datetime import datetime, timezone
from db.database import Base

class DonationModel(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    location = Column(String)
    category = Column(String)
    status = Column(String, default="available")
    description = Column(Text, nullable=True)
    image = Column(String, nullable=False)
    owner_email = Column(String, nullable=False)
    reserved_by_email = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    recommendation_embedding = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
