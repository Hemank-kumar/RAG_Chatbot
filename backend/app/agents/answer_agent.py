from typing import AsyncGenerator
from app.agents.state import AgentState
from app.llm.base import LLMProvider
from app.llm.prompts import RAG_SYSTEM_PROMPT, WEB_SEARCH_RAG_PROMPT
from app.services.web_search_service import WebSearchService
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

    def _build_web_search_prompt(self, state: AgentState, search_results: list) -> str:
        web_context_blocks = []
        for res in search_results:
            title = res.get("title", "Web Source")
            url = res.get("href", "#")
            snippet = res.get("snippet", "")
            domain = res.get("source_domain", "")
            web_context_blocks.append(f"Source: {title} ({domain})\nURL: {url}\nSnippet: {snippet}")

        web_context_str = "\n\n".join(web_context_blocks) if web_context_blocks else "No web results found."
        return WEB_SEARCH_RAG_PROMPT.format(
            question=state.user_query,
            web_context=web_context_str
        )

    async def execute(self, state: AgentState) -> AgentState:
        """
        Generates evidence-grounded answer or web search fallback.
        """
        logger.info(f"[AnswerAgent] Generating answer (mode: {state.response_mode})...")

        # Check if user explicitly declined web search
        q_lower = state.user_query.lower().strip()
        if "cancel search" in q_lower or (q_lower.startswith("no") and len(q_lower) < 15):
            state.draft_answer = "No related information found for the query in the Knowledge Base."
            state.confidence = 0.0
            return state

        max_score = max([c.get("rerank_score", c.get("score", 0.5)) for c in state.compressed_context], default=0.0)
        if state.needs_retrieval and (not state.compressed_context or max_score < 0.15):
            if not state.allow_web_search and "yes" not in q_lower and "search the internet" not in q_lower:
                logger.info("[AnswerAgent] Low context score. Asking user for internet search consent...")
                state.draft_answer = "The Knowledge Base does not contain the information for your query.\n\nWould you like me to fetch the information for this question from the internet?"
                state.confidence = 0.0
                state.follow_up_questions = ["🌐 Yes, search the internet", "❌ No, cancel search"]
                state.add_trace("Answer Generation", {"status": "prompt_web_search_consent"})
                return state
            else:
                # Perform web search
                logger.info("[AnswerAgent] Performing web search fallback...")
                web_results = await WebSearchService.search(state.user_query)
                state.web_search_results = web_results
                state.is_web_search_answer = True
                prompt = self._build_web_search_prompt(state, web_results)
                answer = await self.llm.generate(prompt, temperature=0.2)
                state.draft_answer = answer.strip()
                state.confidence = 0.75
                state.add_trace("Answer Generation", {"status": "web_search_completed", "sources_count": len(web_results)})
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
        Streams generated answer tokens (RAG or Web Search).
        """
        logger.info(f"[AnswerAgent] Streaming answer (mode: {state.response_mode})...")

        # Check if user explicitly declined web search
        q_lower = state.user_query.lower().strip()
        if "cancel search" in q_lower or (q_lower.startswith("no") and len(q_lower) < 15):
            fallback = "No related information found for the query in the Knowledge Base."
            state.draft_answer = fallback
            state.confidence = 0.0
            yield fallback
            return

        max_score = max([c.get("rerank_score", c.get("score", 0.5)) for c in state.compressed_context], default=0.0)
        if state.needs_retrieval and (not state.compressed_context or max_score < 0.15):
            if not state.allow_web_search and "yes" not in q_lower and "search the internet" not in q_lower:
                logger.info("[AnswerAgent] Low context score. Yielding internet search consent prompt...")
                prompt_msg = "The Knowledge Base does not contain the information for your query.\n\nWould you like me to fetch the information for this question from the internet?"
                state.draft_answer = prompt_msg
                state.confidence = 0.0
                state.follow_up_questions = ["🌐 Yes, search the internet", "❌ No, cancel search"]
                yield prompt_msg
                return
            else:
                logger.info("[AnswerAgent] Performing web search fallback for stream...")
                web_results = await WebSearchService.search(state.user_query)
                state.web_search_results = web_results
                state.is_web_search_answer = True
                prompt = self._build_web_search_prompt(state, web_results)
                accumulated = []
                async for chunk in self.llm.generate_stream(prompt, temperature=0.2):
                    accumulated.append(chunk)
                    yield chunk

                state.draft_answer = "".join(accumulated).strip()
                state.confidence = 0.75
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

