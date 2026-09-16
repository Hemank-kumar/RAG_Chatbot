import asyncio
import os
from typing import AsyncGenerator, Optional
from app.llm.base import LLMProvider
from app.utils.logger import logger


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.model_name = model_name or "gpt-4o-mini"
        self._client = None
        self._init_client()

    def _init_client(self):
        if not self.api_key:
            logger.warning(f"OPENAI_API_KEY not configured for OpenAIProvider ({self.model_name}).")
            return

        try:
            from openai import OpenAI
            self._client = OpenAI(api_key=self.api_key)
            logger.info(f"Initialized OpenAI client ({self.model_name}).")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            self._client = None

    async def generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.2) -> str:
        if not self._client:
            return f"OpenAI API Key is missing or invalid for model {self.model_name}. Please provide a valid OpenAI API key."

        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = await asyncio.to_thread(
                self._client.chat.completions.create,
                model=self.model_name,
                messages=messages,
                temperature=temperature
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"OpenAI generate error ({self.model_name}): {e}")
            return f"OpenAI Generation Error: {str(e)}"

    async def generate_stream(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.2) -> AsyncGenerator[str, None]:
        if not self._client:
            msg = f"OpenAI API Key is missing or invalid for model {self.model_name}."
            for word in msg.split(" "):
                yield word + " "
                await asyncio.sleep(0.02)
            return

        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            stream = await asyncio.to_thread(
                self._client.chat.completions.create,
                model=self.model_name,
                messages=messages,
                temperature=temperature,
                stream=True
            )
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"OpenAI generate_stream error ({self.model_name}): {e}")
            yield f"\n[Error: {str(e)}]"
