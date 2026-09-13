import asyncio
from app.db.session import init_db
from app.db.models import User, Workspace, KnowledgeBase, Document, DocumentChunk
from app.agents.orchestrator import AgentOrchestrator
from app.utils.logger import logger
from sqlalchemy import select


async def run_end_to_end_synthesis():
    await init_db()
    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        user_res = await db.execute(select(User).where(User.email == "admin@example.com"))
        user = user_res.scalar_one()

        ws_res = await db.execute(select(Workspace).where(Workspace.owner_id == user.id))
        ws = ws_res.scalars().first()

        # Create test KB
        kb = KnowledgeBase(
            name="Test Policy KB",
            description="Knowledge base for testing refund rules",
            workspace_id=ws.id
        )
        db.add(kb)
        await db.commit()
        await db.refresh(kb)

        # Create test document and chunk
        doc = Document(
            filename="refund_policy.pdf",
            file_type="pdf",
            file_path="/tmp/fake.pdf",
            file_size=1024,
            status="indexed",
            knowledge_base_id=kb.id,
            workspace_id=ws.id,
            chunk_count=1
        )
        db.add(doc)
        await db.commit()

        chunk = DocumentChunk(
            document_id=doc.id,
            knowledge_base_id=kb.id,
            workspace_id=ws.id,
            chunk_index=0,
            content="Standard annual subscription purchases are eligible for a 100% full refund within 30 calendar days of the original transaction date.",
            metadata_json={"source": "refund_policy.pdf", "page_number": 1, "section": "Standard Refunds"},
            embedding=[0.01] * 384
        )
        db.add(chunk)
        await db.commit()

        # Run orchestrator
        orchestrator = AgentOrchestrator(db=db)
        state = await orchestrator.run(
            query="What is the refund policy for annual subscriptions?",
            knowledge_base_id=kb.id,
            response_mode="Explain with example"
        )

        print("\n=== SYNTHESIZED ANSWER OUTPUT ===")
        print(state.final_answer)
        print("\n=== CITATIONS ATTACHED ===")
        print(state.citations)


if __name__ == "__main__":
    asyncio.run(run_end_to_end_synthesis())
