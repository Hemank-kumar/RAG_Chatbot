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
