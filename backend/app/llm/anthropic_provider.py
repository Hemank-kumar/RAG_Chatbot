import asyncio
import os
from typing import AsyncGenerator, Optional
from app.llm.base import LLMProvider
from app.utils.logger import logger


class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY", "")
        self.model_name = model_name or "claude-3-5-sonnet-20241022"
        self._client = None
        self._init_client()

    def _init_client(self):
        if not self.api_key:
            logger.warning(f"ANTHROPIC_API_KEY not configured for AnthropicProvider ({self.model_name}).")
            return

        try:
            import anthropic
            self._client = anthropic.Anthropic(api_key=self.api_key)
            logger.info(f"Initialized Anthropic client ({self.model_name}).")
        except Exception as e:
            logger.error(f"Failed to initialize Anthropic client: {e}")
            self._client = None

    async def generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.2) -> str:
        if not self._client:
            return f"Anthropic API Key is missing or invalid for model {self.model_name}. Please provide a valid Anthropic API key."

        try:
            kwargs = {
                "model": self.model_name,
                "max_tokens": 4096,
                "temperature": temperature,
                "messages": [{"role": "user", "content": prompt}]
            }
            if system_prompt:
                kwargs["system"] = system_prompt

            response = await asyncio.to_thread(self._client.messages.create, **kwargs)
            return response.content[0].text if response.content else ""
        except Exception as e:
            logger.error(f"Anthropic generate error ({self.model_name}): {e}")
            return f"Anthropic Generation Error: {str(e)}"

    async def generate_stream(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.2) -> AsyncGenerator[str, None]:
        if not self._client:
            msg = f"Anthropic API Key is missing or invalid for model {self.model_name}."
            for word in msg.split(" "):
                yield word + " "
                await asyncio.sleep(0.02)
            return

        try:
            kwargs = {
                "model": self.model_name,
                "max_tokens": 4096,
                "temperature": temperature,
                "messages": [{"role": "user", "content": prompt}]
            }
            if system_prompt:
                kwargs["system"] = system_prompt

            with self._client.messages.stream(**kwargs) as stream:
                for text in stream.text_stream:
                    yield text
        except Exception as e:
            logger.error(f"Anthropic generate_stream error ({self.model_name}): {e}")
            yield f"\n[Error: {str(e)}]"
