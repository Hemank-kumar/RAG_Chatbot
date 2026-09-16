import json
import httpx
from typing import AsyncGenerator, Optional
from app.llm.base import LLMProvider
from app.utils.config import settings
from app.utils.logger import logger


class DeepSeekProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None, model_name: str = "deepseek-chat"):
        self.api_key = api_key or settings.DEEPSEEK_API_KEY
        self.model_name = model_name or "deepseek-chat"
        self.base_url = "https://api.deepseek.com/chat/completions"

    async def generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.2) -> str:
        if not self.api_key:
            return "DeepSeek API key not configured. Please set DEEPSEEK_API_KEY in settings or environment."

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(self.base_url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"].strip()
                else:
                    return f"DeepSeek API error ({res.status_code}): {res.text}"
        except Exception as e:
            logger.error(f"DeepSeek generate error: {e}")
            return f"DeepSeek connection error: {e}"

    async def generate_stream(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.2) -> AsyncGenerator[str, None]:
        if not self.api_key:
            yield "DeepSeek API key not configured."
            return

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature,
            "stream": True
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", self.base_url, headers=headers, json=payload) as res:
                    if res.status_code != 200:
                        err_body = await res.aread()
                        raw_err = err_body.decode('utf-8', errors='ignore')
                        logger.error(f"[DeepSeek API Error {res.status_code}]: {raw_err}")
                        try:
                            err_json = json.loads(raw_err)
                            detail = err_json.get("message") or raw_err
                        except Exception:
                            detail = raw_err
                        yield f"DeepSeek API Error ({res.status_code}): {detail}"
                        return
                    async for line in res.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line.replace("data: ", "").strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                data = json.loads(data_str)
                                delta = data["choices"][0]["delta"].get("content", "")
                                if delta:
                                    yield delta
                            except Exception:
                                pass
        except Exception as e:
            logger.error(f"DeepSeek streaming error: {e}")
            yield f"DeepSeek connection error: {e}"
