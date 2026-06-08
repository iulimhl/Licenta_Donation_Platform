import os
import re
import threading
import unicodedata
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
REGISTRIES_DIR = os.path.join(BASE_DIR, "data", "registries")

ONG_DIR = os.path.join(REGISTRIES_DIR, "registrul_ong")
SOCIAL_DIR = os.path.join(REGISTRIES_DIR, "servicii_sociale")

_REGISTRY_CACHE = None
_CACHE_LOCK = threading.Lock()


def normalize_text(value):
    if value is None:
        return ""
    value = str(value).strip().lower()
    value = unicodedata.normalize("NFD", value)
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    value = re.sub(r"[^a-z0-9\s]", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value


def normalize_cif(value):
    if value is None:
        return ""
    value = str(value).strip().lower()
    value = value.replace("ro", "")
    value = re.sub(r"[^0-9]", "", value)
    return value


def find_header_row(path):
    try:
        preview = pd.read_excel(path, header=None, nrows=15)
    except Exception:
        return None

    header_keywords_sets = [
        ["denumire"],
        ["denumire furnizor", "cui cif"],
        ["denumire furnizor", "cui furnizor"],
    ]

    for row_idx in range(len(preview)):
        row_values = [normalize_text(cell) for cell in preview.iloc[row_idx].tolist()]

        for keyword_set in header_keywords_sets:
            if all(any(keyword == cell for cell in row_values) for keyword in keyword_set):
                return row_idx

    return None


def safe_read_excel_auto_header(path):
    try:
        header_row = find_header_row(path)
        if header_row is None:
            return pd.DataFrame()

        df = pd.read_excel(path, header=header_row)
        df.columns = [str(col).strip() for col in df.columns]
        return df
    except Exception:
        return pd.DataFrame()


def load_registry_files():
    return {
        "asociatii": safe_read_excel_auto_header(os.path.join(ONG_DIR, "asociatii.xlsx")),
        "fundatii": safe_read_excel_auto_header(os.path.join(ONG_DIR, "fundatii.xlsx")),
        "federatii": safe_read_excel_auto_header(os.path.join(ONG_DIR, "federatii.xlsx")),
        "uniuni": safe_read_excel_auto_header(os.path.join(ONG_DIR, "uniuni.xlsx")),
        "furnizori_acreditati": safe_read_excel_auto_header(os.path.join(SOCIAL_DIR, "furnizori_acreditati.xlsx")),
        "servicii_licentiate": safe_read_excel_auto_header(os.path.join(SOCIAL_DIR, "servicii_licentiate.xlsx")),
    }


def get_cached_registries():
    global _REGISTRY_CACHE

    if _REGISTRY_CACHE is None:
        with _CACHE_LOCK:
            if _REGISTRY_CACHE is None:
                _REGISTRY_CACHE = load_registry_files()

    return _REGISTRY_CACHE


def warm_registry_cache():
    get_cached_registries()


def score_name_match(input_name, row_name):
    input_name = normalize_text(input_name)
    row_name = normalize_text(row_name)

    if not input_name or not row_name:
        return 0

    if input_name == row_name:
        return 100

    if input_name in row_name or row_name in input_name:
        return 70

    input_words = set(input_name.split())
    row_words = set(row_name.split())
    overlap = len(input_words & row_words)

    if overlap >= 4:
        return 60
    if overlap >= 3:
        return 50
    if overlap >= 2:
        return 35
    if overlap >= 1:
        return 15

    return 0


def search_ong_registry(df, name): #asociatii, federatii, uniuni, fundatii
    if df.empty:
        return None

    name_col = None
    for col in df.columns:
        if normalize_text(col) == "denumire":
            name_col = col
            break

    if not name_col:
        return None

    normalized_name = normalize_text(name)
    best = None
    best_score = 0

    for _, row in df.iterrows():
        row_name = row.get(name_col)
        score = score_name_match(normalized_name, row_name)

        if score == 100:
            return {
                "matched_name": row_name,
                "matched_cif": None,
                "score": 100,
            }

        if score > best_score:
            best_score = score
            best = {
                "matched_name": row_name,
                "matched_cif": None,
                "score": score,
            }

    return best if best_score > 0 else None


def search_social_registry(df, name, cif):
    if df.empty:
        return None

    name_col = None
    cif_col = None

    for col in df.columns:
        col_norm = normalize_text(col)

        if col_norm == "denumire furnizor":
            name_col = col

        if col_norm in ["cui cif", "cui furnizor"]:
            cif_col = col

    if not name_col:
        return None

    normalized_name = normalize_text(name)
    normalized_cif = normalize_cif(cif)

    best = None
    best_score = 0

    for _, row in df.iterrows():
        row_name = row.get(name_col)
        row_cif = row.get(cif_col) if cif_col else None

        row_name_score = score_name_match(normalized_name, row_name)
        row_cif_normalized = normalize_cif(row_cif)

        if normalized_cif and row_cif_normalized == normalized_cif:
            if row_name_score == 100:
                return {
                    "matched_name": row_name,
                    "matched_cif": row_cif,
                    "score": 100,
                }

            score = 30
            if row_name_score == 70:
                score += 50
            elif row_name_score >= 35:
                score += 30
            elif row_name_score > 0:
                score += 10
        else:
            score = 0
            if row_name_score == 100:
                score += 70
            elif row_name_score == 70:
                score += 50
            elif row_name_score >= 35:
                score += 30
            elif row_name_score > 0:
                score += 10

        if score > best_score:
            best_score = score
            best = {
                "matched_name": row_name,
                "matched_cif": row_cif,
                "score": score,
            }

    return best if best_score > 0 else None


def search_all_local_registries(name, cif):
    registries = get_cached_registries()

    social_sources = [
        ("social_furnizori_acreditati", search_social_registry(registries["furnizori_acreditati"], name, cif)),
        ("social_servicii_licentiate", search_social_registry(registries["servicii_licentiate"], name, cif)),
    ]

    best_source = None
    best_result = None

    for source_name, result in social_sources:
        if result and (best_result is None or result["score"] > best_result["score"]):
            best_source = source_name
            best_result = result

    if best_result and best_result["score"] == 100:
        return {
            "found": True,
            "matched_name": str(best_result["matched_name"]) if best_result["matched_name"] is not None else None,
            "matched_cif": str(best_result["matched_cif"]) if best_result["matched_cif"] is not None else None,
            "score": best_result["score"],
            "source": best_source,
        }

    ong_sources = [
        ("registrul_ong_asociatii", search_ong_registry(registries["asociatii"], name)),
        ("registrul_ong_fundatii", search_ong_registry(registries["fundatii"], name)),
        ("registrul_ong_federatii", search_ong_registry(registries["federatii"], name)),
        ("registrul_ong_uniuni", search_ong_registry(registries["uniuni"], name)),
    ]

    for source_name, result in ong_sources:
        if result and (best_result is None or result["score"] > best_result["score"]):
            best_source = source_name
            best_result = result

    if not best_result:
        return {
            "found": False,
            "matched_name": None,
            "matched_cif": None,
            "score": 0,
            "source": None,
        }

    return {
        "found": True,
        "matched_name": str(best_result["matched_name"]) if best_result["matched_name"] is not None else None,
        "matched_cif": str(best_result["matched_cif"]) if best_result["matched_cif"] is not None else None,
        "score": best_result["score"],
        "source": best_source,
    }
