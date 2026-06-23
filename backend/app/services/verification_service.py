from sqlalchemy.orm import Session
from models.user import User
from services.local_registry_service import normalize_cif, search_all_local_registries


def verify_organization(db: Session, email: str, name: str, cif: str):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return None, "user_not_found"

    if user.user_type != "organization":
        return None, "not_organization"

    normalized_name = (name or "").strip()
    normalized_cif = (cif or "").strip()

    result = search_all_local_registries(normalized_name, normalized_cif)
    matched_cif = result["matched_cif"]
    matched_name = result["matched_name"]
    has_exact_cif_match = (
        normalized_cif
        and matched_cif
        and normalize_cif(normalized_cif) == normalize_cif(matched_cif)
    )

    user.name = matched_name if has_exact_cif_match and matched_name else normalized_name
    user.cif = normalized_cif
    user.verification_score = result["score"]
    user.verification_status = "pending"
    user.verified = False
    user.matched_name = matched_name
    user.matched_cif = matched_cif
    user.verification_source = result["source"]
    user.rejection_reason = None

    db.commit()
    db.refresh(user)

    return {
        "found": result["found"],
        "matched_name": result["matched_name"],
        "matched_cif": result["matched_cif"],
        "score": result["score"],
        "status": user.verification_status,
        "source": result["source"],
        "message": (
            "Entity found in official registry. Waiting for admin approval."
            if result["found"]
            else "Entity not found in local registries. Waiting for admin review."
        ),
    }, None
