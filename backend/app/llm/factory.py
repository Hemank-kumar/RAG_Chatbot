from typing import Optional
from app.llm.base import LLMProvider
from app.llm.gemini import GeminiProvider
from app.llm.ollama import OllamaProvider
from app.llm.mistral import MistralProvider
from app.llm.deepseek import DeepSeekProvider
from app.llm.kimi import KimiProvider
from app.llm.openai_provider import OpenAIProvider
from app.llm.anthropic_provider import AnthropicProvider
from app.llm.groq_provider import GroqProvider
from app.utils.config import settings
from app.utils.logger import logger


def get_llm_provider(
    provider_name: Optional[str] = None,
    model_name: Optional[str] = None,
    api_key: Optional[str] = None
) -> LLMProvider:
    provider_type = (provider_name or settings.LLM_PROVIDER or "gemini").lower()

    if provider_type == "openai":
        model = model_name or "gpt-4o-mini"
        logger.info(f"Using OpenAI Provider (model={model}, custom_key={'YES' if api_key else 'NO'})")
        return OpenAIProvider(api_key=api_key, model_name=model)

    elif provider_type == "anthropic":
        model = model_name or "claude-3-5-sonnet-20241022"
        logger.info(f"Using Anthropic Provider (model={model}, custom_key={'YES' if api_key else 'NO'})")
        return AnthropicProvider(api_key=api_key, model_name=model)

    elif provider_type == "groq":
        model = model_name or "llama-3.3-70b-versatile"
        logger.info(f"Using Groq Provider (model={model}, custom_key={'YES' if api_key else 'NO'})")
        return GroqProvider(api_key=api_key, model_name=model)

    elif provider_type == "ollama":
        model = model_name or settings.OLLAMA_MODEL or "llama3.2"
        base_url = settings.OLLAMA_BASE_URL or "http://localhost:11434"
        logger.info(f"Using Ollama Provider (model={model}, base_url={base_url})")
        return OllamaProvider(model_name=model, base_url=base_url)

    elif provider_type == "mistral":
        model = model_name or settings.MISTRAL_MODEL or "mistral-large-latest"
        logger.info(f"Using Mistral Provider (model={model}, custom_key={'YES' if api_key else 'NO'})")
        return MistralProvider(api_key=api_key, model_name=model)

    elif provider_type == "deepseek":
        model = model_name or settings.DEEPSEEK_MODEL or "deepseek-chat"
        logger.info(f"Using DeepSeek Provider (model={model}, custom_key={'YES' if api_key else 'NO'})")
        return DeepSeekProvider(api_key=api_key, model_name=model)

    elif provider_type == "kimi":
        model = model_name or settings.KIMI_MODEL or "moonshot-v1-8k"
        logger.info(f"Using Kimi/Moonshot Provider (model={model}, custom_key={'YES' if api_key else 'NO'})")
        return KimiProvider(api_key=api_key, model_name=model)

    else:
        # Default Gemini
        model = model_name or settings.GEMINI_MODEL or "gemini-2.0-flash"
        logger.info(f"Using Gemini Provider (model={model}, custom_key={'YES' if api_key else 'NO'})")
        return GeminiProvider(api_key=api_key, model_name=model)

