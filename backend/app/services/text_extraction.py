from io import BytesIO
from pathlib import Path

from pypdf import PdfReader


SUPPORTED_MEMORY_EXTENSIONS = {".txt", ".pdf"}


def is_supported_memory_file(file_name: str) -> bool:
    return Path(file_name).suffix.lower() in SUPPORTED_MEMORY_EXTENSIONS


def extract_text_from_upload(file_name: str, content_bytes: bytes) -> str:
    extension = Path(file_name).suffix.lower()

    if extension == ".txt":
        text = content_bytes.decode("utf-8", errors="ignore")
    elif extension == ".pdf":
        reader = PdfReader(BytesIO(content_bytes))
        page_text = "\n".join((page.extract_text() or "") for page in reader.pages).strip()
        metadata_title = (reader.metadata.title or "").strip() if reader.metadata else ""
        text = page_text or metadata_title
    else:
        raise ValueError("Only PDF and TXT files are supported")

    normalized_text = text.strip()
    if not normalized_text:
        raise ValueError("Uploaded file contains no extractable text")

    return normalized_text
