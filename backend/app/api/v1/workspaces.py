from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.db.models import User, Workspace, KnowledgeBase, Document
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse
from app.schemas.knowledge_base import KnowledgeBaseCreate, KnowledgeBaseResponse
from app.services.auth_service import get_current_user

router = APIRouter(tags=["Workspaces & KnowledgeBases"])


# Workspaces
@router.get("/workspaces", response_model=List[WorkspaceResponse])
async def list_workspaces(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Workspace).where(Workspace.owner_id == current_user.id)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/workspaces", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    ws_in: WorkspaceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = Workspace(
        name=ws_in.name,
        description=ws_in.description,
        owner_id=current_user.id
    )
    db.add(ws)
    await db.commit()
    await db.refresh(ws)
    return ws


# Knowledge Bases
@router.get("/knowledge-bases", response_model=List[KnowledgeBaseResponse])
async def list_knowledge_bases(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(KnowledgeBase).where(KnowledgeBase.workspace_id == workspace_id)
    res = await db.execute(stmt)
    kbs = res.scalars().all()

    response = []
    for kb in kbs:
        doc_count_stmt = select(func.count(Document.id)).where(Document.knowledge_base_id == kb.id)
        doc_count_res = await db.execute(doc_count_stmt)
        count = doc_count_res.scalar() or 0
        
        kb_resp = KnowledgeBaseResponse.model_validate(kb)
        kb_resp.document_count = count
        response.append(kb_resp)

    return response


@router.post("/knowledge-bases", response_model=KnowledgeBaseResponse, status_code=status.HTTP_201_CREATED)
async def create_knowledge_base(
    kb_in: KnowledgeBaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify workspace ownership
    ws_stmt = select(Workspace).where(Workspace.id == kb_in.workspace_id).where(Workspace.owner_id == current_user.id)
    ws_res = await db.execute(ws_stmt)
    ws = ws_res.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Workspace access denied.")

    kb = KnowledgeBase(
        name=kb_in.name,
        description=kb_in.description,
        workspace_id=kb_in.workspace_id
    )
    db.add(kb)
    await db.commit()
    await db.refresh(kb)
    
    resp = KnowledgeBaseResponse.model_validate(kb)
    resp.document_count = 0
    return resp
