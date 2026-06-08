import os
import shutil
import tempfile
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.verification import (
    OrganizationVerificationRequest,
    OrganizationVerificationResponse,
    OCRExtractResponse,
)
from services import verification_service, ocr_service
from models.user import User

router = APIRouter(prefix="/verification", tags=["verification"])

UPLOAD_DIR = "uploads/verification_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def require_admin(admin_email: str | None, db: Session):
    if not admin_email:
        raise HTTPException(status_code=403, detail="Admin access required")

    admin = db.query(User).filter(User.email == admin_email).first()
    if not admin or admin.user_type != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")


@router.post("/organization", response_model=OrganizationVerificationResponse)
def verify_organization(
    payload: OrganizationVerificationRequest,
    db: Session = Depends(get_db)
):
    result, error = verification_service.verify_organization(
        db=db,
        email=payload.email,
        name=payload.name,
        cif=payload.cif
    )

    if error == "user_not_found":
        raise HTTPException(status_code=404, detail="User not found")

    if error == "not_organization":
        raise HTTPException(status_code=400, detail="User is not an organization")

    return result


@router.post("/extract-document", response_model=OCRExtractResponse)
async def extract_document_data(file: UploadFile = File(...)):
    allowed_extensions = (".png", ".jpg", ".jpeg", ".pdf", ".webp")

    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    suffix = os.path.splitext(file.filename)[1]

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        extracted_data = ocr_service.extract_data_from_file(temp_path, file.filename)
        return extracted_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR extraction failed: {str(e)}")

    finally:
        try:
            if "temp_path" in locals() and os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception:
            pass


@router.post("/upload-document")
async def upload_verification_document(
    email: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.user_type != "organization":
        raise HTTPException(status_code=400, detail="Only organizations can upload verification documents")

    allowed_extensions = (".png", ".jpg", ".jpeg", ".pdf", ".webp")
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    ext = os.path.splitext(file.filename)[1]
    safe_name = f"{uuid4().hex}{ext}"
    save_path = os.path.join(UPLOAD_DIR, safe_name)

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        user.document_url = f"/uploads/verification_documents/{safe_name}"
        db.commit()
        db.refresh(user)

        return {
            "message": "Document uploaded successfully",
            "document_url": user.document_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document upload failed: {str(e)}")


@router.get("/pending")
def get_pending_organizations(admin_email: str | None = None, db: Session = Depends(get_db)):
    require_admin(admin_email, db)

    orgs = db.query(User).filter(
        User.user_type == "organization",
        User.verification_status == "pending"
    ).all()

    return [
        {
            "id": org.id,
            "email": org.email,
            "name": org.name,
            "cif": org.cif,
            "location": org.location,
            "document_url": org.document_url,
            "verification_score": org.verification_score,
            "verification_status": org.verification_status,
            "matched_name": org.matched_name,
            "matched_cif": org.matched_cif,
            "verification_source": org.verification_source,
        }
        for org in orgs
    ]


@router.patch("/approve/{user_id}")
def approve_organization(user_id: int, admin_email: str | None = None, db: Session = Depends(get_db)):
    require_admin(admin_email, db)

    org = db.query(User).filter(User.id == user_id, User.user_type == "organization").first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    org.verification_status = "verified"
    org.verified = True
    db.commit()
    db.refresh(org)

    return {"message": "Organization approved"}


@router.patch("/reject/{user_id}")
def reject_organization(user_id: int, admin_email: str | None = None, db: Session = Depends(get_db)):
    require_admin(admin_email, db)

    org = db.query(User).filter(User.id == user_id, User.user_type == "organization").first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    org.verification_status = "rejected"
    org.verified = False
    db.commit()
    db.refresh(org)

    return {"message": "Organization rejected"}
