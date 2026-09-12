import json
import httpx
from typing import AsyncGenerator, Optional
from app.llm.base import LLMProvider
from app.utils.config import settings
from app.utils.logger import logger


class OllamaProvider(LLMProvider):
    def __init__(self, model_name: str = "llama3.2", base_url: str = "http://localhost:11434"):
        self.model_name = model_name or "llama3.2"
        self.base_url = base_url.rstrip("/")

    async def generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.2) -> str:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "system": system_prompt or "",
            "stream": False,
            "options": {"temperature": temperature}
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    return res.json().get("response", "").strip()
                else:
                    logger.error(f"Ollama API HTTP {res.status_code}: {res.text}")
                    return f"Ollama error: {res.status_code}"
        except Exception as e:
            logger.error(f"Ollama connection error: {e}")
            return f"Could not connect to Ollama service at {self.base_url}. Ensure Ollama is running."

    async def generate_stream(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.2) -> AsyncGenerator[str, None]:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "system": system_prompt or "",
            "stream": True,
            "options": {"temperature": temperature}
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", url, json=payload) as res:
                    async for line in res.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                token = data.get("response", "")
                                if token:
                                    yield token
                            except Exception:
                                pass
        except Exception as e:
            logger.error(f"Ollama streaming error: {e}")
            yield f"Ollama connection error: {e}"
