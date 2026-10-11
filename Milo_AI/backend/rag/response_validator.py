# backend/rag/response_validator.py
# Auxin AI — Production Grounded Response, Role Isolation & Error Sanitization Validator

import re
from typing import Dict, Any, List, Optional

SAFE_REFUSAL_MESSAGE = "I can help you with Auxin services, orders, products, delivery, accounts, and platform support."
USER_SAFE_ERROR_FALLBACK = "Sorry, I’m having trouble getting that information right now. Please try again in a moment."

CONFIDENTIAL_ADMIN_LEAK_KEYWORDS = [
    "super_admin_password",
    "postgresql+asyncpg://",
    "jwt_secret",
    "bank_account_encryption_key",
    "bypass admin verification",
    "arbitration override token"
]

TECHNICAL_ERROR_SIGNATURES = [
    "http error",
    "read operation timed out",
    "vector database error",
    "gemini exception",
    "traceback",
    "connection refused",
    "internal server error",
    "503 service unavailable",
    "note: answer synthesized",
    "failed to fetch"
]

def clean_markdown_and_technical_text(text: str) -> str:
    """Strips raw markdown alerts, code examples, API routes, and formatting glitches into clean, readable text."""
    if not text:
        return ""

    # Replace markdown alerts: > [!NOTE], > [!IMPORTANT], > [!WARNING]
    cleaned = re.sub(r'>\s*\[!(?:NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]\s*', '', text, flags=re.IGNORECASE)
    
    # Clean leading blockquote markers
    cleaned = re.sub(r'^\s*>\s*', '', cleaned, flags=re.MULTILINE)
    
    # Strip markdown headers (e.g. ## Notes & Warnings)
    cleaned = re.sub(r'^\s*#{1,6}\s*', '', cleaned, flags=re.MULTILINE)
    
    # Strip API Examples sections and developer routes
    cleaned = re.sub(r'(?i)\bExamples\b\s*\n(?:[^\n]+\n?)*?(?=\n[A-Z]|\n\n|$)', '', cleaned)
    cleaned = re.sub(r'(?i)[•\*\-]?\s*\*\*[^*]+(?:API|Endpoint|Route)\*\*:[^\n]+', '', cleaned)
    cleaned = re.sub(r'(?:GET|POST|PUT|PATCH|DELETE)\s+/[^\s\n]+', '', cleaned)
    cleaned = re.sub(r'\{[^{}]*"(?:order_id|status|reason|user_id|trigger_refund)"[^{}]*\}', '', cleaned)
    
    # Strip Question / Answer prefix from dataset format
    cleaned = re.sub(r'^(?:Question|Q):\s*[^\n]+\n+(?:Answer|A):\s*', '', cleaned, flags=re.IGNORECASE)

    # Convert asterisks/dash bullets to clean bullets
    cleaned = re.sub(r'^\s*[\*\-]\s+', '• ', cleaned, flags=re.MULTILINE)
    
    # Remove metadata lines
    lines = [
        line for line in cleaned.split("\n")
        if not any(line.strip().lower().startswith(k) for k in ["title:", "category:", "role:", "version:", "source:", "---", "purpose:", "content:"])
    ]
    cleaned = "\n".join(lines)
    
    # Remove multiple consecutive blank lines
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned).strip()
    
    return cleaned

class ResponseValidator:
    def validate_response(
        self,
        query: str,
        raw_answer: str,
        retrieved_chunks: List[Dict[str, Any]],
        user_role: str = "customer",
        confidence: str = "STRONG"
    ) -> Dict[str, Any]:
        """
        Validates generated answer against ground truth context, role isolation, and technical error leakage.
        """
        reasons = []
        is_grounded = True
        is_valid = True

        # Check 1: Non-empty response
        if not raw_answer or not raw_answer.strip():
            return {
                "is_valid": False,
                "is_grounded": False,
                "confidence": confidence,
                "sanitized_answer": USER_SAFE_ERROR_FALLBACK,
                "reasons": ["Empty response generated."]
            }

        cleaned_answer = raw_answer.strip()

        # Check 2: Technical Error Signature Sanitization (Never expose internal error details to user)
        lower_ans = cleaned_answer.lower()
        for sig in TECHNICAL_ERROR_SIGNATURES:
            if sig in lower_ans:
                if retrieved_chunks and confidence != "NO_MATCH":
                    first_content = retrieved_chunks[0].get("content", "")
                    paragraphs = [p.strip() for p in first_content.split("\n\n") if p.strip() and not p.strip().startswith("---") and not p.strip().startswith("title:")]
                    if paragraphs:
                        cleaned_answer = paragraphs[0]
                    else:
                        cleaned_answer = USER_SAFE_ERROR_FALLBACK
                else:
                    cleaned_answer = USER_SAFE_ERROR_FALLBACK
                is_valid = False
                reasons.append(f"Internal technical error signature '{sig}' sanitized from user response.")
                break

        # Check 3: Low-confidence / Out-of-Domain Query Rejection
        if confidence == "NO_MATCH" or not retrieved_chunks:
            is_grounded = False
            ack_phrases = ["couldn't find", "could not find", "not available in", "auxin knowledge base", "please contact", "trouble retrieving", "can help you with auxin"]
            if not any(phrase in cleaned_answer.lower() for phrase in ack_phrases):
                cleaned_answer = SAFE_REFUSAL_MESSAGE
                reasons.append("Low confidence retrieval; enforced safe refusal.")

        # Check 4: Role Leakage Check
        if user_role.lower() not in ["admin", "super_admin"]:
            for keyword in CONFIDENTIAL_ADMIN_LEAK_KEYWORDS:
                if keyword in cleaned_answer.lower():
                    cleaned_answer = SAFE_REFUSAL_MESSAGE
                    is_valid = False
                    reasons.append(f"Security violation: confidential admin term '{keyword}' detected in lower-privilege response.")
                    break

        # Check 5: Formatting and Markdown Cleanup
        cleaned_answer = clean_markdown_and_technical_text(cleaned_answer)

        return {
            "is_valid": is_valid,
            "is_grounded": is_grounded,
            "confidence": confidence,
            "sanitized_answer": cleaned_answer,
            "reasons": reasons
        }

response_validator = ResponseValidator()
