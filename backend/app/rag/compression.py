from typing import List, Dict, Any, Tuple
import re

class ContextCompressor:
    def __init__(self, similarity_threshold: float = 0.85):
        self.similarity_threshold = similarity_threshold

    def compress_and_cite(self, chunks: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Deduplicates chunks, filters irrelevant noise, and assigns citation tags [S1], [S2], etc.
        Returns:
        (compressed_chunks_with_citations, citation_metadata_list)
        """
        if not chunks:
            return [], []

        unique_chunks = []
        seen_texts = []

        for chunk in chunks:
            content = chunk.get("content", "").strip()
            if not content:
                continue

            # Check duplicate against existing
            is_dup = False
            for seen in seen_texts:
                if self._jaccard_similarity(content, seen) > self.similarity_threshold:
                    is_dup = True
                    break

            if not is_dup:
                seen_texts.append(content)
                unique_chunks.append(chunk)

        # Assign citation identifiers [S1], [S2], ...
        compressed_context = []
        citations = []

        for idx, chunk in enumerate(unique_chunks):
            label = f"[S{idx + 1}]"
            chunk_copy = chunk.copy()
            chunk_copy["citation_label"] = label
            
            meta = chunk_copy.get("metadata", {})
            source = meta.get("source", "Document")
            page = meta.get("page_number", 1)
            section = meta.get("section", "")

            chunk_content = chunk_copy.get("content", "").strip()
            citation_entry = {
                "chunk_id": chunk_copy.get("id", f"chunk-{idx}"),
                "citation_label": label,
                "excerpt": chunk_content[:300] + "..." if len(chunk_content) > 300 else chunk_content,
                "document_name": source,
                "page_number": page,
                "section": section
            }
            
            compressed_context.append(chunk_copy)
            citations.append(citation_entry)

        return compressed_context, citations

    def _jaccard_similarity(self, str1: str, str2: str) -> float:
        w1 = set(re.findall(r'\w+', str1.lower()))
        w2 = set(re.findall(r'\w+', str2.lower()))
        if not w1 or not w2:
            return 0.0
        intersection = w1.intersection(w2)
        union = w1.union(w2)
        return len(intersection) / len(union)
