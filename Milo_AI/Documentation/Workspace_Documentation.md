# Milo AI Engineering Workspace Documentation

## 1. Overview
The `Milo_AI` workspace isolates all MLOps, model engineering, dataset management, fine-tuning, evaluation, and quantization workflows from application source code.

## 2. Directory Purpose & Responsibilities
- **Dataset/**: Houses production training datasets (`Auxin_Milo_Training_Dataset_v3.jsonl`). Production datasets are read-only and immutable.
- **Training/**: Contains MLOps training logs, TensorBoard runs, metrics, and dataset splits (80/10/10 train/val/test).
- **Evaluation/**: Automated benchmark evaluation suites covering prompt injection defense, role adherence, latency, and hallucination tests.
- **Models/**: Central repository for base model weights, trained LoRA adapters, merged 16-bit weights, 4-bit/8-bit GGUF quantization exports, and safetensors.
- **Checkpoints/**: Epoch checkpoints, recovery states, and best model weights.
- **Configs/**: YAML/JSON configuration files for PEFT/LoRA, BitsAndBytes QLoRA, training hyperparameters, and export pipelines.
- **Experiments/**: Isolated, reproducible experiment tracking directories (`Experiment_001`, `Experiment_002`, `Experiment_003`).

## 3. Dataset & Model Versioning Strategy
- Datasets follow strict semantic versioning (`v1`, `v2`, `v3`).
- Models and adapters are tagged with experiment numbers and timestamps (e.g. `Milo-Gemma-2B-QLoRA-Exp001`).

## 4. MLOps Fine-Tuning Pipeline Workflow
1. **Data Prep**: Load `Auxin_Milo_Training_Dataset_v3.jsonl`, tokenize, and split into train/val/test.
2. **Configuration**: Load QLoRA config from `Configs/QLoRA/qlora_config.json`.
3. **Training**: Execute LoRA adapter training using Unsloth/TRL/Hugging Face Accelerate. Save checkpoints to `Checkpoints/`.
4. **Evaluation**: Benchmark adapter against `Evaluation/` suites for role adherence and safety.
5. **Merge & Quantize**: Merge LoRA adapter into base weights, export GGUF/Safetensors to `Models/Production_Releases/`.
