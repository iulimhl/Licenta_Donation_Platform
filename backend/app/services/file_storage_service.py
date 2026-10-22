import mimetypes
import os

from models.uploaded_file import UploadedFile


def uses_database_uploads():
    return os.getenv("UPLOAD_STORAGE", "local") == "database"


def save_upload(db, relative_url, local_path, content):
    if uses_database_uploads():
        db.add(UploadedFile(
            path=relative_url,
            content=content,
            content_type=mimetypes.guess_type(relative_url)[0] or "application/octet-stream",
        ))
    else:
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(content)
