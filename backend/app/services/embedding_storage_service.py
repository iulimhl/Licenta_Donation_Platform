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


def embedding_payload(text, vector):
    vector_json = vector_to_json(vector)
    if vector_json is None:
        return None

    return {
        "text": text,
        "vector": vector_json,
    }


def get_stored_vector(stored_value, expected_text):
    if not stored_value:
        return None

    if isinstance(stored_value, dict):
        if stored_value.get("text") == expected_text and isinstance(stored_value.get("vector"), list):
            return stored_value["vector"]
        return None

    if isinstance(stored_value, list) and all(isinstance(value, (int, float)) for value in stored_value):
        return stored_value

    return None


def ensure_donation_embedding(donation):
    if not donation:
        return None

    text = build_donation_recommendation_text(donation)
    stored_vector = get_stored_vector(donation.recommendation_embedding, text)
    if stored_vector:
        return stored_vector

    embedding = get_text_embedding(text)
    donation.recommendation_embedding = embedding_payload(text, embedding)
    flag_modified(donation, "recommendation_embedding")
    return vector_to_json(embedding)


def refresh_donation_embedding(donation):
    if not donation:
        return None

    text = build_donation_recommendation_text(donation)
    embedding = get_text_embedding(text)
    donation.recommendation_embedding = embedding_payload(text, embedding)
    flag_modified(donation, "recommendation_embedding")
    return vector_to_json(embedding)


def ensure_need_item_embedding(need, item_index, item):
    if not need:
        return None

    embeddings = list(need.item_embeddings or [])
    while len(embeddings) < len(need.items or []):
        embeddings.append(None)

    text = build_need_item_recommendation_text(need, item)
    if item_index < len(embeddings):
        stored_vector = get_stored_vector(embeddings[item_index], text)
        if stored_vector:
            return stored_vector

    embedding = get_text_embedding(text)
    embeddings[item_index] = embedding_payload(text, embedding)
    need.item_embeddings = embeddings
    flag_modified(need, "item_embeddings")
    return vector_to_json(embedding)


def refresh_need_embeddings(need):
    if not need:
        return None

    need.item_embeddings = []
    for item in (need.items or []):
        text = build_need_item_recommendation_text(need, item)
        need.item_embeddings.append(embedding_payload(text, get_text_embedding(text)))

    flag_modified(need, "item_embeddings")
    return need.item_embeddings
