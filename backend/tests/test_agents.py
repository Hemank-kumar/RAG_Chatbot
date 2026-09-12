import pytest
from app.agents.state import AgentState
from app.agents.query_agent import QueryAgent
from app.agents.decomposition_agent import DecompositionAgent
from app.llm.gemini import GeminiProvider


@pytest.mark.asyncio
async def test_query_and_decomposition_agents():
    llm = GeminiProvider()
    query_agent = QueryAgent(llm)
    decomp_agent = DecompositionAgent(llm)

    state = AgentState(user_query="Compare Plan A and Plan B refund policies after 15 days.")
    state = await query_agent.execute(state)

    assert state.rewritten_query is not None
    assert isinstance(state.is_complex, bool)

    state = await decomp_agent.execute(state)
    assert len(state.sub_questions) >= 1
