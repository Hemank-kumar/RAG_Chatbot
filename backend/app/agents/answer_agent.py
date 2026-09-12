from typing import AsyncGenerator
from app.agents.state import AgentState
from app.llm.base import LLMProvider
from app.llm.prompts import RAG_SYSTEM_PROMPT
from app.utils.logger import logger


class AnswerAgent:
    def __init__(self, llm: LLMProvider):
        self.llm = llm

    def _build_prompt_inputs(self, state: AgentState):
        # Format context with citation markers
        context_blocks = []
        source_blocks = []

        for idx, chunk in enumerate(state.compressed_context):
            label = chunk.get("citation_label", f"[S{idx + 1}]")
            content = chunk.get("content", "").strip()
            meta = chunk.get("metadata", {})
            source = meta.get("source", "Document")
            page = meta.get("page_number", 1)
            section = meta.get("section", "")

            context_blocks.append(f"{label} (Source: {source}, Page {page}, Section: {section}):\n{content}")
            source_blocks.append(f"{label}: {source} (Page {page}, Section: {section})")

        context_str = "\n\n".join(context_blocks) if context_blocks else "No relevant context documents found."
        sources_str = "\n".join(source_blocks) if source_blocks else "None"

        # Determine example mode
        example_mode = "ON - Provide a clearly labeled practical/worked example when appropriate." if state.response_mode == "Explain with example" else "STANDARD - Only provide an example if directly requested or beneficial for clarity."

        prompt = RAG_SYSTEM_PROMPT.format(
            question=state.user_query,
            conversation_history=state.history or "None",
            context=context_str,
            sources=sources_str,
            response_mode=state.response_mode,
            example_mode=example_mode
        )
        return prompt

    async def execute(self, state: AgentState) -> AgentState:
        """
        Generates evidence-grounded answer.
        """
        logger.info(f"[AnswerAgent] Generating answer (mode: {state.response_mode})...")

        max_score = max([c.get("rerank_score", c.get("score", 0.5)) for c in state.compressed_context], default=0.0)
        if state.needs_retrieval and (not state.compressed_context or max_score < 0.15):
            logger.warning("[AnswerAgent] Context missing or low relevance score.")
            state.draft_answer = "I couldn't find relevant information in the uploaded documents to answer your question."
            state.confidence = 0.0
            state.add_trace("Answer Generation", {"status": "low_confidence_no_relevant_context"})
            return state

        prompt = self._build_prompt_inputs(state)
        answer = await self.llm.generate(prompt, temperature=0.2)
        state.draft_answer = answer.strip()

        state.add_trace("Answer Generation", {
            "draft_answer_length": len(state.draft_answer)
        })
        return state

    async def execute_stream(self, state: AgentState) -> AsyncGenerator[str, None]:
        """
        Streams generated answer tokens.
        """
        logger.info(f"[AnswerAgent] Streaming answer (mode: {state.response_mode})...")

        max_score = max([c.get("rerank_score", c.get("score", 0.5)) for c in state.compressed_context], default=0.0)
        if state.needs_retrieval and (not state.compressed_context or max_score < 0.15):
            fallback = "I couldn't find relevant information in the uploaded documents to answer your question."
            state.draft_answer = fallback
            yield fallback
            return

        prompt = self._build_prompt_inputs(state)
        accumulated = []

        async for chunk in self.llm.generate_stream(prompt, temperature=0.2):
            accumulated.append(chunk)
            yield chunk

        state.draft_answer = "".join(accumulated).strip()
        state.add_trace("Answer Generation Stream", {
            "draft_answer_length": len(state.draft_answer)
        })
