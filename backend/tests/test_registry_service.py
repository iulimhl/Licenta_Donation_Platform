import json

import pandas as pd
import pytest

from services import local_registry_service as registry


@pytest.fixture(params=["excel", "compact"])
def registry_frame(tmp_path, monkeypatch, request):
    path = tmp_path / "organizations.xlsx"
    pd.DataFrame({
        "Denumire furnizor": ["Asociatia Sprijin Copii"],
        "CUI/CIF": [12345678],
    }).to_excel(path, index=False, startrow=1)
    monkeypatch.setattr(registry, "semantic_name_score", lambda first, second: None)
    frame = registry.safe_read_excel_auto_header(path)
    if request.param == "compact":
        cache_path = tmp_path / "registries.json"
        cache_path.write_text(json.dumps({"furnizori_acreditati": frame.to_dict("records")}), encoding="utf-8")
        monkeypatch.setenv("REGISTRY_CACHE_PATH", str(cache_path))
        return registry.load_registry_files()["furnizori_acreditati"]
    return frame


def test_find_organization_by_cif_in_excel_registry(registry_frame):
    result = registry.search_social_registry(
        registry_frame, "Asociatia Sprijin Copii", "RO12345678"
    )

    assert result["matched_name"] == "Asociatia Sprijin Copii"
    assert str(result["matched_cif"]) == "12345678"
    assert result["score"] == 100


def test_unrelated_organization_is_not_found(registry_frame):
    result = registry.search_social_registry(
        registry_frame, "Complet Necunoscut", "99999999"
    )

    assert result is None
