import pytest

from evaluation.metrics import evaluate_rankings


def test_ranking_metrics_account_for_position_missing_results_and_no_match_cases():
    metrics = evaluate_rankings(
        {"bags": ["wrong", "bag"], "books": [], "no-match": ["wrong"]},
        {"bags": ["bag"], "books": ["book"], "no-match": []}, k=5,
    )

    assert metrics["precision_at_1"] == 0
    assert metrics["precision_at_k"] == pytest.approx(0.1)
    assert metrics["recall_at_k"] == pytest.approx(0.5)
    assert metrics["mrr_at_k"] == pytest.approx(0.25)
    assert metrics["no_match_false_positive_rate"] == 1
    assert metrics["positive_queries"] == 2
    assert metrics["no_match_queries"] == 1


def test_ranking_metrics_handle_multiple_relevant_needs_and_correct_abstention():
    metrics = evaluate_rankings(
        {"clothes": ["child-clothes", "winter-coats", "wrong"], "no-match": []},
        {"clothes": ["child-clothes", "winter-coats"], "no-match": []}, k=3,
    )

    assert metrics["precision_at_1"] == 1
    assert metrics["precision_at_k"] == pytest.approx(2 / 3)
    assert metrics["recall_at_k"] == 1
    assert metrics["mrr_at_k"] == 1
    assert metrics["no_match_false_positive_rate"] == 0
