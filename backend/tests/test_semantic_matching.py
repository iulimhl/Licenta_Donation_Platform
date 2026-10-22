import pytest

from services.semantic_matching_service import cosine_similarity


def test_identical_vectors_have_maximum_similarity():
    donation_vector = [3.0, 4.0]
    need_vector = [3.0, 4.0]

    result = cosine_similarity(donation_vector, need_vector)

    assert result == pytest.approx(1.0)


def test_perpendicular_vectors_have_zero_similarity():
    result = cosine_similarity([1.0, 0.0], [0.0, 1.0])

    assert result == pytest.approx(0.0)


def test_missing_vector_returns_zero():
    result = cosine_similarity(None, [3.0, 4.0])

    assert result == 0.0


def test_zero_vector_returns_zero_without_dividing_by_zero():
    result = cosine_similarity([0.0, 0.0], [3.0, 4.0])

    assert result == 0.0
