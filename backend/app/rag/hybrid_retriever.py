import re
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, or_, and_
from app.db.models import DocumentChunk
from app.rag.embeddings import get_embedding_provider
from app.utils.config import settings
from app.utils.logger import logger


class HybridRetriever:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.embedding_provider = get_embedding_provider()

    async def search(
        self,
        query: str,
        knowledge_base_id: str,
        top_k: int = 10,
        alpha: float = None
    ) -> List[Dict[str, Any]]:
        """
        Executes hybrid retrieval:
        1. Vector search using pgvector cosine distance or Python cosine similarity for SQLite.
        2. Keyword search using Postgres full-text search (tsvector) or ILIKE.
        3. Reciprocal Rank Fusion (RRF) to combine results.
        """
        if alpha is None:
            alpha = settings.HYBRID_ALPHA

        # 1. Vector Search
        query_vector = self.embedding_provider.embed_query(query)
        vector_results = await self._vector_search(query_vector, knowledge_base_id, limit=top_k * 2)

        # 2. Keyword Search
        keyword_results = await self._keyword_search(query, knowledge_base_id, limit=top_k * 2)

        # 3. Reciprocal Rank Fusion (RRF)
        fused_chunks = self._reciprocal_rank_fusion(vector_results, keyword_results, alpha=alpha, k=60)
        
        return fused_chunks[:top_k]

    async def _vector_search(
        self,
        query_vector: List[float],
        knowledge_base_id: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        try:
            # Try PostgreSQL pgvector cosine distance first
            stmt = (
                select(DocumentChunk)
                .where(DocumentChunk.knowledge_base_id == knowledge_base_id)
                .where(DocumentChunk.embedding.isnot(None))
                .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
                .limit(limit)
            )
            res = await self.db.execute(stmt)
            chunks = res.scalars().all()
            
            results = []
            for rank, c in enumerate(chunks):
                results.append({
                    "id": c.id,
                    "document_id": c.document_id,
                    "chunk_index": c.chunk_index,
                    "content": c.content,
                    "metadata": c.metadata_json or {},
                    "rank": rank + 1
                })
            return results
        except Exception:
            # Fallback to Python-calculated Cosine Similarity (for SQLite or non-pgvector engines)
            return await self._fallback_python_vector_search(query_vector, knowledge_base_id, limit)

    async def _fallback_python_vector_search(
        self,
        query_vector: List[float],
        knowledge_base_id: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        stmt = select(DocumentChunk).where(DocumentChunk.knowledge_base_id == knowledge_base_id)
        res = await self.db.execute(stmt)
        chunks = res.scalars().all()

        scored = []
        for c in chunks:
            emb = c.embedding
            if isinstance(emb, list) and len(emb) == len(query_vector):
                dot = sum(q * e for q, e in zip(query_vector, emb))
                sim = max(0.0, min(1.0, dot))
            else:
                sim = 0.5

            scored.append({
                "id": c.id,
                "document_id": c.document_id,
                "chunk_index": c.chunk_index,
                "content": c.content,
                "metadata": c.metadata_json or {},
                "score": sim
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        top_chunks = scored[:limit]
        for rank, item in enumerate(top_chunks):
            item["rank"] = rank + 1
        return top_chunks

    async def _keyword_search(
        self,
        query: str,
        knowledge_base_id: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        try:
            clean_query = " | ".join([w for w in query.replace("'", "").split() if len(w) > 2])
            if not clean_query:
                clean_query = query

            stmt = (
                select(DocumentChunk)
                .where(DocumentChunk.knowledge_base_id == knowledge_base_id)
                .where(func.to_tsvector('english', DocumentChunk.content).op('@@')(func.to_tsquery('english', clean_query)))
                .limit(limit)
            )
            res = await self.db.execute(stmt)
            chunks = res.scalars().all()

            results = []
            for rank, c in enumerate(chunks):
                results.append({
                    "id": c.id,
                    "document_id": c.document_id,
                    "chunk_index": c.chunk_index,
                    "content": c.content,
                    "metadata": c.metadata_json or {},
                    "rank": rank + 1
                })
            return results
        except Exception:
            # Fallback to keyword matching for SQLite / non-Postgres engines
            keywords = [w.strip() for w in re.findall(r'\w+', query.lower()) if len(w) > 3 and w not in {"what", "which", "where", "when", "how", "from", "that", "this", "have", "with", "your", "were", "been"}]
            if keywords:
                conditions = [DocumentChunk.content.ilike(f"%{kw}%") for kw in keywords[:5]]
                stmt = (
                    select(DocumentChunk)
                    .where(DocumentChunk.knowledge_base_id == knowledge_base_id)
                    .where(or_(*conditions))
                    .limit(limit)
                )
            else:
                stmt = (
                    select(DocumentChunk)
                    .where(DocumentChunk.knowledge_base_id == knowledge_base_id)
                    .limit(limit)
                )
            res = await self.db.execute(stmt)
            chunks = res.scalars().all()
            return [
                {
                    "id": c.id,
                    "document_id": c.document_id,
                    "chunk_index": c.chunk_index,
                    "content": c.content,
                    "metadata": c.metadata_json or {},
                    "rank": idx + 1
                }
                for idx, c in enumerate(chunks)
            ]

    def _reciprocal_rank_fusion(
        self,
        vector_results: List[Dict[str, Any]],
        keyword_results: List[Dict[str, Any]],
        alpha: float = 0.5,
        k: int = 60
    ) -> List[Dict[str, Any]]:
        rrf_scores: Dict[str, float] = {}
        chunk_map: Dict[str, Dict[str, Any]] = {}

        # Process vector results
        for item in vector_results:
            cid = item["id"]
            chunk_map[cid] = item
            rank = item["rank"]
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + alpha * (1.0 / (k + rank))

        # Process keyword results
        for item in keyword_results:
            cid = item["id"]
            if cid not in chunk_map:
                chunk_map[cid] = item
            rank = item["rank"]
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 - alpha) * (1.0 / (k + rank))

        # Sort by RRF score descending
        sorted_ids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)
        
        fused = []
        for cid in sorted_ids:
            chunk = chunk_map[cid].copy()
            chunk["score"] = round(rrf_scores[cid], 5)
            fused.append(chunk)

        return fused
