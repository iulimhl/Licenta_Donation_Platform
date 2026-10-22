from sqlalchemy import Column, LargeBinary, String

from db.database import Base


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    path = Column(String, primary_key=True)
    content_type = Column(String, nullable=False)
    content = Column(LargeBinary, nullable=False)
