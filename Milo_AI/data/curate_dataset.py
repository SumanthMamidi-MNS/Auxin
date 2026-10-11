# Milo_AI/data/curate_dataset.py
"""
Auxin AI — Phase 2 Master Dataset Curation & Preprocessing Pipeline
Transforms master_dataset_10500.jsonl into deduplicated, structured semantic knowledge documents.
"""

import os
import sys
import json
import re
from collections import defaultdict, Counter
from typing import Dict, List, Any

def clean_text(text: str) -> str:
    """Normalize whitespace and remove repetitive bot introductory prefixes."""
    text = text.strip()
    text = re.sub(r"^(Milo\s*—\s*The\s*AI\s*Assistant\s*for\s*Auxin\.?\s*)", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def curate_master_dataset(
    raw_file_path: str,
    output_dir: str
) -> Dict[str, Any]:
    os.makedirs(output_dir, exist_ok=True)
    curated_file_path = os.path.join(output_dir, "curated_knowledge_documents.jsonl")
    summary_file_path = os.path.join(output_dir, "curation_summary.json")

    total_records = 0
    valid_records = 0
    malformed_records = 0
    empty_records = 0
    duplicate_records = 0

    seen_keys = set()
    curated_docs: List[Dict[str, Any]] = []

    role_counts = Counter()
    category_counts = Counter()
    phase_counts = Counter()
    type_counts = Counter()

    print(f"[Curation] Reading raw dataset from: {raw_file_path}")

    with open(raw_file_path, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            total_records += 1

            try:
                item = json.loads(line)
            except Exception as e:
                malformed_records += 1
                continue

            doc_id = item.get("id", f"doc_{line_num}")
            role = item.get("role", "customer").lower().strip()
            category = item.get("category", "general").lower().strip()
            phase = item.get("phase", "phase_1")
            conv_type = item.get("conversation_type", "single_turn")
            messages = item.get("messages", [])

            user_queries = []
            assistant_answers = []
            turns = []

            for msg in messages:
                m_role = msg.get("role")
                m_content = clean_text(msg.get("content", ""))
                if not m_content:
                    continue

                if m_role == "user":
                    user_queries.append(m_content)
                    turns.append(f"User: {m_content}")
                elif m_role == "assistant":
                    assistant_answers.append(m_content)
                    turns.append(f"Milo: {m_content}")

            if not user_queries or not assistant_answers:
                empty_records += 1
                continue

            valid_records += 1
            primary_query = user_queries[0]
            primary_answer = assistant_answers[-1]

            # Normalization key for deduplication
            norm_query = re.sub(r"[^\w\s]", "", primary_query.lower())
            norm_key = (role, category, norm_query)

            if norm_key in seen_keys:
                duplicate_records += 1
                continue
            seen_keys.add(norm_key)

            # Build semantic content block
            if len(user_queries) == 1 and len(assistant_answers) == 1:
                content = f"Question: {primary_query}\nAnswer: {primary_answer}"
            else:
                dialogue_flow = "\n".join(turns)
                content = f"Topic / Query: {primary_query}\nDialogue Flow:\n{dialogue_flow}\nKey Guidance: {primary_answer}"

            curated_doc = {
                "document_id": doc_id,
                "role": role,
                "category": category,
                "phase": phase,
                "conversation_type": conv_type,
                "title": primary_query[:100],
                "query": primary_query,
                "answer": primary_answer,
                "content": content,
                "token_estimate": len(content.split()),
                "source": "master_dataset_10500",
                "is_curated": True
            }

            curated_docs.append(curated_doc)
            role_counts[role] += 1
            category_counts[category] += 1
            phase_counts[phase] += 1
            type_counts[conv_type] += 1

    # Write curated documents
    with open(curated_file_path, "w", encoding="utf-8") as out_f:
        for doc in curated_docs:
            out_f.write(json.dumps(doc, ensure_ascii=False) + "\n")

    summary = {
        "raw_dataset_path": raw_file_path,
        "curated_dataset_path": curated_file_path,
        "total_records_scanned": total_records,
        "valid_records_extracted": valid_records,
        "malformed_records": malformed_records,
        "empty_records": empty_records,
        "duplicate_records_merged": duplicate_records,
        "final_curated_records_count": len(curated_docs),
        "role_breakdown": dict(role_counts),
        "phase_breakdown": dict(phase_counts),
        "conversation_types": dict(type_counts),
        "total_categories_count": len(category_counts),
        "top_categories": category_counts.most_common(15)
    }

    with open(summary_file_path, "w", encoding="utf-8") as sum_f:
        json.dump(summary, sum_f, indent=2, ensure_ascii=False)

    print(f"[Curation Complete] Saved {len(curated_docs)} curated records to {curated_file_path}")
    print(f"[Summary] Duplicates filtered: {duplicate_records} | Roles: {dict(role_counts)}")
    return summary

if __name__ == "__main__":
    raw_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "raw", "master_dataset_10500.jsonl"))
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "curated"))
    curate_master_dataset(raw_path, out_dir)
