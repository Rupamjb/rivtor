from io import BytesIO

from pypdf import PdfWriter

from backend.app.services.chunking import chunk_text
from backend.app.services.text_extraction import extract_text_from_upload


def _build_pdf_bytes(text: str) -> bytes:
    writer = PdfWriter()
    writer.add_blank_page(width=300, height=300)
    writer.add_metadata({"/Title": text})
    buffer = BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


def test_extract_text_from_txt_upload() -> None:
    text = extract_text_from_upload("founder-notes.txt", b"FounderOS weekly update")
    assert text == "FounderOS weekly update"


def test_extract_text_raises_for_unsupported_extension() -> None:
    try:
        extract_text_from_upload("audio.mp3", b"bytes")
    except ValueError as exc:
        assert "Only PDF and TXT files are supported" in str(exc)
    else:
        raise AssertionError("Expected unsupported extension to raise ValueError")


def test_extract_text_reads_pdf_metadata_title_when_page_text_missing() -> None:
    pdf_bytes = _build_pdf_bytes("Founder roadmap")
    text = extract_text_from_upload("roadmap.pdf", pdf_bytes)
    assert "Founder roadmap" in text


def test_chunk_text_splits_long_input_with_overlap() -> None:
    input_text = "a" * 1200
    chunks = chunk_text(input_text, chunk_size=500, overlap=100)

    assert len(chunks) == 3
    assert len(chunks[0]) == 500
    assert chunks[0][-100:] == chunks[1][:100]


def test_chunk_text_rejects_invalid_overlap() -> None:
    try:
        chunk_text("hello", chunk_size=100, overlap=100)
    except ValueError as exc:
        assert "overlap must be less than chunk_size" in str(exc)
    else:
        raise AssertionError("Expected invalid overlap to raise ValueError")
