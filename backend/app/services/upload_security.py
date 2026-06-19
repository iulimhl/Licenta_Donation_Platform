import os

from fastapi import HTTPException, UploadFile

MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", str(5 * 1024 * 1024)))

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_DOCUMENT_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".pdf"}
ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp"}
ALLOWED_DOCUMENT_TYPES = ALLOWED_IMAGE_TYPES | {"application/pdf"}


async def read_limited_upload(
    file: UploadFile,
    allowed_extensions: set[str],
    allowed_content_types: set[str],
) -> tuple[bytes, str]:
    filename = file.filename or ""
    extension = os.path.splitext(filename)[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    if file.content_type and file.content_type not in allowed_content_types:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    content = await file.read()

    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File is too large")

    if not content:
        raise HTTPException(status_code=400, detail="File is empty")

    return content, extension
