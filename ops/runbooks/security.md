# Security & Compliance Checklist

## Daily
- Confirm AWS Config and GuardDuty show no high severity findings.
- Review CloudWatch metric filters for WAF blocks exceeding baseline.
- Ensure SSM patch compliance for Ollama ASG launch template.

## Weekly
- Rotate temporary ingest IAM credentials. Terraform stores tenant secret prefixes in SSM.
- Verify Postgres RLS policies by running the automated canary script (`scripts/rds_rls_canary.ts`).
- Export Pinecone namespace inventory to validate per-tenant isolation.

## Monthly
- Trigger disaster recovery drill: restore RDS snapshot into staging, apply RLS policies from `packages/db/src/sql/rls.sql`.
- Run Stripe invoice reconciliation for last cycle via `services/billing` endpoint and compare to stored aggregates.
- Review Cognito app clients for dormant tenants; disable per retention policy.

## Incident Response
1. Capture point-in-time snapshots (RDS + S3) before remediation.
2. Engage Security lead and document timeline in Ops channel.
3. For suspected credential leak, rotate Secrets Manager entries and force Cognito token revocation.
4. File post-incident report within 24 hours including tenant impact assessment.
