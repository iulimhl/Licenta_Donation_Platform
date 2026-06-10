import os
import threading
from functools import lru_cache
from math import sqrt

MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL_NAME",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
)
ENABLE_EMBEDDING_NAME_MATCH = os.getenv("ENABLE_EMBEDDING_NAME_MATCH", "false").lower() == "true"
ALLOW_EMBEDDING_MODEL_DOWNLOAD = os.getenv("ALLOW_EMBEDDING_MODEL_DOWNLOAD", "false").lower() == "true"

_MODEL = None
_MODEL_AVAILABLE = None
_MODEL_LOCK = threading.Lock()


def get_embedding_model():
    global _MODEL, _MODEL_AVAILABLE

    if _MODEL_AVAILABLE is False:
        return None

    if _MODEL is None:
        with _MODEL_LOCK:
            if _MODEL is None:
                try:
                    from sentence_transformers import SentenceTransformer

                    try:
                        _MODEL = SentenceTransformer(MODEL_NAME, local_files_only=True)
                    except TypeError:
                        _MODEL = SentenceTransformer(MODEL_NAME)
                    except Exception:
                        if not ALLOW_EMBEDDING_MODEL_DOWNLOAD:
                            raise

                        _MODEL = SentenceTransformer(MODEL_NAME)
                    _MODEL_AVAILABLE = True
                except Exception:
                    _MODEL_AVAILABLE = False
                    return None

    return _MODEL


def is_semantic_matching_available():
    return get_embedding_model() is not None


def is_semantic_name_matching_enabled():
    return ENABLE_EMBEDDING_NAME_MATCH


@lru_cache(maxsize=10000)
def get_text_embedding(text):
    model = get_embedding_model()
    if model is None:
        return None

    vector = model.encode(text, normalize_embeddings=True)
    return tuple(float(value) for value in vector)


def cosine_similarity(first_vector, second_vector):
    if not first_vector or not second_vector:
        return 0.0

    dot = sum(a * b for a, b in zip(first_vector, second_vector))
    first_norm = sqrt(sum(a * a for a in first_vector))
    second_norm = sqrt(sum(b * b for b in second_vector))

    if first_norm == 0 or second_norm == 0:
        return 0.0

    return dot / (first_norm * second_norm)


def semantic_name_score(input_name, registry_name, force=False):
    if not ENABLE_EMBEDDING_NAME_MATCH and not force:
        return None

    input_embedding = get_text_embedding(input_name)
    registry_embedding = get_text_embedding(registry_name)

    if input_embedding is None or registry_embedding is None:
        return None

    similarity = cosine_similarity(input_embedding, registry_embedding)
    return round(similarity * 100, 2)


def semantic_score_to_verification_score(semantic_score):
    if semantic_score is None:
        return None

    if semantic_score >= 98:
        return 100
    if semantic_score >= 90:
        return 85
    if semantic_score >= 82:
        return 70
    if semantic_score >= 72:
        return 50
    if semantic_score >= 62:
        return 35
    return 0
