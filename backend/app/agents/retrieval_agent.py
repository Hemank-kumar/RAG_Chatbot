from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.agents.state import AgentState
from app.rag.hybrid_retriever import HybridRetriever
from app.utils.logger import logger


class RetrievalAgent:
    def __init__(self, db: AsyncSession):
        self.retriever = HybridRetriever(db)

    async def execute(self, state: AgentState, knowledge_base_id: str, top_k: int = 10) -> AgentState:
        """
        Executes hybrid retrieval across all sub-questions for the knowledge base.
        """
        if not state.needs_retrieval:
            state.retrieved_chunks = []
            return state

        queries = state.sub_questions if state.sub_questions else [state.rewritten_query or state.user_query]
        logger.info(f"[RetrievalAgent] Retrieving for {len(queries)} query variation(s)...")

        all_retrieved = []
        seen_ids = set()

        for q in queries:
            chunks = await self.retriever.search(
                query=q,
                knowledge_base_id=knowledge_base_id,
                top_k=top_k
            )
            for chunk in chunks:
                cid = chunk.get("id")
                if cid not in seen_ids:
                    seen_ids.add(cid)
                    all_retrieved.append(chunk)

        state.retrieved_chunks = all_retrieved
        state.add_trace("Hybrid Retrieval", {
            "retrieved_count": len(all_retrieved),
            "queries_executed": queries
        })
        return state
