import json
from typing import Dict, Any
from app.agents.state import AgentState
from app.llm.base import LLMProvider
from app.llm.prompts import QUERY_ANALYSIS_PROMPT
from app.utils.logger import logger


class QueryAgent:
    def __init__(self, llm: LLMProvider):
        self.llm = llm

    async def execute(self, state: AgentState) -> AgentState:
        """
        Analyzes user query: rewrites ambiguous terms, extracts intent, detects if retrieval is needed,
        and determines if the query is complex requiring sub-question decomposition.
        """
        logger.info(f"[QueryAgent] Analyzing query: '{state.user_query}'")
        
        prompt = QUERY_ANALYSIS_PROMPT.format(
            query=state.user_query,
            history=state.history or "None"
        )
        
        raw_response = await self.llm.generate(prompt, temperature=0.1)
        
        try:
            # Extract JSON block
            json_str = raw_response.strip()
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0].strip()
            
            data = json.loads(json_str)
            rewritten = (data.get("rewritten_query") or "").strip()
            if not rewritten or rewritten.lower() in ["detailed query request", "query", "none", "n/a"]:
                state.rewritten_query = state.user_query
            else:
                state.rewritten_query = rewritten

            state.intent = data.get("intent", "general")
            state.needs_retrieval = data.get("needs_retrieval", True)
            state.is_complex = data.get("is_complex", False)
        except Exception as e:
            logger.warning(f"[QueryAgent] JSON parse error ({e}), using default heuristics.")
            state.rewritten_query = state.user_query
            state.needs_retrieval = True
            # Heuristic complexity check (e.g. contains 'and', 'compare', 'difference')
            state.is_complex = any(k in state.user_query.lower() for k in ["compare", "versus", "vs", "difference", "after", "both"])

        state.add_trace("Query Analysis", {
            "rewritten_query": state.rewritten_query,
            "intent": state.intent,
            "needs_retrieval": state.needs_retrieval,
            "is_complex": state.is_complex
        })
        return state
