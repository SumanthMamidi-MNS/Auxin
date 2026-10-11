# app/services/milo/providers/gemini.py
from typing import Any, AsyncGenerator
from app.services.milo.providers.base import BaseLLMProvider

class GeminiProvider(BaseLLMProvider):
    """
    Google Gemini integration stub for future active mode.
    """

    async def generate_response(self, prompt: str, system_instruction: str | None = None) -> str:
        # Placeholder for future: google-generativeai call
        raise NotImplementedError("Gemini provider is not active yet.")

    async def stream_response(self, prompt: str, system_instruction: str | None = None) -> AsyncGenerator[str, None]:
        # Placeholder for future streaming response chunks
        raise NotImplementedError("Gemini provider streaming is not active yet.")
        yield ""
