from typing import Optional
from app.llm.base import LLMProvider
from app.llm.gemini import GeminiProvider
from app.llm.ollama import OllamaProvider
from app.llm.mistral import MistralProvider
from app.llm.deepseek import DeepSeekProvider
from app.llm.kimi import KimiProvider
from app.utils.config import settings
from app.utils.logger import logger


def get_llm_provider(
    provider_name: Optional[str] = None,
    model_name: Optional[str] = None,
    api_key: Optional[str] = None
) -> LLMProvider:
    provider_type = (provider_name or settings.LLM_PROVIDER or "gemini").lower()
    
    if provider_type == "ollama":
        model = model_name or settings.OLLAMA_MODEL or "llama3.2"
        base_url = settings.OLLAMA_BASE_URL or "http://localhost:11434"
        logger.info(f"Using Ollama Provider (model={model}, base_url={base_url})")
        return OllamaProvider(model_name=model, base_url=base_url)
    
    elif provider_type == "mistral":
        model = model_name or settings.MISTRAL_MODEL or "mistral-small-latest"
        logger.info(f"Using Mistral Provider (model={model})")
        return MistralProvider(api_key=api_key, model_name=model)
    
    elif provider_type == "deepseek":
        model = model_name or settings.DEEPSEEK_MODEL or "deepseek-chat"
        logger.info(f"Using DeepSeek Provider (model={model})")
        return DeepSeekProvider(api_key=api_key, model_name=model)
    
    elif provider_type == "kimi":
        model = model_name or settings.KIMI_MODEL or "moonshot-v1-8k"
        logger.info(f"Using Kimi/Moonshot Provider (model={model})")
        return KimiProvider(api_key=api_key, model_name=model)
    
    else:
        # Default Gemini
        model = model_name or settings.GEMINI_MODEL or "gemini-2.0-flash"
        logger.info(f"Using Gemini Provider (model={model})")
        return GeminiProvider(api_key=api_key, model_name=model)
