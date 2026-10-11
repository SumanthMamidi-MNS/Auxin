# app/services/milo/providers/ollama.py
from typing import Any, AsyncGenerator
from app.services.milo.providers.base import BaseLLMProvider

class OllamaProvider(BaseLLMProvider):
    """
    Local Ollama integration stub for future active mode.
    """

    async def generate_response(self, prompt: str, system_instruction: str | None = None) -> str:
        # Placeholder for future local Ollama server call
        raise NotImplementedError("Ollama provider is not active yet.")

    async def stream_response(self, prompt: str, system_instruction: str | None = None) -> AsyncGenerator[str, None]:
        # Placeholder for future streaming response chunks
        raise NotImplementedError("Ollama provider streaming is not active yet.")
        yield ""
