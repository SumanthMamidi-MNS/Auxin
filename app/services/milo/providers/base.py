# app/services/milo/providers/base.py
import abc
from typing import Any, AsyncGenerator

class BaseLLMProvider(abc.ABC):
    """
    Base abstraction layer for future Milo LLM providers.
    Supports complete pluggability for OpenAI, Gemini, Claude, Ollama, etc.
    """

    def __init__(self, model_name: str, temperature: float = 0.7, **kwargs: Any) -> None:
        self.model_name = model_name
        self.temperature = temperature
        self.extra_kwargs = kwargs

    @abc.abstractmethod
    async def generate_response(self, prompt: str, system_instruction: str | None = None) -> str:
        """
        Synthesize prompt and system instructions to return standard string response.
        """
        pass

    @abc.abstractmethod
    async def stream_response(self, prompt: str, system_instruction: str | None = None) -> AsyncGenerator[str, None]:
        """
        Generator for chunked stream response (SSE compatibility).
        """
        yield ""
