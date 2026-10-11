# Milo_AI/data/build_production_dataset.py
"""
Auxin AI — Phase 3 Production Dataset Curation & Validation Pipeline
Curates, normalizes, and validates all 10,500 master records into production_dataset.jsonl
ensuring FINAL VALID RECORD COUNT >= 10,000 while preserving raw master dataset untouched.
"""

import os
import sys
import json
import re
from typing import Dict, List, Any

def clean_text(text: str) -> str:
    """Normalizes whitespace and cleans repetitive bot greeting headers."""
    text = text.strip()
    text = re.sub(r"^(Milo\s*—\s*The\s*AI\s*Assistant\s*for\s*Auxin\.?\s*)", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def build_production_dataset(
    raw_path: str,
    curated_dir: str,
    eval_dir: str
) -> Dict[str, Any]:
    assert os.path.exists(raw_path), f"Raw dataset not found at: {raw_path}"
    os.makedirs(curated_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)

    prod_file_path = os.path.join(curated_dir, "production_dataset.jsonl")
    eval_file_path = os.path.join(eval_dir, "evaluation_dataset.jsonl")

    total_scanned = 0
    valid_records = 0
    malformed_records = 0
    empty_records = 0
    curated_records: List[Dict[str, Any]] = []

    role_counts = {}
    category_counts = {}
    phase_counts = {}
    type_counts = {}

    print(f"[Dataset Pipeline] Reading raw master dataset: {raw_path}")

    with open(raw_path, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                empty_records += 1
                continue
            total_scanned += 1

            try:
                item = json.loads(line)
            except Exception:
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
                "title": primary_query[:120],
                "query": primary_query,
                "answer": primary_answer,
                "content": content,
                "token_estimate": len(content.split()),
                "source": "master_dataset_10500",
                "is_curated": True
            }

            curated_records.append(curated_doc)
            role_counts[role] = role_counts.get(role, 0) + 1
            category_counts[category] = category_counts.get(category, 0) + 1
            phase_counts[phase] = phase_counts.get(phase, 0) + 1
            type_counts[conv_type] = type_counts.get(conv_type, 0) + 1

    # CRITICAL CHECK: Final usable dataset must contain AT LEAST 10,000 valid records
    final_count = len(curated_records)
    print(f"[Dataset Pipeline] Total Scanned: {total_scanned} | Valid Processed: {final_count}")
    
    if final_count < 10000:
        raise ValueError(f"CRITICAL ERROR: Curated count ({final_count}) is below the required 10,000 threshold!")

    # Write production dataset
    with open(prod_file_path, "w", encoding="utf-8") as out_f:
        for doc in curated_records:
            out_f.write(json.dumps(doc, ensure_ascii=False) + "\n")

    # Generate balanced evaluation dataset (500 records spanning all roles)
    eval_records = []
    role_samples = {"customer": 0, "farmer": 0, "delivery": 0, "admin": 0, "super_admin": 0}
    role_limits = {"customer": 150, "farmer": 120, "delivery": 120, "admin": 100, "super_admin": 10}

    for doc in curated_records:
        r = doc["role"]
        if r in role_limits and role_samples[r] < role_limits[r]:
            eval_records.append(doc)
            role_samples[r] += 1

    with open(eval_file_path, "w", encoding="utf-8") as eval_f:
        for doc in eval_records:
            eval_f.write(json.dumps(doc, ensure_ascii=False) + "\n")

    summary = {
        "raw_dataset_path": raw_path,
        "production_dataset_path": prod_file_path,
        "evaluation_dataset_path": eval_file_path,
        "total_scanned": total_scanned,
        "valid_curated_records": final_count,
        "malformed_records": malformed_records,
        "empty_records": empty_records,
        "is_above_10000_threshold": final_count >= 10000,
        "role_distribution": role_counts,
        "phase_distribution": phase_counts,
        "conversation_types": type_counts,
        "unique_categories_count": len(category_counts),
        "evaluation_records_count": len(eval_records)
    }

    summary_file = os.path.join(curated_dir, "production_dataset_summary.json")
    with open(summary_file, "w", encoding="utf-8") as sum_f:
        json.dump(summary, sum_f, indent=2, ensure_ascii=False)

    print(f"[Dataset Pipeline Complete] Valid curated count: {final_count} >= 10,000 (CONFIRMED)")
    return summary

if __name__ == "__main__":
    milo_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    raw_p = os.path.join(milo_dir, "data", "raw", "master_dataset_10500.jsonl")
    cur_p = os.path.join(milo_dir, "data", "curated")
    eva_p = os.path.join(milo_dir, "data", "evaluation")
    build_production_dataset(raw_p, cur_p, eva_p)
