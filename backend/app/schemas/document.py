from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    page_count: int
    chunk_count: int
    status: str
    error_message: Optional[str] = None
    knowledge_base_id: str
    workspace_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentChunkResponse(BaseModel):
    id: str
    chunk_index: int
    content: str
    metadata_json: Dict[str, Any]
    score: Optional[float] = None

    class Config:
        from_attributes = True


class SearchQueryRequest(BaseModel):
    query: str
    knowledge_base_id: str
    top_k: int = 5
    hybrid_alpha: float = 0.5
