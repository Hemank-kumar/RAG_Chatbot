from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc
from sqlalchemy.orm import selectinload

from app.db.models import Conversation, Message, Citation, Feedback, User, KnowledgeBase
from app.schemas.chat import ChatRequest, FeedbackRequest
from app.utils.logger import logger


class ChatService:
    @staticmethod
    async def get_or_create_conversation(
        db: AsyncSession,
        knowledge_base_id: str,
        user: User,
        conversation_id: Optional[str] = None,
        response_mode: str = "Detailed"
    ) -> Conversation:
        if conversation_id:
            stmt = (
                select(Conversation)
                .where(Conversation.id == conversation_id)
                .where(Conversation.user_id == user.id)
            )
            res = await db.execute(stmt)
            conv = res.scalar_one_or_none()
            if conv:
                conv.response_mode = response_mode
                await db.commit()
                return conv

        # Verify KnowledgeBase
        kb_stmt = select(KnowledgeBase).where(KnowledgeBase.id == knowledge_base_id)
        kb_res = await db.execute(kb_stmt)
        kb = kb_res.scalar_one_or_none()
        if not kb:
            raise ValueError("Knowledge base not found.")

        conv = Conversation(
            title="New Conversation",
            knowledge_base_id=knowledge_base_id,
            workspace_id=kb.workspace_id,
            user_id=user.id,
            response_mode=response_mode
        )
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
        return conv

    @staticmethod
    async def format_conversation_history(db: AsyncSession, conversation_id: str, max_turns: int = 3) -> str:
        """
        Formats recent user queries for disambiguation, excluding past full assistant outputs to prevent answer contamination.
        """
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .where(Message.role == "user")
            .order_by(desc(Message.created_at))
            .limit(max_turns)
        )
        res = await db.execute(stmt)
        user_msgs = list(reversed(res.scalars().all()))

        if not user_msgs:
            return "None"

        return "\n".join([f"Previous Question: {m.content}" for m in user_msgs])

    @staticmethod
    async def save_turn(
        db: AsyncSession,
        conversation: Conversation,
        user_query: str,
        assistant_answer: str,
        citations: list,
        confidence_score: float = 1.0,
        agent_trace: list = None
    ) -> Message:
        # Update conversation title if first turn
        if conversation.title == "New Conversation":
            conversation.title = user_query[:40] + ("..." if len(user_query) > 40 else "")

        # Save user message
        user_msg = Message(
            conversation_id=conversation.id,
            role="user",
            content=user_query,
            raw_query=user_query
        )
        db.add(user_msg)

        # Save assistant message
        asst_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=assistant_answer,
            confidence_score=confidence_score,
            agent_trace={"steps": agent_trace or []}
        )
        db.add(asst_msg)
        await db.flush()

        # Save citations
        db_citations = []
        for c in citations:
            db_cit = Citation(
                message_id=asst_msg.id,
                chunk_id=c.get("chunk_id", ""),
                citation_label=c.get("citation_label", "[S1]"),
                excerpt=c.get("excerpt", ""),
                document_name=c.get("document_name", "Document"),
                page_number=c.get("page_number"),
                section=c.get("section")
            )
            db_citations.append(db_cit)

        if db_citations:
            db.add_all(db_citations)

        await db.commit()
        await db.refresh(asst_msg)
        return asst_msg

    @staticmethod
    async def record_feedback(db: AsyncSession, message_id: str, feedback_in: FeedbackRequest, user: User) -> Feedback:
        # Check message existence
        stmt = select(Message).where(Message.id == message_id)
        res = await db.execute(stmt)
        msg = res.scalar_one_or_none()
        if not msg:
            raise ValueError("Message not found.")

        # Check existing feedback
        fb_stmt = select(Feedback).where(Feedback.message_id == message_id)
        fb_res = await db.execute(fb_stmt)
        fb = fb_res.scalar_one_or_none()

        if fb:
            fb.rating = feedback_in.rating
            fb.comment = feedback_in.comment
        else:
            fb = Feedback(
                message_id=message_id,
                user_id=user.id,
                rating=feedback_in.rating,
                comment=feedback_in.comment
            )
            db.add(fb)

        await db.commit()
        await db.refresh(fb)
        return fb
