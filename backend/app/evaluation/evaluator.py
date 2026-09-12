import time
from typing import List, Dict, Any
from app.rag.embeddings import get_embedding_provider


class RAGEvaluator:
    def __init__(self):
        self.embedding_provider = get_embedding_provider()

    def evaluate_retrieval(
        self,
        retrieved_chunks: List[Dict[str, Any]],
        expected_doc: str
    ) -> Dict[str, float]:
        if not retrieved_chunks:
            return {"precision": 0.0, "recall": 0.0}

        relevant_retrieved = sum(
            1 for c in retrieved_chunks
            if expected_doc.lower() in str(c.get("metadata", {}).get("source", "")).lower()
        )

        precision = relevant_retrieved / len(retrieved_chunks)
        recall = 1.0 if relevant_retrieved > 0 else 0.0

        return {
            "precision": round(precision, 4),
            "recall": round(recall, 4)
        }

    def evaluate_faithfulness_and_similarity(
        self,
        answer: str,
        ground_truth: str
    ) -> float:
        if not answer or not ground_truth:
            return 0.0

        v1 = self.embedding_provider.embed_query(answer)
        v2 = self.embedding_provider.embed_query(ground_truth)

        dot = sum(a * b for a, b in zip(v1, v2))
        return round(max(0.0, min(1.0, dot)), 4)

    def evaluate_citations(self, answer: str, citations: List[Dict[str, Any]]) -> Dict[str, Any]:
        has_citations = any(f"[S{i}]" in answer for i in range(1, 10))
        citation_count = len(citations)
        return {
            "has_citations": has_citations,
            "citation_count": citation_count,
            "correctness": 1.0 if has_citations and citation_count > 0 else 0.5 if not citations else 0.0
        }
