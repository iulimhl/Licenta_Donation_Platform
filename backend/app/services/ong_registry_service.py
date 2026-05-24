import unicodedata
from difflib import SequenceMatcher

def normalize_text(value: str | None) -> str:
    if not value:
        return ""

    value = value.strip().lower()

    value = unicodedata.normalize("NFD", value)
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")

    value = "".join(value.split())
    return value

def similarity_score(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio() * 100

def search_ong_registry(organization_name: str, cif: str):
    mock_registry = [
        {
            "organization_name": "ONG Suceava",
            "cif": "12345678"
        },
        {
            "organization_name": "Azil de batrani Suceava",
            "cif": "87654321"
        },
        {
            "organization_name": "Orfelinat Iasi",
            "cif": "22223333"
        },
        {
            "organization_name": "Azil de batrani Iasi",
            "cif": "11112222"
        },
    ]

    normalized_name = normalize_text(organization_name)
    normalized_cif = normalize_text(cif)

    best_match = None
    best_score = 0.0

    for item in mock_registry:
        item_name = normalize_text(item["organization_name"])
        item_cif = normalize_text(item["cif"])

        if normalized_cif and normalized_cif == item_cif:
            name_score = similarity_score(normalized_name, item_name)

            if name_score >= 95:
                score = 100.0
            elif name_score >= 75:
                score = 85.0
            else:
                score = 65.0

            best_match = {
                "found": True,
                "matched_name": item["organization_name"],
                "matched_cif": item["cif"],
                "score": score,
                "source": "mock_registry"
            }
            best_score = score
            break

    if best_match:
        return best_match

    return {
        "found": False,
        "matched_name": None,
        "matched_cif": None,
        "score": 0.0,
        "source": "mock_registry"
    }