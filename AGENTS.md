# Codex Agents — Ironsight Multi-Tenant Hospital SaaS

> Goal: ship a secure, multi-tenant **Next.js** SaaS for hospitals with **RAG on Markdown**, **Ollama** GPU autoscaling on AWS, **Pinecone** for vectors, **PostgreSQL** for app data (with **RLS**), **Cognito OIDC** per-tenant SSO federation, and **Stripe** (subscriptions + token-metered usage). Production-ready.

---

## Monorepo Layout
.
├─ apps/
│  ├─ web/                  # Next.js (App Router) UI + SSR
│  └─ gateway/              # FastAPI (or Node) API gateway: RBAC, metering, mTLS→Ollama
├─ services/
│  ├─ ingest/               # Markdown ingestion → chunk → embed → Pinecone
│  ├─ llm/                  # Ollama helpers, health checks, tokenizer stats
│  └─ billing/              # Stripe webhook, usage export, invoice sync
├─ infra/
│  ├─ terraform/
│  │  ├─ modules/
│  │  │  ├─ network/        # VPC, subnets, NAT, endpoints
│  │  │  ├─ edge/           # ALB + WAF + Cognito OIDC
│  │  │  ├─ ecs_web/        # ECS Fargate cluster for Next.js app
│  │  │  ├─ ollama_asg/     # EC2 GPU ASG for Ollama
│  │  │  ├─ rds/            # PostgreSQL + RLS
│  │  │  ├─ tenant_store/   # S3 + KMS per tenant
│  │  │  └─ ops/            # CloudWatch, SSM, IAM policies
│  │  └─ envs/
│  │     ├─ dev/
│  │     ├─ staging/
│  │     └─ prod/
│  └─ docker/               # Dockerfiles + local dev compose
├─ packages/
│  ├─ db/                   # Prisma schema + migrations + DB client
│  ├─ auth/                 # JWT validation, Cognito helpers, tenant claims
│  ├─ vectors/              # Pinecone client, chunker, embedding utils
│  └─ common/               # Shared types, telemetry, tracing
└─ ops/
├─ Makefile              # build/deploy targets
├─ scripts/              # bootstrap, smoke tests, canaries
└─ runbooks/             # on-call docs, security checklists

---

## Agent Roster

### 1) **Infra Architect** (`infra/terraform`)
Mission: stand up AWS infra (VPC, subnets, WAF, ALB+OIDC, ECS web, EC2 Ollama ASG, RDS Postgres, S3+KMS per tenant, CloudWatch, SSM).  
Approvals: public ingress, KMS deletion, DB destruction.  
Outputs: Terraform modules + envs with state in S3+DynamoDB.

### 2) **App Engineer** (`apps/web`, `packages/*`)
Mission: build Next.js multi-tenant UI (SSO login, dashboard, docs browser, chat RAG, admin usage panel, Markdown uploads).  
Approvals: schema changes, new API routes.  
Outputs: Next.js app + middleware.ts (tenant extraction).

### 3) **Gateway Engineer** (`apps/gateway`)
Mission: enforce RBAC + usage limits, connect to Pinecone + Postgres, expose `/query` + `/ingest`, stream responses, mTLS→Ollama.  
Approvals: authz/policy changes.  
Outputs: FastAPI/Express service + OpenAPI spec.

### 4) **RAG Engineer** (`packages/vectors`, `services/ingest`)
Mission: chunk Markdown (256–512 tokens), embed, Pinecone namespace per tenant, top-k retrieval with metadata and sources.  
Approvals: embedding model, chunk policy.  
Outputs: deterministic splitter + idempotent upserts.

### 5) **LLM Engineer** (`services/llm`, `infra/terraform/modules/ollama_asg`)
Mission: deploy Ollama on GPU ASG, manage quantization, streaming, readiness probes.  
Approvals: model/quant changes, autoscale rules.  
Outputs: user-data, Docker run args, perf dashboards.

### 6) **Billing Engineer** (`services/billing`)
Mission: Stripe subs + metered billing, usage aggregator, alerts, webhook verifier.  
Approvals: pricing/caps changes.  
Outputs: usage tables, Stripe product IDs, webhook handlers.

### 7) **Security & Compliance** (`ops/runbooks`)
Mission: enforce hardening (WAF, SGs, RLS, KMS, SSM only, audit logs, backups, secrets).  
Approvals: control-plane/IAM changes.  
Outputs: checklists, IAM JSON, SQL RLS, canary tests.

---

## Global Conventions

- **Tenant isolation**
  - JWT `tenant_id` from Cognito → ALB header → gateway → `SET app.tenant_id` in DB.
  - S3 prefix `s3://rag-bucket/<tenant_id>/…` with CMK per tenant.
  - Pinecone namespace = `<tenant_id>`.  
  - Postgres RLS on all tenant tables.

- **Billing**
  - Usage = input_tokens + output_tokens.  
  - Persist raw events; hourly aggregates; push usage to Stripe metered items.

- **Secrets**
  - Never in code. Use AWS SSM/Secrets Manager. `.env.local` only for dev.

---

## Default Tasks

- `/init` → scaffold env files, tfvars, Prisma schema, Pinecone index, Stripe products.  
- `/plan` → Terraform plan for `envs/dev`.  
- `/deploy dev` → apply infra, run migrations, deploy ECS + ASG.  
- `/smoke` → run canary login→query→bill test.  
- `/promote staging|prod` → tag images, push, blue/green rollout.

---

## Approvals Matrix

- Public SG/ports, WAF rules → **ask**  
- KMS key deletion, DB drop → **ask**  
- Model/quant changes, autoscale rules → **ask**  
- Pricing/cap changes → **ask**  
- Routine deploys (dev) → **auto**