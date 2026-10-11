# app/services/milo/providers/claude.py
from typing import Any, AsyncGenerator
from app.services.milo.providers.base import BaseLLMProvider

class AnthropicClaudeProvider(BaseLLMProvider):
    """
    Anthropic Claude integration stub for future active mode.
    """

    async def generate_response(self, prompt: str, system_instruction: str | None = None) -> str:
        # Placeholder for future Anthropic client call
        raise NotImplementedError("Anthropic Claude provider is not active yet.")

    async def stream_response(self, prompt: str, system_instruction: str | None = None) -> AsyncGenerator[str, None]:
        # Placeholder for future streaming response chunks
        raise NotImplementedError("Anthropic Claude provider streaming is not active yet.")
        yield ""
