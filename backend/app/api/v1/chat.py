import json
import asyncio
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
from app.services.redis_client import CacheService
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
            try:
                yield f"data: {json.dumps({'type': 'init', 'conversation_id': conversation.id})}\n\n"

                # Check Upstash Redis Cache first
                cached_res = await CacheService.get_cached_response(
                    query=request.message,
                    knowledge_base_id=request.knowledge_base_id,
                    response_mode=request.response_mode
                )

                if cached_res:
                    logger.info(f"[ChatAPI] Instant Upstash Redis Cache HIT for query: '{request.message[:30]}...'")
                    
                    # Signal progress step: Cache HIT
                    yield f"data: {json.dumps({'type': 'progress', 'step': 'query_analysis', 'detail': 'Upstash Redis Cache HIT - Instant Retrieval'})}\n\n"
                    
                    # Stream cached answer in smooth token chunks
                    cached_answer = cached_res.get("answer", "")
                    chunk_size = 20
                    for i in range(0, len(cached_answer), chunk_size):
                        token_chunk = cached_answer[i:i + chunk_size]
                        yield f"data: {json.dumps({'type': 'token', 'content': token_chunk})}\n\n"
                        await asyncio.sleep(0.01)

                    # Send metadata
                    yield f"data: {json.dumps({'type': 'metadata', 'citations': cached_res.get('citations', []), 'confidence': cached_res.get('confidence', 1.0), 'agent_trace': cached_res.get('agent_trace', []), 'follow_up_questions': cached_res.get('follow_up_questions', []), 'cached': True})}\n\n"

                    # Save message turn into DB for user history
                    saved_msg = await ChatService.save_turn(
                        db=db,
                        conversation=conversation,
                        user_query=request.message,
                        assistant_answer=cached_answer,
                        citations=cached_res.get("citations", []),
                        confidence_score=cached_res.get("confidence", 1.0),
                        agent_trace=cached_res.get("agent_trace", [])
                    )

                    yield f"data: {json.dumps({'type': 'done', 'message_id': saved_msg.id})}\n\n"
                    return

                # Cache MISS: Run full agent pipeline
                accumulated_answer = []
                citations = []
                confidence = 1.0
                agent_trace = []
                follow_ups = []

                async for event in orchestrator.run_stream(
                    query=request.message,
                    knowledge_base_id=request.knowledge_base_id,
                    response_mode=request.response_mode,
                    provider_name=request.provider_name,
                    model_name=request.model_name,
                    custom_api_key=request.custom_api_key,
                    history=history_str,
                    allow_web_search=request.allow_web_search or False
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
                        follow_ups = event.get("follow_up_questions", [])
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

                # Store completed response payload in Upstash Redis cache
                await CacheService.set_cached_response(
                    query=request.message,
                    knowledge_base_id=request.knowledge_base_id,
                    response_mode=request.response_mode,
                    response_data={
                        "answer": full_text,
                        "citations": citations,
                        "follow_up_questions": follow_ups,
                        "confidence": confidence,
                        "agent_trace": agent_trace
                    }
                )

                yield f"data: {json.dumps({'type': 'done', 'message_id': saved_msg.id})}\n\n"

            except Exception as err:
                logger.error(f"[ChatAPI] Error in stream event generator: {err}", exc_info=True)
                yield f"data: {json.dumps({'type': 'error', 'message': str(err)})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    else:
        # Check Redis Cache first
        cached_res = await CacheService.get_cached_response(
            query=request.message,
            knowledge_base_id=request.knowledge_base_id,
            response_mode=request.response_mode
        )
        if cached_res:
            saved_msg = await ChatService.save_turn(
                db=db,
                conversation=conversation,
                user_query=request.message,
                assistant_answer=cached_res["answer"],
                citations=cached_res.get("citations", []),
                confidence_score=cached_res.get("confidence", 1.0),
                agent_trace=cached_res.get("agent_trace", [])
            )
            return {
                "conversation_id": conversation.id,
                "message_id": saved_msg.id,
                "answer": saved_msg.content,
                "citations": cached_res.get("citations", []),
                "follow_up_questions": cached_res.get("follow_up_questions", []),
                "confidence": cached_res.get("confidence", 1.0),
                "agent_trace": cached_res.get("agent_trace", []),
                "cached": True
            }

        # Non-streaming call (Cache miss)
        state = await orchestrator.run(
            query=request.message,
            knowledge_base_id=request.knowledge_base_id,
            response_mode=request.response_mode,
            provider_name=request.provider_name,
            model_name=request.model_name,
            custom_api_key=request.custom_api_key,
            history=history_str,
            allow_web_search=request.allow_web_search or False
        )

        answer_text = state.final_answer or state.draft_answer or ""
        saved_msg = await ChatService.save_turn(
            db=db,
            conversation=conversation,
            user_query=request.message,
            assistant_answer=answer_text,
            citations=state.citations,
            confidence_score=state.confidence,
            agent_trace=state.agent_trace
        )

        response_payload = {
            "answer": answer_text,
            "citations": state.citations,
            "follow_up_questions": state.follow_up_questions,
            "confidence": state.confidence,
            "agent_trace": state.agent_trace,
            "cached": False
        }

        await CacheService.set_cached_response(
            query=request.message,
            knowledge_base_id=request.knowledge_base_id,
            response_mode=request.response_mode,
            response_data=response_payload
        )

        return {
            "conversation_id": conversation.id,
            "message_id": saved_msg.id,
            **response_payload
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
