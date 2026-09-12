from app.agents.state import AgentState
from app.rag.reranker import Reranker
from app.utils.logger import logger


class RerankingAgent:
    def __init__(self):
        self.reranker = Reranker()

    async def execute(self, state: AgentState, top_k: int = 5) -> AgentState:
        """
        Reranks candidate retrieved chunks.
        """
        if not state.retrieved_chunks:
            return state

        query = state.rewritten_query or state.user_query
        logger.info(f"[RerankingAgent] Reranking {len(state.retrieved_chunks)} candidate chunks...")

        reranked = self.reranker.rerank(
            query=query,
            chunks=state.retrieved_chunks,
            top_k=top_k
        )

        state.retrieved_chunks = reranked
        state.add_trace("Reranking", {
            "reranked_count": len(reranked),
            "top_score": reranked[0].get("rerank_score") if reranked else 0.0
        })
        return state
