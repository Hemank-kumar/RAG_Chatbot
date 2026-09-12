from typing import List, Dict, Any
from app.rag.embeddings import get_embedding_provider
from app.utils.logger import logger


class Reranker:
    def __init__(self):
        self.embedding_provider = get_embedding_provider()

    def rerank(self, query: str, chunks: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Reranks candidate chunks based on cosine similarity with the query vector.
        """
        if not chunks:
            return []

        query_vec = self.embedding_provider.embed_query(query)
        chunk_texts = [c["content"] for c in chunks]
        chunk_vecs = self.embedding_provider.embed_documents(chunk_texts)

        scored_chunks = []
        for idx, chunk in enumerate(chunks):
            c_vec = chunk_vecs[idx] if idx < len(chunk_vecs) else None
            if c_vec and len(c_vec) == len(query_vec):
                dot_product = sum(q * c for q, c in zip(query_vec, c_vec))
                # Normalized vectors -> dot product is cosine similarity
                similarity = max(0.0, min(1.0, dot_product))
            else:
                similarity = chunk.get("score", 0.5)

            chunk_copy = chunk.copy()
            chunk_copy["rerank_score"] = round(float(similarity), 4)
            scored_chunks.append(chunk_copy)

        # Sort descending by rerank score
        scored_chunks.sort(key=lambda x: x["rerank_score"], reverse=True)
        return scored_chunks[:top_k]
