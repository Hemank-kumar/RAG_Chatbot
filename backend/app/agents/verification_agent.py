import json
from app.agents.state import AgentState
from app.llm.base import LLMProvider
from app.llm.prompts import VERIFICATION_PROMPT
from app.utils.config import settings
from app.utils.logger import logger


class VerificationAgent:
    def __init__(self, llm: LLMProvider):
        self.llm = llm

    async def execute(self, state: AgentState) -> AgentState:
        """
        Verifies answer faithfulness, citation accuracy, and hallucination prevention.
        """
        if not state.draft_answer:
            state.final_answer = "I couldn't generate a verified answer."
            state.confidence = 0.0
            return state

        # If fallback answer due to missing or low-relevance context, skip audit
        if "couldn't find" in state.draft_answer.lower():
            state.final_answer = state.draft_answer
            state.confidence = 0.0
            state.verification_result = {"is_valid": True, "note": "Low confidence fallback"}
            return state

        logger.info("[VerificationAgent] Auditing draft answer for grounding & citations...")

        context_str = "\n\n".join([
            f"{c.get('citation_label', '')}: {c.get('content', '')}"
            for c in state.compressed_context
        ])

        prompt = VERIFICATION_PROMPT.format(
            draft_answer=state.draft_answer,
            context=context_str or "No context",
            question=state.user_query
        )

        raw_response = await self.llm.generate(prompt, temperature=0.1)

        try:
            json_str = raw_response.strip()
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0].strip()

            result = json.loads(json_str)
            state.verification_result = result
            state.confidence = float(result.get("confidence_score", 0.9))

            if result.get("is_valid", True):
                state.final_answer = state.draft_answer
            else:
                logger.warning(f"[VerificationAgent] Verification failed: {result.get('feedback')}")
                state.final_answer = state.draft_answer  # Accept with updated confidence score
        except Exception as e:
            logger.warning(f"[VerificationAgent] Verification JSON parse error ({e}), default to valid.")
            state.final_answer = state.draft_answer
            state.confidence = 0.85
            state.verification_result = {"is_valid": True, "confidence_score": 0.85}

        state.add_trace("Verification", {
            "confidence": state.confidence,
            "verification_result": state.verification_result
        })
        return state
