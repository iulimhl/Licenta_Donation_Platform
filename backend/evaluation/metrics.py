def evaluate_rankings(rankings, relevant_by_query, k=5):
    if k < 1:
        raise ValueError("k must be positive")

    positive_results = []
    negative_results = []
    for query_id, relevant_ids in relevant_by_query.items():
        relevant = set(relevant_ids)
        predicted = rankings[query_id][:k]
        if len(predicted) != len(set(predicted)):
            raise ValueError(f"Duplicate recommendation for {query_id}")
        if not relevant:
            negative_results.append(bool(predicted))
            continue

        hits = len(set(predicted) & relevant)
        first_hit = next((index for index, item_id in enumerate(predicted, 1) if item_id in relevant), None)
        positive_results.append({
            "precision_at_1": float(bool(predicted) and predicted[0] in relevant),
            "precision_at_k": hits / k,
            "recall_at_k": hits / len(relevant),
            "mrr_at_k": 1 / first_hit if first_hit else 0.0,
        })

    keys = ["precision_at_1", "precision_at_k", "recall_at_k", "mrr_at_k"]
    metrics = {
        key: sum(result[key] for result in positive_results) / len(positive_results) if positive_results else None
        for key in keys
    }
    metrics["no_match_false_positive_rate"] = (
        sum(negative_results) / len(negative_results) if negative_results else None
    )
    return {"k": k, "positive_queries": len(positive_results), "no_match_queries": len(negative_results), **metrics}
