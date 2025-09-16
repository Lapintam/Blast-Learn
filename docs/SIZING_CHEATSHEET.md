# Sizing Cheat-Sheet: Models, Quantization, and Hardware

## AWS GPUs (Inference)
- T4g (g4dn.xlarge): 16GB GPU — good for 7B models (INT8/FP16 mix), low cost
- L4 (g6.xlarge): 24GB GPU — 7B/13B quantized (AWQ/INT4), great perf/$
- A10G (g5.xlarge): 24GB GPU — similar to L4; supports 13B INT4, 7B FP16
- A100 40GB (p4d.24xlarge slice/managed): 40GB — 34B INT4 or 13B FP16
- H100 80GB (p5.*): 80GB — 70B INT4, 34B FP8/FP16; SOTA latency

Notes:
- Prefer quantization-aware formats (AWQ/GPTQ) for 13B+ on 24GB cards
- Use tensor parallel for >40GB models; autoscale node count on traffic

## Training/Fine-tuning (Cloud)
- LoRA/QLoRA on 7B/13B: g5.2xlarge (A10G) or g6.2xlarge (L4)
- Full fine-tune 34B+: p4d/p5 multi-node with EFA; use Spot for cost

## Apple Silicon (Local Dev)
- M2 Pro: 32GB unified — 7B INT4/8-bit okay; dev/test only
- M2/M3 Max: 64-128GB — 13B INT4 workable; use Metal backends

## Model Selection
- GPT-4.1/GPT-5 (SOTA via API): Best accuracy; pay per token
- Open-source 7B/13B (Llama/Nous/Mistral): Private, cheaper at volume
- Quantization: INT4 (AWQ/GPTQ) for throughput; FP16 for quality-sensitive

## Throughput Tips
- Batch prompts with similar lengths; enable KV cache
- Use streaming responses and early-exit heuristics
- Separate real-time vs batch autoscaling groups
