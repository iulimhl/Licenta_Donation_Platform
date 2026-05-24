import os
import re
import requests
from dotenv import load_dotenv

load_dotenv()

OCR_SPACE_API_KEY = os.getenv("OCR_SPACE_API_KEY")


def extract_text_from_file(file_path: str, filename: str) -> str:
    if not OCR_SPACE_API_KEY:
        raise ValueError("OCR_SPACE_API_KEY is missing.")

    with open(file_path, "rb") as f:
        response = requests.post(
            "https://api.ocr.space/parse/image",
            files={"filename": (filename, f)},
            data={
                "apikey": OCR_SPACE_API_KEY,
                "language": "eng",
                "isOverlayRequired": False,
                "OCREngine": 2,
            },
            timeout=60,
        )

    response.raise_for_status()
    data = response.json()

    if data.get("IsErroredOnProcessing"):
        error_messages = data.get("ErrorMessage", ["Unknown OCR error"])
        raise ValueError(", ".join(error_messages))

    parsed_results = data.get("ParsedResults", [])
    if not parsed_results:
        return ""

    return "\n".join(result.get("ParsedText", "") for result in parsed_results)


def normalize_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def detect_document_type(text: str) -> str:
    lower = text.lower()

    if "certificat de inregistrare fiscala" in lower or "certificat de înregistrare fiscală" in lower:
        return "fiscal_registration_certificate"

    if "certificat de atestare fiscala" in lower or "certificat de atestare fiscală" in lower:
        return "fiscal_attestation_certificate"

    if "oficiul national al registrului comertului" in lower or "oficiul național al registrului comerțului" in lower:
        return "trade_registry_certificate"

    return "unknown"


def extract_cif(text: str) -> str | None:
    lines = [normalize_spaces(line) for line in text.splitlines() if line.strip()]

    for i, line in enumerate(lines):
        lower_line = line.lower()

        if (
            "codul de inregistrare fiscala" in lower_line
            or "codul de înregistrare fiscală" in lower_line
            or "c.i.f" in lower_line
            or "cif" in lower_line
        ):
            numbers_found = []

            for j in range(i, min(i + 4, len(lines))):
                found = re.findall(r"\b([0-9]{6,12})\b", lines[j])
                numbers_found.extend(found)

            if numbers_found:
                return numbers_found[0]

    all_numbers = re.findall(r"\b([0-9]{6,12})\b", text)
    return all_numbers[0] if all_numbers else None


def extract_organization_name(text: str) -> str | None:
    lines = [normalize_spaces(line) for line in text.splitlines() if line.strip()]

    explicit_patterns = [
        r"denumire[:\s]+(.+)",
        r"denumire/nume si prenume[:\s]+(.+)",
        r"denumire/nume și prenume[:\s]+(.+)",
    ]

    for line in lines[:25]:
        for pattern in explicit_patterns:
            match = re.search(pattern, line, flags=re.IGNORECASE)
            if match:
                value = normalize_spaces(match.group(1))
                if value:
                    return value

    keywords = [
        "asociatia",
        "asociația",
        "fundatia",
        "fundația",
        "federatia",
        "federația",
        "ong",
        "azil",
        "orfelinat",
        "camin",
        "cămin",
        "centru",
    ]

    for line in lines[:25]:
        lower_line = line.lower()
        if any(keyword in lower_line for keyword in keywords):
            return line

    return lines[0] if lines else None


def extract_address(text: str) -> str | None:
    lines = [normalize_spaces(line) for line in text.splitlines() if line.strip()]

    explicit_patterns = [
        r"domiciliul fiscal[:\s]+(.+)",
        r"sediul social[:\s]+(.+)",
        r"adresa[:\s]+(.+)",
    ]

    for line in lines[:30]:
        for pattern in explicit_patterns:
            match = re.search(pattern, line, flags=re.IGNORECASE)
            if match:
                value = normalize_spaces(match.group(1))
                if value and "seria" not in value.lower():
                    return value

    address_keywords = [
        "str.",
        "strada",
        "bulevard",
        "bd.",
        "calea",
        "jud.",
        "judet",
        "județ",
        "sector",
        "localitatea",
        "municipiul",
        "oras",
        "oraș",
        "comuna",
        "sat",
    ]

    for line in lines:
        lower_line = line.lower()

        if "seria" in lower_line:
            continue

        if any(keyword in lower_line for keyword in address_keywords):
            return line

    return None


def extract_data_from_file(file_path: str, filename: str):
    raw_text = extract_text_from_file(file_path, filename)

    return {
        "organization_name": extract_organization_name(raw_text),
        "cif": extract_cif(raw_text),
        "location": extract_address(raw_text),
        "document_type_guess": detect_document_type(raw_text),
        "raw_text": raw_text,
    }