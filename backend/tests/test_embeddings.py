import pytest
from app.rag.embeddings import HuggingFaceEmbeddingProvider


def test_huggingface_embeddings():
    provider = HuggingFaceEmbeddingProvider()
    query_vec = provider.embed_query("What is the refund policy?")
    
    assert isinstance(query_vec, list)
    assert len(query_vec) > 0
    
    doc_vecs = provider.embed_documents(["Refund policy statement 1", "Refund policy statement 2"])
    assert len(doc_vecs) == 2
    assert len(doc_vecs[0]) == len(query_vec)
