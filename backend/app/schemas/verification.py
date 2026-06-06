from pydantic import BaseModel

class OrganizationVerificationRequest(BaseModel):
    email: str
    name: str
    cif: str

class OrganizationVerificationResponse(BaseModel):
    found: bool
    matched_name: str | None = None
    matched_cif: str | None = None
    score: float
    status: str
    message: str

class OCRExtractResponse(BaseModel):
    name: str | None = None
    cif: str | None = None
    location: str | None = None
    document_type_guess: str | None = None
    raw_text: str