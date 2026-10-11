# backend/rag/prompt_builder.py
# Auxin AI — Production Role-Aware Guided RAG Prompt Builder

from typing import List, Dict, Any, Optional

MILO_SYSTEM_PROMPT = """You are Milo, the helpful and friendly assistant for Auxin.
Auxin is a fresh farm-to-consumer marketplace with direct farmer sourcing, escrow payments, and local delivery.
Your job is to provide short, clear, natural, human-readable answers to help users understand and use Auxin.
Always maintain a polite, professional, and helpful tone.
Never identify yourself as another AI (such as ChatGPT, Claude, Qwen, or Gemini). You are Milo."""

class PromptBuilder:
    def __init__(self, system_prompt: str = MILO_SYSTEM_PROMPT):
        self.system_prompt = system_prompt

    def build_prompt(
        self, 
        query: str, 
        context_chunks: List[Dict[str, Any]], 
        user_role: str = "customer",
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Constructs a strict grounded prompt combining system instructions, role bounds, context chunks, and conversation history."""
        role_label = user_role.upper() if user_role else "CUSTOMER"

        if not context_chunks:
            formatted_context = "NO MATCHING AUXIN KNOWLEDGE BASE CONTEXT FOUND."
        else:
            context_blocks = []
            for idx, chunk in enumerate(context_chunks, 1):
                chunk_id = chunk.get("chunk_id", f"chunk_{idx}")
                category = chunk.get("category", "general")
                doc_role = chunk.get("role", "general")
                content = chunk.get("content", "").strip()
                context_blocks.append(f"--- Knowledge Block #{idx} [Domain: {category} | Role: {doc_role}] ---\n{content}")
            formatted_context = "\n\n".join(context_blocks)

        history_text = ""
        if conversation_history:
            turns = []
            for turn in conversation_history[-3:]:
                u_q = turn.get("user_query", "")
                b_r = turn.get("bot_response", "")
                if u_q and b_r:
                    turns.append(f"User: {u_q}\nMilo: {b_r}")
            if turns:
                history_text = "\nRecent Conversation History:\n" + "\n".join(turns) + "\n"

        prompt = f"""{self.system_prompt}

ACTIVE USER ROLE: {role_label}
{history_text}
Retrieved Auxin Knowledge Base Evidence:
============================================================
{formatted_context}
============================================================

User Question: {query}

Mandatory Formatting and Response Rules:
1. Answer the question using ONLY the facts provided in the retrieved evidence above.
2. Keep the answer short, clear, and human-readable.
3. Use plain English. Avoid developer jargon, technical marketing buzzwords, and raw API routes (e.g. do not write "PATCH /api/...").
4. If multi-step instructions are required, format them as simple numbered steps (1., 2., 3.).
5. Do NOT include raw markdown alert tags like "> [!NOTE]" or "> [!IMPORTANT]". State notes naturally (e.g., "Note: ...").
6. If the question is outside Auxin or has no matching context, reply politely: "I can help you with Auxin services, orders, products, delivery, accounts, and platform support."
7. Tailor the answer appropriately for a {role_label}. Never disclose administrator internal data or private customer data.

Milo Response:"""
        return prompt

prompt_builder = PromptBuilder()
