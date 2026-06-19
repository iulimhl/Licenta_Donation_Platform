from sqlalchemy.orm.attributes import flag_modified

from services.semantic_matching_service import get_text_embedding


def build_donation_recommendation_text(donation):
    parts = [
        donation.title,
        donation.category,
        donation.description,
    ]
    return ". ".join(str(part) for part in parts if part)


def build_need_item_recommendation_text(need, item):
    parts = [
        item.get("name") if isinstance(item, dict) else None,
        need.title,
        need.description,
    ]
    return ". ".join(str(part) for part in parts if part)


def vector_to_json(vector):
    if vector is None:
        return None
    return [float(value) for value in vector]


def ensure_donation_embedding(donation):
    if not donation:
        return None

    if donation.recommendation_embedding:
        return donation.recommendation_embedding

    embedding = vector_to_json(get_text_embedding(build_donation_recommendation_text(donation)))
    donation.recommendation_embedding = embedding
    return embedding


def refresh_donation_embedding(donation):
    if not donation:
        return None

    donation.recommendation_embedding = vector_to_json(
        get_text_embedding(build_donation_recommendation_text(donation))
    )
    return donation.recommendation_embedding


def ensure_need_item_embedding(need, item_index, item):
    if not need:
        return None

    embeddings = list(need.item_embeddings or [])
    while len(embeddings) < len(need.items or []):
        embeddings.append(None)

    if item_index < len(embeddings) and embeddings[item_index]:
        return embeddings[item_index]

    embedding = vector_to_json(get_text_embedding(build_need_item_recommendation_text(need, item)))
    embeddings[item_index] = embedding
    need.item_embeddings = embeddings
    flag_modified(need, "item_embeddings")
    return embedding


def refresh_need_embeddings(need):
    if not need:
        return None

    need.item_embeddings = [
        vector_to_json(get_text_embedding(build_need_item_recommendation_text(need, item)))
        for item in (need.items or [])
    ]
    flag_modified(need, "item_embeddings")
    return need.item_embeddings
