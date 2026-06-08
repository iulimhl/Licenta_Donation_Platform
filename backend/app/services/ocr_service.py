import os
import re
import unicodedata

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


def normalize_for_search(text: str) -> str:
    value = unicodedata.normalize("NFD", text)
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    return normalize_spaces(value).lower()


def detect_document_type(text: str) -> str:
    normalized = normalize_for_search(text)

    if "certificat de inregistrare fiscala" in normalized:
        return "fiscal_registration_certificate"

    if "certificat de atestare fiscala" in normalized:
        return "fiscal_attestation_certificate"

    if "oficiul national al registrului comertului" in normalized:
        return "trade_registry_certificate"

    return "unknown"


def extract_cif(text: str) -> str | None:
    lines = [normalize_spaces(line) for line in text.splitlines() if line.strip()]
    label_regex = re.compile(
        r"(codul\s+de\s+inregistrare\s+fiscala(?:\s*\(?c\.?\s*i\.?\s*f\.?\)?)?|c\.?\s*i\.?\s*f\.?|cif)",
        flags=re.IGNORECASE,
    )

    for i, line in enumerate(lines):
        search_line = normalize_for_search(line)
        label_match = label_regex.search(search_line)

        if not label_match:
            continue

        same_line_tail = line[label_match.end():]
        same_line_numbers = re.findall(r"\b([0-9]{6,12})\b", same_line_tail)
        if same_line_numbers:
            return same_line_numbers[0]

        for j in range(i + 1, min(i + 4, len(lines))):
            candidate_line = lines[j]
            candidate_search_line = normalize_for_search(candidate_line)
            if "seria" in candidate_search_line and "codul de inregistrare fiscala" not in candidate_search_line:
                continue

            found = re.findall(r"\b([0-9]{6,12})\b", candidate_line)
            if found:
                return found[0]

    fallback_text = "\n".join(
        line for line in lines if "seria" not in normalize_for_search(line)
    )
    all_numbers = re.findall(r"\b([0-9]{6,12})\b", fallback_text)
    return all_numbers[0] if all_numbers else None


def extract_organization_name(text: str) -> str | None:
    lines = [normalize_spaces(line) for line in text.splitlines() if line.strip()]

    blacklist = {
        "romania",
        "anaf",
        "ministerul finantelor publice",
        "agentia nationala de administrare fiscala",
        "certificat de inregistrare fiscala",
    }

    def valid_name(value: str) -> bool:
        value_norm = normalize_for_search(value)
        if not value_norm:
            return False
        if value_norm in blacklist:
            return False
        if len(value_norm) < 3:
            return False
        return True

    label_patterns = [
        "denumire/nume si prenume",
        "denumire / nume si prenume",
        "denumire",
    ]

    for i, line in enumerate(lines[:30]):
        search_line = normalize_for_search(line)

        if any(label in search_line for label in label_patterns):
            match = re.search(
                r"(denumire(?:/nume si prenume)?)[\s:]+(.+)",
                normalize_for_search(line),
                flags=re.IGNORECASE,
            )
            if match:
                candidate = normalize_spaces(line[-len(match.group(2)):])
                if valid_name(candidate):
                    return candidate

            for j in range(i + 1, min(i + 4, len(lines))):
                candidate = normalize_spaces(lines[j])
                if valid_name(candidate):
                    return candidate

    keywords = [
        "asociatia",
        "fundatia",
        "federatia",
        "ong",
        "azil",
        "orfelinat",
        "camin",
        "centru",
        "s.r.l",
        "srl",
        "s.a",
        "sa",
        "s.c",
        "sc",
    ]

    for line in lines[:30]:
        search_line = normalize_for_search(line)
        if any(keyword in search_line for keyword in keywords):
            if valid_name(line):
                return line

    for line in lines[:30]:
        if valid_name(line):
            return line

    return None


def extract_address(text: str) -> str | None:
    lines = [normalize_spaces(line) for line in text.splitlines() if line.strip()]

    blacklist = {
        "romania",
        "anaf",
        "ministerul finantelor publice",
        "certificat de inregistrare fiscala",
    }

    def valid_address(value: str) -> bool:
        value_norm = normalize_for_search(value)
        if not value_norm:
            return False
        if value_norm in blacklist:
            return False
        if len(value_norm) < 6:
            return False
        return True

    label_patterns = [
        "domiciliul fiscal",
        "sediul social",
        "adresa",
    ]

    for i, line in enumerate(lines[:35]):
        search_line = normalize_for_search(line)

        if any(label in search_line for label in label_patterns):
            match = re.search(
                r"(domiciliul fiscal|sediul social|adresa)[\s:]+(.+)",
                search_line,
                flags=re.IGNORECASE,
            )
            if match:
                candidate = normalize_spaces(line[-len(match.group(2)):])
                if valid_address(candidate) and "seria" not in normalize_for_search(candidate):
                    return candidate

            collected = []
            for j in range(i + 1, min(i + 4, len(lines))):
                candidate = normalize_spaces(lines[j])
                if not valid_address(candidate):
                    continue
                if "seria" in normalize_for_search(candidate):
                    continue
                collected.append(candidate)

            if collected:
                return " ".join(collected)

    address_keywords = [
        "str.",
        "strada",
        "bulevard",
        "bd.",
        "calea",
        "jud.",
        "judet",
        "sector",
        "municipiul",
        "oras",
        "comuna",
        "sat",
        "nr.",
        "bloc",
        "sc.",
        "ap.",
    ]

    for line in lines:
        search_line = normalize_for_search(line)

        if "seria" in search_line:
            continue

        if any(keyword in search_line for keyword in address_keywords):
            if valid_address(line):
                return line

    return None


def extract_data_from_file(file_path: str, filename: str):
    raw_text = extract_text_from_file(file_path, filename)

    return {
        "name": extract_organization_name(raw_text),
        "cif": extract_cif(raw_text),
        "location": extract_address(raw_text),
        "document_type_guess": detect_document_type(raw_text),
        "raw_text": raw_text,
    }
