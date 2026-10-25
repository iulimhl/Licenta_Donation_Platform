import argparse
import hashlib
import json
import math
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from time import perf_counter
from types import SimpleNamespace

from evaluation.metrics import evaluate_rankings


BACKEND_DIR = Path(__file__).resolve().parent
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
MODEL_REVISION = "e8f8c211226b894fcb81acc59f3b34ba3efd5f42"


def load_dataset(path):
    dataset = json.loads(path.read_text(encoding="utf-8"))
    if dataset.get("review_status") not in {"draft", "reviewed"}:
        raise ValueError("Dataset review_status must be draft or reviewed")
    for collection in ["needs", "cases"]:
        entries = dataset.get(collection, [])
        ids = [entry["id"] for entry in entries]
        if not entries or len(ids) != len(set(ids)):
            raise ValueError(f"Dataset {collection} must be nonempty and have unique IDs")
    need_ids = {need["id"] for need in dataset["needs"]}
    for case in dataset["cases"]:
        relevant = case["relevant_need_ids"]
        if len(relevant) != len(set(relevant)) or not set(relevant).issubset(need_ids):
            raise ValueError(f"Invalid relevance labels for {case['id']}")
    return dataset


def load_encoder(mode, args):
    if mode == "lexical":
        return None
    if mode == "full":
        import torch
        from sentence_transformers import SentenceTransformer

        torch.set_num_threads(1)
        model_path = args.full_model
        return SentenceTransformer(
            model_path, local_files_only=not args.download_models,
            revision=MODEL_REVISION if model_path == MODEL_NAME else None,
        )

    from services.onnx_embedding_service import OnnxEmbeddingModel

    model_path = args.onnx_model
    if not (model_path / "model.onnx").is_file() and args.download_models:
        from huggingface_hub import snapshot_download

        snapshot_download(
            MODEL_NAME, revision=MODEL_REVISION, local_dir=str(model_path),
            allow_patterns=["tokenizer.json", "onnx/model_quint8_avx2.onnx"],
        )
        (model_path / "onnx" / "model_quint8_avx2.onnx").replace(model_path / "model.onnx")
    if not (model_path / "model.onnx").is_file():
        raise ValueError("ONNX model missing. Run with --download-models or provide --onnx-model DIRECTORY")
    return OnnxEmbeddingModel(model_path)


def evaluate_mode(mode, dataset, args):
    from services.embedding_storage_service import (
        build_donation_recommendation_text, build_need_item_recommendation_text,
    )
    from services.recommendations_service import score_vectors

    needs = [SimpleNamespace(**need) for need in dataset["needs"]]
    donations = [SimpleNamespace(**case) for case in dataset["cases"]]
    texts = {
        **{need.id: build_need_item_recommendation_text(need, {"name": need.item_name}) for need in needs},
        **{donation.id: build_donation_recommendation_text(donation) for donation in donations},
    }
    if len(texts) != len(needs) + len(donations):
        raise ValueError("Donation and need IDs must be distinct")

    encoder = load_encoder(mode, args)
    started = perf_counter()
    vectors_by_text = {}
    for text in dict.fromkeys(texts.values()):
        if encoder is None:
            vectors_by_text[text] = None
        else:
            vector = tuple(float(value) for value in encoder.encode(text, normalize_embeddings=True))
            if not vector or not all(math.isfinite(value) for value in vector) or not any(vector):
                raise ValueError(f"Invalid embedding from {mode}")
            vectors_by_text[text] = vector
    encoding_seconds = perf_counter() - started
    vectors = {item_id: vectors_by_text[text] for item_id, text in texts.items()}

    results = []
    for donation in donations:
        matches = []
        for need in needs:
            semantic_score, match_score = score_vectors(
                need.item_name, donation, vectors[need.id], vectors[donation.id],
            )
            if match_score >= args.min_score:
                matches.append({"need_id": need.id, "match_score": match_score, "semantic_score": semantic_score})
        matches.sort(key=lambda match: match["match_score"], reverse=True)
        results.append({
            "query_id": donation.id, "title": donation.title,
            "relevant_need_ids": donation.relevant_need_ids, "matches": matches[:args.k],
        })

    rankings = {result["query_id"]: [match["need_id"] for match in result["matches"]] for result in results}
    relevant = {case["id"]: case["relevant_need_ids"] for case in dataset["cases"]}
    return {
        "mode": mode, "encoding_seconds": round(encoding_seconds, 3),
        "metrics": evaluate_rankings(rankings, relevant, args.k), "results": results,
    }


