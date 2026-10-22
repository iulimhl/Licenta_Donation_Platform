from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from db.database import get_db
from models.uploaded_file import UploadedFile
from services.file_storage_service import uses_database_uploads


router = APIRouter(prefix="/uploads/profiles", tags=["profiles"])
PROFILE_DIR = Path(__file__).resolve().parent.parent / "uploads" / "profiles"


@router.get("/{file_path:path}")
def get_profile_image(file_path: str, db: Session = Depends(get_db)):
    if uses_database_uploads():
        stored_file = db.get(UploadedFile, f"/uploads/profiles/{file_path}")
        if not stored_file:
            raise HTTPException(status_code=404, detail="Image not found")
        return Response(content=stored_file.content, media_type=stored_file.content_type)

    path = (PROFILE_DIR / file_path).resolve()
    if not path.is_relative_to(PROFILE_DIR.resolve()) or not path.is_file():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path)
