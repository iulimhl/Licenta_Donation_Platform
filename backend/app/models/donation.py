from sqlalchemy import Column, Integer, String, Text, Float
from db.database import Base

class DonationModel(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    location = Column(String)
    category = Column(String)
    status = Column(String, default="available")
    description = Column(Text, nullable=True)
    image = Column(String, nullable=True)
    owner_email = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)