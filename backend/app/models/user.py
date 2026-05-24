from sqlalchemy import Column, Integer, String, Boolean, Float
from db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    user_type = Column(String, default="user")
    organization_name = Column(String, nullable=True)
    location = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)

    cif = Column(String, nullable=True)
    verification_status = Column(String, default="unverified")
    verification_score = Column(Float, nullable=True)
    verification_source = Column(String, nullable=True)
    document_path = Column(String, nullable=True)