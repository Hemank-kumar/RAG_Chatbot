from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    owner_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class KnowledgeBaseCreate(BaseModel):
    name: str
    description: Optional[str] = None
    workspace_id: str


class KnowledgeBaseResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    workspace_id: str
    created_at: datetime
    document_count: Optional[int] = 0

    class Config:
        from_attributes = True
