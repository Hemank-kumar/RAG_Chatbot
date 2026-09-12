import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.db.models import User, Conversation, Message, Feedback
from app.schemas.chat import ChatRequest, ConversationResponse, MessageResponse, FeedbackRequest
from app.services.auth_service import get_current_user
from app.services.chat_service import ChatService
from app.agents.orchestrator import AgentOrchestrator
from app.utils.logger import logger

router = APIRouter(tags=["Chat & Conversations"])


@router.post("/chat")
async def chat_endpoint(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        conversation = await ChatService.get_or_create_conversation(
            db=db,
            knowledge_base_id=request.knowledge_base_id,
            user=current_user,
            conversation_id=request.conversation_id,
            response_mode=request.response_mode
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    history_str = await ChatService.format_conversation_history(db, conversation.id)
    orchestrator = AgentOrchestrator(db=db)

    if request.stream:
        async def event_generator():
            accumulated_answer = []
            citations = []
            confidence = 1.0
            agent_trace = []

            yield f"data: {json.dumps({'type': 'init', 'conversation_id': conversation.id})}\n\n"

            async for event in orchestrator.run_stream(
                query=request.message,
                knowledge_base_id=request.knowledge_base_id,
                response_mode=request.response_mode,
                history=history_str
            ):
                event_type = event.get("type")
                if event_type == "token":
                    accumulated_answer.append(event.get("content", ""))
                    yield f"data: {json.dumps(event)}\n\n"
                elif event_type == "progress":
                    yield f"data: {json.dumps(event)}\n\n"
                elif event_type == "metadata":
                    citations = event.get("citations", [])
                    confidence = event.get("confidence", 1.0)
                    agent_trace = event.get("agent_trace", [])
                    yield f"data: {json.dumps(event)}\n\n"

            # Save full message turn into DB
            full_text = "".join(accumulated_answer)
            saved_msg = await ChatService.save_turn(
                db=db,
                conversation=conversation,
                user_query=request.message,
                assistant_answer=full_text,
                citations=citations,
                confidence_score=confidence,
                agent_trace=agent_trace
            )

            yield f"data: {json.dumps({'type': 'done', 'message_id': saved_msg.id})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    else:
        # Non-streaming call
        state = await orchestrator.run(
            query=request.message,
            knowledge_base_id=request.knowledge_base_id,
            response_mode=request.response_mode,
            history=history_str
        )

        saved_msg = await ChatService.save_turn(
            db=db,
            conversation=conversation,
            user_query=request.message,
            assistant_answer=state.final_answer or state.draft_answer or "",
            citations=state.citations,
            confidence_score=state.confidence,
            agent_trace=state.agent_trace
        )

        return {
            "conversation_id": conversation.id,
            "message_id": saved_msg.id,
            "answer": saved_msg.content,
            "citations": state.citations,
            "follow_up_questions": state.follow_up_questions,
            "confidence": state.confidence,
            "agent_trace": state.agent_trace
        }


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    knowledge_base_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Conversation).where(Conversation.user_id == current_user.id)
    if knowledge_base_id:
        stmt = stmt.where(Conversation.knowledge_base_id == knowledge_base_id)
    stmt = stmt.order_by(desc(Conversation.updated_at))

    res = await db.execute(stmt)
    convs = res.scalars().all()
    
    response = []
    for c in convs:
        resp = ConversationResponse.model_validate(c)
        msg_count_stmt = select(Message).where(Message.conversation_id == c.id)
        msg_res = await db.execute(msg_count_stmt)
        resp.message_count = len(msg_res.scalars().all())
        response.append(resp)

    return response


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(Conversation)
        .options(selectinload(Conversation.messages).selectinload(Message.citations))
        .where(Conversation.id == conversation_id)
        .where(Conversation.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    return {
        "id": conv.id,
        "title": conv.title,
        "knowledge_base_id": conv.knowledge_base_id,
        "response_mode": conv.response_mode,
        "created_at": conv.created_at,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "confidence_score": m.confidence_score,
                "agent_trace": m.agent_trace,
                "citations": [
                    {
                        "id": c.id,
                        "citation_label": c.citation_label,
                        "excerpt": c.excerpt,
                        "document_name": c.document_name,
                        "page_number": c.page_number,
                        "section": c.section
                    }
                    for c in m.citations
                ],
                "created_at": m.created_at
            }
            for m in conv.messages
        ]
    }


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Conversation).where(Conversation.id == conversation_id).where(Conversation.user_id == current_user.id)
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    await db.delete(conv)
    await db.commit()
    return None


@router.post("/messages/{message_id}/feedback")
async def record_feedback(
    message_id: str,
    feedback_in: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        fb = await ChatService.record_feedback(db, message_id, feedback_in, current_user)
        return {"status": "success", "feedback_id": fb.id}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
