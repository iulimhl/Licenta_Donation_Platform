from sqlalchemy.orm import Session
from models.user import User
from services.ong_registry_service import search_ong_registry, normalize_text

def verify_organization(db: Session, email: str, organization_name: str, cif: str):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return None, "user_not_found"

    if user.user_type != "organization":
        return None, "not_organization"

    result = search_ong_registry(organization_name, cif)

    user.cif = cif

    if result["found"]:
        user.verification_status = "verified" if result["score"] >= 90 else "pending"
        user.verification_score = result["score"]
        user.verification_source = result["source"]
    else:
        user.verification_status = "pending"
        user.verification_score = 0.0
        user.verification_source = result["source"]

    db.commit()
    db.refresh(user)

    return {
        "found": result["found"],
        "matched_name": result["matched_name"],
        "matched_cif": result["matched_cif"],
        "score": result["score"],
        "status": user.verification_status,
        "source": user.verification_source,
        "message": "Verification completed"
    }, None