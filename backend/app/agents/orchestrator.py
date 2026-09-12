import asyncio
from typing import AsyncGenerator, Callable, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.state import AgentState
from app.agents.query_agent import QueryAgent
from app.agents.decomposition_agent import DecompositionAgent
from app.agents.retrieval_agent import RetrievalAgent
from app.agents.reranking_agent import RerankingAgent
from app.agents.compression_agent import ContextCompressionAgent
from app.agents.answer_agent import AnswerAgent
from app.agents.verification_agent import VerificationAgent
from app.agents.followup_agent import FollowUpAgent
from app.llm.base import LLMProvider
from app.llm.factory import get_llm_provider
from app.utils.logger import logger


class AgentOrchestrator:
    def __init__(self, db: AsyncSession, llm: Optional[LLMProvider] = None, provider_name: Optional[str] = None, model_name: Optional[str] = None):
        self.db = db
        self.llm = llm or get_llm_provider(provider_name=provider_name, model_name=model_name)

        self.query_agent = QueryAgent(self.llm)
        self.decomposition_agent = DecompositionAgent(self.llm)
        self.retrieval_agent = RetrievalAgent(self.db)
        self.reranking_agent = RerankingAgent()
        self.compression_agent = ContextCompressionAgent()
        self.answer_agent = AnswerAgent(self.llm)
        self.verification_agent = VerificationAgent(self.llm)
        self.followup_agent = FollowUpAgent(self.llm)

    async def run(
        self,
        query: str,
        knowledge_base_id: str,
        response_mode: str = "Detailed",
        history: str = "",
        progress_callback: Optional[Callable[[str, str], Any]] = None
    ) -> AgentState:
        """
        Executes non-streaming end-to-end multi-agent orchestration pipeline.
        """
        state = AgentState(user_query=query, response_mode=response_mode, history=history)

        # 1. Query Analysis
        if progress_callback:
            await progress_callback("query_analysis", "Analyzing user question...")
        state = await self.query_agent.execute(state)

        # 2. Decomposition (only if complex)
        if state.is_complex:
            if progress_callback:
                await progress_callback("decomposition", "Decomposing complex query...")
            state = await self.decomposition_agent.execute(state)

        # 3. Hybrid Retrieval
        if state.needs_retrieval:
            if progress_callback:
                await progress_callback("retrieval", "Searching knowledge base...")
            state = await self.retrieval_agent.execute(state, knowledge_base_id=knowledge_base_id)

            # 4. Reranking
            if state.retrieved_chunks:
                if progress_callback:
                    await progress_callback("reranking", "Reranking candidate evidence...")
                state = await self.reranking_agent.execute(state)

            # 5. Context Compression & Citations
            if progress_callback:
                await progress_callback("compression", "Compressing context & indexing citations...")
            state = await self.compression_agent.execute(state)

        # 6. Answer Generation
        if progress_callback:
            await progress_callback("answer", "Generating evidence-grounded answer...")
        state = await self.answer_agent.execute(state)

        # 7. Verification
        if progress_callback:
            await progress_callback("verification", "Verifying factual accuracy & citations...")
        state = await self.verification_agent.execute(state)

        # 8. Follow-up Generation
        if progress_callback:
            await progress_callback("followup", "Formulating suggested follow-ups...")
        state = await self.followup_agent.execute(state)

        return state

    async def run_stream(
        self,
        query: str,
        knowledge_base_id: str,
        response_mode: str = "Detailed",
        history: str = ""
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Executes streaming multi-agent pipeline yielding SSE structured dictionary events:
        - {"type": "progress", "step": "...", "message": "..."}
        - {"type": "token", "content": "..."}
        - {"type": "metadata", "citations": [...], "follow_ups": [...], "trace": [...]}
        """
        state = AgentState(user_query=query, response_mode=response_mode, history=history)

        # Step 1: Query Analysis
        yield {"type": "progress", "step": "query_analysis", "message": "Analyzing question..."}
        state = await self.query_agent.execute(state)

        # Step 2: Decomposition (if complex)
        if state.is_complex:
            yield {"type": "progress", "step": "decomposition", "message": "Decomposing complex query..."}
            state = await self.decomposition_agent.execute(state)

        # Step 3: Retrieval
        if state.needs_retrieval:
            yield {"type": "progress", "step": "retrieval", "message": "Searching knowledge base..."}
            state = await self.retrieval_agent.execute(state, knowledge_base_id=knowledge_base_id)

            # Step 4: Reranking
            if state.retrieved_chunks:
                yield {"type": "progress", "step": "reranking", "message": "Reranking candidate chunks..."}
                state = await self.reranking_agent.execute(state)

            # Step 5: Compression
            yield {"type": "progress", "step": "compression", "message": "Formatting context & citations..."}
            state = await self.compression_agent.execute(state)

        # Step 6: Stream Answer Generation
        yield {"type": "progress", "step": "answer", "message": "Generating answer..."}
        
        # Stream tokens
        async for token in self.answer_agent.execute_stream(state):
            yield {"type": "token", "content": token}

        # Step 7: Verification
        yield {"type": "progress", "step": "verification", "message": "Verifying answer correctness..."}
        state = await self.verification_agent.execute(state)

        # Step 8: Follow-up questions
        yield {"type": "progress", "step": "followup", "message": "Preparing follow-up questions..."}
        state = await self.followup_agent.execute(state)

        # Final metadata event
        yield {
            "type": "metadata",
            "citations": state.citations,
            "follow_up_questions": state.follow_up_questions,
            "confidence": state.confidence,
            "agent_trace": state.agent_trace
        }
