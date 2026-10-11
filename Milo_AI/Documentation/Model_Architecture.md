# Milo AI — Model Architecture & QLoRA Design

## Base Model
- **Model**: `unsloth/gemma-2-2b-it-bnb-4bit` (Gemma 2 2B Instruction Tuned)
- **Parameters**: 2.6 Billion
- **Context Length**: 8,192 tokens (Truncated to 1,024 for 4GB VRAM training)

## Local Inference Model vs QLoRA Checkpoint
- **Existing Local Model**: `gemma2:2b-instruct-q4_K_M` (1.7GB GGUF binary in Ollama).
  - *Note*: GGUF binaries are pre-quantized static weights designed strictly for fast local CPU/GPU inference. They do NOT contain PyTorch float tensors or computation graphs required for backpropagation.
- **QLoRA Training Checkpoint**: `unsloth/gemma-2-2b-it-bnb-4bit` is used for fine-tuning because it retains trainable LoRA adapter projection layers.

## PEFT / LoRA Adapter Parameters
- **LoRA Rank ($r$)**: 16
- **LoRA Alpha ($\\alpha$)**: 32
- **Target Modules**: `q_proj`, `k_proj`, `v_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj`
- **Trainable Parameters**: ~18.4 Million (~0.7% of total model weights)
