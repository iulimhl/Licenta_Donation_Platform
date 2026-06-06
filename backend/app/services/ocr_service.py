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

    blacklist = {
        "romania",
        "anaf",
        "ministerul finantelor publice",
        "ministerul finanțelor publice",
        "agentia nationala de administrare fiscala",
        "agenția națională de administrare fiscală",
        "certificat de inregistrare fiscala",
        "certificat de înregistrare fiscală",
    }

    def valid_name(value: str) -> bool:
        value_norm = normalize_spaces(value).lower()
        if not value_norm:
            return False
        if value_norm in blacklist:
            return False
        if len(value_norm) < 3:
            return False
        return True

    label_patterns = [
        "denumire/nume si prenume",
        "denumire/nume și prenume",
        "denumire / nume si prenume",
        "denumire / nume și prenume",
        "denumire",
    ]

    for i, line in enumerate(lines[:30]):
        lower_line = line.lower()

        if any(label in lower_line for label in label_patterns):
            match = re.search(
                r"(denumire(?:/nume si prenume|/nume și prenume)?)[\s:]+(.+)",
                line,
                flags=re.IGNORECASE,
            )
            if match:
                candidate = normalize_spaces(match.group(2))
                if valid_name(candidate):
                    return candidate

            for j in range(i + 1, min(i + 4, len(lines))):
                candidate = normalize_spaces(lines[j])
                if valid_name(candidate):
                    return candidate

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
        "s.r.l",
        "srl",
        "s.a",
        "sa",
        "s.c",
        "sc",
    ]

    for line in lines[:30]:
        lower_line = line.lower()
        if any(keyword in lower_line for keyword in keywords):
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
        "ministerul finanțelor publice",
        "certificat de inregistrare fiscala",
        "certificat de înregistrare fiscală",
    }

    def valid_address(value: str) -> bool:
        value_norm = normalize_spaces(value).lower()
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
        lower_line = line.lower()

        if any(label in lower_line for label in label_patterns):
            match = re.search(
                r"(domiciliul fiscal|sediul social|adresa)[\s:]+(.+)",
                line,
                flags=re.IGNORECASE,
            )
            if match:
                candidate = normalize_spaces(match.group(2))
                if valid_address(candidate) and "seria" not in candidate.lower():
                    return candidate

            collected = []
            for j in range(i + 1, min(i + 4, len(lines))):
                candidate = normalize_spaces(lines[j])
                if not valid_address(candidate):
                    continue
                if "seria" in candidate.lower():
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
        "județ",
        "sector",
        "municipiul",
        "oras",
        "oraș",
        "comuna",
        "sat",
        "nr.",
        "bloc",
        "sc.",
        "ap.",
    ]

    for line in lines:
        lower_line = line.lower()

        if "seria" in lower_line:
            continue

        if any(keyword in lower_line for keyword in address_keywords):
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