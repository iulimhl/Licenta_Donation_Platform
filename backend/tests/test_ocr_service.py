import json

import pytest
import requests

from services import ocr_service as ocr


@pytest.fixture
def ocr_provider(monkeypatch):
    monkeypatch.setattr(ocr, "OCR_SPACE_API_KEY", "test-ocr-key")

    def respond(payload, status=200):
        response = requests.Response()
        response.status_code = status
        response._content = json.dumps(payload).encode()
        monkeypatch.setattr(ocr.requests, "post", lambda url, **kwargs: response)

    return respond


def test_document_pipeline_extracts_organization_fields(tmp_path, ocr_provider):
    document = tmp_path / "certificate.pdf"
    document.write_bytes(b"%PDF-test")
    text = (
        "Certificat de inregistrare fiscala\n"
        "Denumire: Asociatia Sprijin Copii\nCIF: 12345678\n"
        "Domiciliul fiscal: Iasi, Strada Scolii 10\n"
    )
    ocr_provider({"ParsedResults": [{"ParsedText": text}]})

    result = ocr.extract_data_from_file(str(document), "certificate.pdf")

    assert result["name"] == "Asociatia Sprijin Copii"
    assert result["cif"] == "12345678"
    assert result["location"] == "Iasi, Strada Scolii 10"
    assert result["document_type_guess"] == "fiscal_registration_certificate"


def test_document_without_organization_fields_returns_no_values(tmp_path, ocr_provider):
    document = tmp_path / "empty.pdf"
    document.write_bytes(b"%PDF-test")
    ocr_provider({"ParsedResults": []})

    result = ocr.extract_data_from_file(str(document), "empty.pdf")

    assert result["name"] is None
    assert result["cif"] is None
    assert result["location"] is None


def test_ocr_provider_error_is_propagated(tmp_path, ocr_provider):
    document = tmp_path / "certificate.pdf"
    document.write_bytes(b"%PDF-test")
    ocr_provider({}, status=503)

    with pytest.raises(requests.HTTPError):
        ocr.extract_text_from_file(str(document), "certificate.pdf")


def test_ocr_requires_api_key(monkeypatch):
    monkeypatch.setattr(ocr, "OCR_SPACE_API_KEY", None)

    with pytest.raises(ValueError, match="missing"):
        ocr.extract_text_from_file("certificate.pdf", "certificate.pdf")
