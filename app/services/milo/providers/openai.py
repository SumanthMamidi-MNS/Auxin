# app/services/milo/providers/openai.py
from typing import Any, AsyncGenerator
from app.services.milo.providers.base import BaseLLMProvider

class OpenAIProvider(BaseLLMProvider):
    """
    OpenAI ChatGPT integration stub for future active mode.
    """

    async def generate_response(self, prompt: str, system_instruction: str | None = None) -> str:
        # Placeholder for future: client.chat.completions.create(...)
        raise NotImplementedError("OpenAI provider is not active yet.")

    async def stream_response(self, prompt: str, system_instruction: str | None = None) -> AsyncGenerator[str, None]:
        # Placeholder for future streaming response chunks
        raise NotImplementedError("OpenAI provider streaming is not active yet.")
        yield ""
