import os
import tempfile
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from dependencies.auth import get_current_user, require_admin_user
from db.database import get_db
from schemas.verification import (
    OrganizationVerificationRequest,
    OrganizationVerificationResponse,
    OCRExtractResponse,
)
from services import verification_service, ocr_service
from services.semantic_matching_service import (
    MODEL_NAME,
    is_semantic_matching_available,
    is_semantic_name_matching_enabled,
    semantic_name_score,
    semantic_score_to_verification_score,
)
from models.user import User
from services.upload_security import (
    ALLOWED_DOCUMENT_EXTENSIONS,
    ALLOWED_DOCUMENT_TYPES,
    read_limited_upload,
)

router = APIRouter(prefix="/verification", tags=["verification"])

UPLOAD_DIR = "uploads/verification_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/organization", response_model=OrganizationVerificationResponse)
def verify_organization(
    payload: OrganizationVerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.email != payload.email and current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="You can only verify your own organization")

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


@router.get("/semantic-status")
def get_semantic_status(admin: User = Depends(require_admin_user)):
    return {
        "model_name": MODEL_NAME,
        "available": is_semantic_matching_available(),
        "enabled_for_registry_matching": is_semantic_name_matching_enabled(),
    }


@router.get("/semantic-name-score")
def get_semantic_name_score(
    input_name: str,
    registry_name: str,
    admin: User = Depends(require_admin_user),
):
    score = semantic_name_score(input_name, registry_name, force=True)

    return {
        "input_name": input_name,
        "registry_name": registry_name,
        "semantic_score": score,
        "verification_score_equivalent": semantic_score_to_verification_score(score),
    }


@router.post("/extract-document", response_model=OCRExtractResponse)
async def extract_document_data(file: UploadFile = File(...)):
    content, suffix = await read_limited_upload(file, ALLOWED_DOCUMENT_EXTENSIONS, ALLOWED_DOCUMENT_TYPES)

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name

        extracted_data = ocr_service.extract_data_from_file(temp_path, file.filename)
        return extracted_data

    except Exception:
        raise HTTPException(status_code=500, detail="OCR extraction failed")

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.email != email and current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="You can only upload documents for your own account")

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.user_type != "organization":
        raise HTTPException(status_code=400, detail="Only organizations can upload verification documents")

    content, ext = await read_limited_upload(file, ALLOWED_DOCUMENT_EXTENSIONS, ALLOWED_DOCUMENT_TYPES)
    safe_name = f"{uuid4().hex}{ext}"
    save_path = os.path.join(UPLOAD_DIR, safe_name)

    try:
        with open(save_path, "wb") as buffer:
            buffer.write(content)

        user.document_url = f"/uploads/verification_documents/{safe_name}"
        db.commit()
        db.refresh(user)

        return {
            "message": "Document uploaded successfully",
            "document_url": user.document_url
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Document upload failed")


@router.get("/pending")
def get_pending_organizations(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
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
def approve_organization(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
    org = db.query(User).filter(User.id == user_id, User.user_type == "organization").first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    org.verification_status = "verified"
    org.verified = True
    db.commit()
    db.refresh(org)

    return {"message": "Organization approved"}


@router.patch("/reject/{user_id}")
def reject_organization(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
    org = db.query(User).filter(User.id == user_id, User.user_type == "organization").first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    org.verification_status = "rejected"
    org.verified = False
    db.commit()
    db.refresh(org)

    return {"message": "Organization rejected"}
