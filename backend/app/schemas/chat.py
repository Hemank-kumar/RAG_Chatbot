from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class CitationResponse(BaseModel):
    id: str
    citation_label: str
    excerpt: str
    document_name: str
    page_number: Optional[int] = None
    section: Optional[str] = None

    class Config:
        from_attributes = True


class FeedbackRequest(BaseModel):
    rating: int  # 1 or -1
    comment: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    raw_query: Optional[str] = None
    confidence_score: Optional[float] = None
    agent_trace: Optional[Dict[str, Any]] = None
    citations: List[CitationResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: str
    title: str
    knowledge_base_id: str
    workspace_id: str
    response_mode: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str
    knowledge_base_id: str
    conversation_id: Optional[str] = None
    response_mode: str = "Detailed"  # Brief, Detailed, Technical, Beginner, Explain with example
    stream: bool = True
