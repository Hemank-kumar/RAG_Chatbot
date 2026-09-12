from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import User
from app.schemas.document import SearchQueryRequest, DocumentChunkResponse
from app.services.auth_service import get_current_user
from app.rag.hybrid_retriever import HybridRetriever

router = APIRouter(prefix="/search", tags=["Search"])


@router.post("", response_model=List[DocumentChunkResponse])
async def search_knowledge_base(
    query_in: SearchQueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    retriever = HybridRetriever(db)
    results = await retriever.search(
        query=query_in.query,
        knowledge_base_id=query_in.knowledge_base_id,
        top_k=query_in.top_k,
        alpha=query_in.hybrid_alpha
    )

    chunks = []
    for r in results:
        chunk_resp = DocumentChunkResponse(
            id=r["id"],
            chunk_index=r["chunk_index"],
            content=r["content"],
            metadata_json=r["metadata"],
            score=r.get("score")
        )
        chunks.append(chunk_resp)

    return chunks
