from app.agents.state import AgentState
from app.rag.compression import ContextCompressor
from app.utils.logger import logger


class ContextCompressionAgent:
    def __init__(self):
        self.compressor = ContextCompressor()

    async def execute(self, state: AgentState) -> AgentState:
        """
        Compresses retrieved context, removes duplicates, and tags citation sources [S1], [S2].
        """
        if not state.retrieved_chunks:
            state.compressed_context = []
            state.citations = []
            return state

        logger.info(f"[CompressionAgent] Compressing {len(state.retrieved_chunks)} chunks...")
        compressed, citations = self.compressor.compress_and_cite(state.retrieved_chunks)

        state.compressed_context = compressed
        state.citations = citations

        state.add_trace("Context Compression", {
            "compressed_count": len(compressed),
            "citations_generated": len(citations)
        })
        return state
