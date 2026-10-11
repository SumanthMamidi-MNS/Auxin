# config/constants.py
# Auxin AI v9.0 — System Constants & RAG Parameters

EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"
EMBEDDING_DIMENSION = 384
CHUNK_SIZE_TOKENS = 512
CHUNK_OVERLAP_TOKENS = 64

# Category Enum Constants
KNOWLEDGE_CATEGORIES = [
    "customer",
    "farmer",
    "delivery",
    "payments",
    "admin",
    "policies",
    "faqs",
    "government",
    "support"
]

# Stakeholder Roles
ROLES = ["customer", "farmer", "delivery", "admin", "faqs", "government", "support", "all"]
