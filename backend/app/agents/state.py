from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class AgentState(BaseModel):
    user_query: str
    rewritten_query: Optional[str] = None
    intent: Optional[str] = "general"
    needs_retrieval: bool = True
    is_complex: bool = False
    sub_questions: List[str] = Field(default_factory=list)
    retrieved_chunks: List[Dict[str, Any]] = Field(default_factory=list)
    compressed_context: List[Dict[str, Any]] = Field(default_factory=list)
    draft_answer: Optional[str] = None
    final_answer: Optional[str] = None
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    verification_result: Optional[Dict[str, Any]] = Field(default_factory=dict)
    confidence: float = 1.0
    follow_up_questions: List[str] = Field(default_factory=list)
    response_mode: str = "Detailed"
    provider_name: Optional[str] = "gemini"
    model_name: Optional[str] = "gemini-2.0-flash"
    custom_api_key: Optional[str] = None
    history: str = ""
    allow_web_search: bool = False
    web_search_results: List[Dict[str, Any]] = Field(default_factory=list)
    is_web_search_answer: bool = False
    agent_trace: List[Dict[str, Any]] = Field(default_factory=list)

    def add_trace(self, step_name: str, details: Dict[str, Any]):
        self.agent_trace.append({
            "step": step_name,
            "details": details
        })
