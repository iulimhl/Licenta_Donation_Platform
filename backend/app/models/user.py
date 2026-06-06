from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    user_type = Column(String, nullable=False)

    name = Column(String, nullable=True)
    location = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    cif = Column(String, nullable=True)
    verification_status = Column(String, nullable=True)
    verification_score = Column(Integer, nullable=True)
    document_url = Column(String, nullable=True)

    description = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    phone_visible = Column(Boolean, default=False)
    website = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    city = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    matched_name = Column(String, nullable=True)
    matched_cif = Column(String, nullable=True)
    verification_source = Column(String, nullable=True)

    founded_year = Column(Integer, nullable=True)
    mission = Column(Text, nullable=True)
    pickup_address = Column(String, nullable=True)
    cover_image_url = Column(String, nullable=True)
    gallery_images = Column(Text, nullable=True)