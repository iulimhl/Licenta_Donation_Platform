from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from datetime import datetime
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
    created_at = Column(DateTime, default=datetime.utcnow)
