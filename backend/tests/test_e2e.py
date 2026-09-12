import pytest
from app.agents.state import AgentState
from app.rag.compression import ContextCompressor


def test_end_to_end_context_compression_citation_pipeline():
    chunks = [
        {
            "id": "c1",
            "content": "The refund policy permits returns within 30 days of purchase with receipt.",
            "metadata": {"source": "policy.pdf", "page_number": 1, "section": "Returns"},
            "score": 0.95
        },
        {
            "id": "c2",
            "content": "The refund policy permits returns within 30 days of purchase with receipt.",  # Duplicate
            "metadata": {"source": "policy.pdf", "page_number": 1, "section": "Returns"},
            "score": 0.94
        }
    ]

    compressor = ContextCompressor()
    compressed, citations = compressor.compress_and_cite(chunks)

    assert len(compressed) == 1
    assert len(citations) == 1
    assert citations[0]["citation_label"] == "[S1]"
    assert citations[0]["document_name"] == "policy.pdf"
