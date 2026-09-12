import pytest
from app.rag.chunking import StructureAwareChunker


def test_structure_aware_chunker():
    pages = [
        {
            "page_number": 1,
            "section": "Refund Policy",
            "text": "Customers can request a refund within 30 days of purchase.\n\nAll refunds will be processed via the original payment method within 5-10 business days."
        }
    ]
    chunker = StructureAwareChunker(chunk_size=100, chunk_overlap=20)
    chunks = chunker.chunk_document(
        pages=pages,
        document_id="doc-123",
        filename="policy.pdf",
        knowledge_base_id="kb-123",
        workspace_id="ws-123"
    )

    assert len(chunks) >= 1
    assert chunks[0]["metadata"]["document_id"] == "doc-123"
    assert chunks[0]["metadata"]["page_number"] == 1
    assert chunks[0]["metadata"]["section"] == "Refund Policy"
    assert "30 days" in chunks[0]["content"]
