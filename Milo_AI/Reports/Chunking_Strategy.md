# 🛡️ AUXIN AI v9.0 — CHUNKING STRATEGY PLAN

**Strategy Version**: 1.0
**Target Embedding Model**: `BAAI/bge-small-en-v1.5`
**Status**: 🟢 CHUNKING ALGORITHM DESIGNED

---

## 1. Chunking Hyperparameters

- **Chunk Size**: `512 tokens` (approx. 350-400 words)
- **Chunk Overlap**: `64 tokens` (sliding window context preservation)
- **Tokenization Metric**: BAAI / Hugging Face BERT Tokenizer
- **Splitting Strategy**: Structural Markdown Heading Splitting (`# Title`, `## Purpose`, `## Content`, `## Examples`)

---

## 2. Stable Chunk ID & Metadata Propagation

- **Chunk ID Format**: `{document_slug}__c{chunk_index:03d}` (e.g. `customer_registration_auth__c001`)
- **Metadata Inheritance**: Every chunk inherits parent document YAML frontmatter (`title`, `category`, `role`, `source_file`, `version`, `keywords`).
- **Incremental Updates**: Stable Chunk IDs enable upsert functionality in Supabase `document_chunks` table without producing orphan vectors.