def write_report(report, directory):
    directory.mkdir(parents=True, exist_ok=True)
    (directory / "report.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False, allow_nan=False) + "\n", encoding="utf-8",
    )
    k = report["k"]
    lines = [
        "# Donation matching evaluation", "",
        f"Dataset: {report['dataset_name']} ({report['case_count']} donations, {report['need_count']} candidate needs).",
        f"Cases with a relevant need: {report['runs'][0]['metrics']['positive_queries']}; cases with no valid match: {report['runs'][0]['metrics']['no_match_queries']}.",
        f"Label review status: **{report['review_status']}**. Minimum application score: {report['min_score']}.",
        "", "These are exploratory results on synthetic examples."
        + (" Draft labels require human review." if report["review_status"] == "draft" else " Labels are marked reviewed."),
        "", f"| Mode | Precision@1 | Precision@{k} | Recall@{k} | MRR@{k} | No-match false positives |",
        "| --- | ---: | ---: | ---: | ---: | ---: |",
    ]
    keys = ["precision_at_1", "precision_at_k", "recall_at_k", "mrr_at_k", "no_match_false_positive_rate"]
    for run in report["runs"]:
        values = [f"{run['metrics'][key]:.1%}" if run["metrics"][key] is not None else "n/a" for key in keys]
        lines.append(f"| {run['mode']} | " + " | ".join(values) + " |")
    lines.extend([
        "", f"Precision@{k} divides relevant recommendations by {k}, even when fewer results are returned.",
        f"With one relevant candidate, the highest possible Precision@{k} is {1 / k:.0%}; use Recall and Precision@1 alongside it.",
        "Metrics use queries with relevant candidates. Cases with no valid match are measured separately.",
        "Ties keep dataset order, matching the application's stable score sort.",
        "", "## Predictions", "", "| Donation | Expected need IDs | "
        + " | ".join(run["mode"] + " first result" for run in report["runs"]) + " |",
        "| --- | --- | " + " | ".join("---" for _ in report["runs"]) + " |",
    ])
    for index, case in enumerate(report["runs"][0]["results"]):
        cells = [case["title"], ", ".join(case["relevant_need_ids"]) or "no match"]
        for run in report["runs"]:
            matches = run["results"][index]["matches"]
            cells.append(matches[0]["need_id"] if matches else "no match")
        lines.append("| " + " | ".join(value.replace("|", "\\|") for value in cells) + " |")
    (directory / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Evaluate donation matching without reading or writing application data.")
    parser.add_argument("--dataset", type=Path, default=BACKEND_DIR / "evaluation" / "matching_cases.json")
    parser.add_argument("--output", type=Path, default=BACKEND_DIR / "evaluation" / "reports")
    parser.add_argument("--modes", nargs="+", choices=["lexical", "full", "onnx", "current"], default=["lexical", "current"])
    parser.add_argument("--k", type=int, default=5)
    parser.add_argument("--min-score", type=float, default=58)
    parser.add_argument("--full-model", default=os.getenv("EMBEDDING_MODEL_NAME", MODEL_NAME))
    parser.add_argument("--onnx-model", type=Path, default=Path(os.getenv("EMBEDDING_MODEL_NAME", str(BACKEND_DIR / ".models" / "donation-matching"))))
    parser.add_argument("--download-models", action="store_true")
    args = parser.parse_args()
    if args.k < 1 or not 0 <= args.min_score <= 100:
        parser.error("k must be positive and min-score must be between 0 and 100")

    dataset = load_dataset(args.dataset)
    current = "onnx" if os.getenv("EMBEDDING_BACKEND") == "onnx" else "full"
    modes = list(dict.fromkeys(current if mode == "current" else mode for mode in args.modes))
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"
    sys.path.insert(0, str(BACKEND_DIR / "app"))
    runs = []
    for mode in modes:
        print(f"Evaluating {mode}...", flush=True)
        runs.append(evaluate_mode(mode, dataset, args))

    report = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "dataset_name": args.dataset.name, "dataset_sha256": hashlib.sha256(args.dataset.read_bytes()).hexdigest(),
        "review_status": dataset["review_status"], "case_count": len(dataset["cases"]),
        "need_count": len(dataset["needs"]), "k": args.k, "min_score": args.min_score,
        "model": MODEL_NAME, "model_revision": MODEL_REVISION, "runs": runs,
    }
    write_report(report, args.output)
    for run in runs:
        metrics = run["metrics"]
        precision = f"{metrics['precision_at_1']:.1%}" if metrics["precision_at_1"] is not None else "n/a"
        recall = f"{metrics['recall_at_k']:.1%}" if metrics["recall_at_k"] is not None else "n/a"
        print(f"{run['mode']}: Precision@1={precision}, Recall@{args.k}={recall}")
    print(f"Label status: {dataset['review_status']}. Report: {args.output / 'report.md'}")


if __name__ == "__main__":
    main()
