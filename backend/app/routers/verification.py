import os
import tempfile

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.verification import (
    OrganizationVerificationRequest,
    OrganizationVerificationResponse,
    OCRExtractResponse,
)
from services import verification_service, ocr_service

router = APIRouter(prefix="/verification", tags=["verification"])

@router.post("/organization", response_model=OrganizationVerificationResponse)
def verify_organization(
    payload: OrganizationVerificationRequest,
    db: Session = Depends(get_db)
):
    result, error = verification_service.verify_organization(
        db=db,
        email=payload.email,
        organization_name=payload.organization_name,
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