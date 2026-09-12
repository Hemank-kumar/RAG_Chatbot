import json
from app.agents.state import AgentState
from app.llm.base import LLMProvider
from app.llm.prompts import DECOMPOSITION_PROMPT
from app.utils.logger import logger


class DecompositionAgent:
    def __init__(self, llm: LLMProvider):
        self.llm = llm

    async def execute(self, state: AgentState) -> AgentState:
        """
        Decomposes complex queries into independent sub-questions.
        """
        if not state.is_complex:
            state.sub_questions = [state.rewritten_query or state.user_query]
            return state

        logger.info(f"[DecompositionAgent] Decomposing query: '{state.user_query}'")
        prompt = DECOMPOSITION_PROMPT.format(query=state.rewritten_query or state.user_query)
        
        raw_response = await self.llm.generate(prompt, temperature=0.1)
        
        try:
            json_str = raw_response.strip()
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0].strip()
                
            data = json.loads(json_str)
            sub_qs = data.get("sub_questions", [])
            if sub_qs and isinstance(sub_qs, list):
                state.sub_questions = sub_qs
            else:
                state.sub_questions = [state.rewritten_query or state.user_query]
        except Exception as e:
            logger.warning(f"[DecompositionAgent] JSON parse error ({e}), falling back to single query.")
            state.sub_questions = [state.rewritten_query or state.user_query]

        state.add_trace("Query Decomposition", {
            "sub_questions": state.sub_questions
        })
        return state
