# Ironsight On-Call Runbook

## Primary Objectives
- Maintain tenant isolation across API gateway, database, and vector store.
- Ensure Cognito → ALB header propagation survives deploys.
- Keep Ollama GPU fleet healthy and within autoscaling envelope.

## Triage Checklist
1. **Identify tenant**: Every alert includes `tenant_id`. Confirm scope before taking action.
2. **Check status page**: `/health` on the gateway (`apps/gateway`) and `/health` on the LLM service (`services/llm`).
3. **Review CloudWatch dashboards**: ECS service metrics, RDS connections, Ollama ASG utilization.
4. **Verify Stripe webhooks**: Confirm recent events in `services/billing` logs for metered usage delivery.

## Common Scenarios
### 1. Policy retrieval failures
- Inspect `apps/gateway` logs for Pinecone errors.
- Run `services/ingest` `/ingest` job status to ensure latest Markdown processed.
- If Pinecone namespace missing, re-run ingestion via `/api/ingest/hierarchy` for affected tenant.

### 2. Chat latency or timeouts
- Query `services/llm` `/tokenizer` with sample prompt to validate tiktoken pipeline.
- Check Ollama ASG desired vs. actual capacity; scale up via Terraform variable or AWS console if GPU backlog persists.

### 3. Billing pipeline drift
- Trigger `POST /usage/reconcile` on `services/billing` for the tenant. Confirm usage aggregates populate and Stripe usage records succeed.

## Escalation
- Security incidents → Security & Compliance lead within 15 minutes.
- Sustained outage (>30 minutes) → Infra Architect for broader failover (multi-region).
- Billing discrepancies → Finance contact after initial triage.

## Recovery Commands
```bash
# Redeploy gateway from latest image
docker pull <registry>/gateway:latest
aws ecs update-service --cluster <cluster> --service <service> --force-new-deployment

# Replay usage reconciliation for tenant TENANT123
curl -X POST https://billing.internal/usage/reconcile -d '{"tenantId":"TENANT123"}'
```
