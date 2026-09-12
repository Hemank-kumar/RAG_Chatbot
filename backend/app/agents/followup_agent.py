import json
from app.agents.state import AgentState
from app.llm.base import LLMProvider
from app.llm.prompts import FOLLOWUP_PROMPT
from app.utils.logger import logger


class FollowUpAgent:
    def __init__(self, llm: LLMProvider):
        self.llm = llm

    async def execute(self, state: AgentState) -> AgentState:
        """
        Generates 2-4 context-grounded follow-up suggestions.
        """
        if not state.final_answer or "couldn't find enough" in state.final_answer:
            state.follow_up_questions = []
            return state

        logger.info("[FollowUpAgent] Generating suggested follow-up questions...")

        prompt = FOLLOWUP_PROMPT.format(
            question=state.user_query,
            answer=state.final_answer
        )

        raw_response = await self.llm.generate(prompt, temperature=0.3)

        try:
            json_str = raw_response.strip()
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0].strip()

            data = json.loads(json_str)
            questions = data.get("follow_up_questions", [])
            state.follow_up_questions = questions[:4]
        except Exception as e:
            logger.warning(f"[FollowUpAgent] Follow-up parsing error ({e}). Using default suggestions.")
            state.follow_up_questions = [
                "Would you like more details on any specific section?",
                "Can you provide a practical example of this policy?"
            ]

        state.add_trace("Follow-Up Generation", {
            "follow_up_questions": state.follow_up_questions
        })
        return state
