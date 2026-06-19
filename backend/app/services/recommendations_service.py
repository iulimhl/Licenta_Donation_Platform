import json
import re
import unicodedata

from sqlalchemy.orm import Session

from models.donation import DonationModel
from models.need import NeedModel
from models.user import User
from services.semantic_matching_service import (
    cosine_similarity,
    is_semantic_matching_available,
)
from services.embedding_storage_service import (
    build_donation_recommendation_text,
    build_need_item_recommendation_text,
    ensure_donation_embedding,
    ensure_need_item_embedding,
)


def normalize_text(value):
    if value is None:
        return ""
    value = str(value).strip().lower()
    value = unicodedata.normalize("NFD", value)
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    value = re.sub(r"[^a-z0-9\s]", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value


def get_word_variants(word):
    variants = {word}

    if len(word) > 4 and word.endswith("uri"):
        variants.add(word[:-3])
    if len(word) > 4 and word.endswith("le"):
        variants.add(word[:-2])
    if len(word) > 4 and word.endswith("e"):
        variants.add(word[:-1])
    if len(word) > 4 and word.endswith("i"):
        variants.add(word[:-1])

    return variants


def get_search_tokens(value):
    stopwords = {"pentru", "intr", "intro", "din", "cu", "sau", "si", "de", "la"}
    tokens = set()

    for word in normalize_text(value).split():
        if len(word) <= 2 or word in stopwords:
            continue
        tokens.update(get_word_variants(word))

    return tokens


def get_first_image(image_value):
    if not image_value:
        return None

    try:
        parsed_images = json.loads(image_value)
        if isinstance(parsed_images, list) and parsed_images:
            return parsed_images[0]
    except Exception:
        pass

    return image_value


def build_need_text(need, item):
    return build_need_item_recommendation_text(need, item)


def build_donation_text(donation):
    return build_donation_recommendation_text(donation)


def lexical_bonus(item_name, donation):
    item_words = get_search_tokens(item_name)
    donation_title_words = get_search_tokens(donation.title)
    donation_words = get_search_tokens(build_donation_text(donation))

    if not item_words or not donation_words:
        return 0

    title_overlap = len(item_words & donation_title_words)
    full_overlap = len(item_words & donation_words)
    bonus = min(full_overlap * 8, 18)

    if title_overlap > 0:
        bonus += min(title_overlap * 55, 65)

    normalized_item = normalize_text(item_name)
    normalized_donation = normalize_text(build_donation_text(donation))
    if normalized_item and normalized_item in normalized_donation:
        bonus += 10

    return min(bonus, 75)


def score_match(need, item_index, item, donation):
    need_embedding = ensure_need_item_embedding(need, item_index, item)
    donation_embedding = ensure_donation_embedding(donation)

    if need_embedding and donation_embedding:
        semantic_score = round(cosine_similarity(need_embedding, donation_embedding) * 100, 2)
    else:
        semantic_score = 0

    match_score = min(100, semantic_score + lexical_bonus(item.get("name"), donation))
    return round(semantic_score, 2), round(match_score, 2)


def get_need_recommendations(db: Session, need_id: int, limit: int = 3, min_score: float = 58):
    need = db.query(NeedModel).filter(NeedModel.id == need_id).first()
    if not need:
        return None

    donations = db.query(DonationModel).filter(DonationModel.status == "available").all()
    owner_emails = {donation.owner_email for donation in donations if donation.owner_email}
    owners = {
        user.email: user
        for user in db.query(User).filter(User.email.in_(owner_emails)).all()
    } if owner_emails else {}

    recommendations = []

    for item_index, item in enumerate(need.items or []):
        quantity = int(item.get("quantity") or 0)
        brought = int(item.get("brought") or 0)
        remaining = max(quantity - brought, 0)

        if remaining <= 0:
            continue

        matches = []
        for donation in donations:
            semantic_score, match_score = score_match(need, item_index, item, donation)
            if match_score < min_score:
                continue

            owner = owners.get(donation.owner_email)
            matches.append({
                "donation_id": donation.id,
                "title": donation.title,
                "category": donation.category,
                "location": donation.location,
                "image": get_first_image(donation.image),
                "owner_email": donation.owner_email,
                "donor_name": owner.name if owner else "Anonymous",
                "semantic_score": semantic_score,
                "match_score": match_score,
            })

        matches.sort(key=lambda match: match["match_score"], reverse=True)
        recommendations.append({
            "need_id": need.id,
            "item_index": item_index,
            "item_name": item.get("name") or "",
            "needed_quantity": quantity,
            "brought_quantity": brought,
            "remaining_quantity": remaining,
            "matches": matches[:limit],
        })

    db.commit()
    return {
        "need_id": need.id,
        "model_available": is_semantic_matching_available(),
        "recommendations": recommendations,
    }


def get_donation_recommendations(db: Session, donation_id: int, limit: int = 6, min_score: float = 58):
    donation = db.query(DonationModel).filter(DonationModel.id == donation_id).first()
    if not donation:
        return None

    needs = db.query(NeedModel).all()
    organization_emails = {need.organization_email for need in needs if need.organization_email}
    organizations = {
        user.email: user
        for user in db.query(User).filter(User.email.in_(organization_emails)).all()
    } if organization_emails else {}

    recommendations = []

    for need in needs:
        for item_index, item in enumerate(need.items or []):
            quantity = int(item.get("quantity") or 0)
            brought = int(item.get("brought") or 0)
            remaining = max(quantity - brought, 0)

            if remaining <= 0:
                continue

            semantic_score, match_score = score_match(need, item_index, item, donation)
            if match_score < min_score:
                continue

            organization = organizations.get(need.organization_email)
            recommendations.append({
                "need_id": need.id,
                "title": need.title,
                "location": need.location,
                "organization_email": need.organization_email,
                "organization_name": organization.name if organization else "Organization",
                "item_index": item_index,
                "item_name": item.get("name") or "",
                "needed_quantity": quantity,
                "brought_quantity": brought,
                "remaining_quantity": remaining,
                "semantic_score": semantic_score,
                "match_score": match_score,
            })

    db.commit()
    recommendations.sort(key=lambda recommendation: recommendation["match_score"], reverse=True)

    return {
        "donation_id": donation.id,
        "model_available": is_semantic_matching_available(),
        "recommendations": recommendations[:limit],
    }
