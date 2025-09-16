# Policy Manager Architecture (Multi-tenant, Healthcare)

## Goals
- Sell per hospital site with enterprise SSO
- Isolate tenants cost-effectively; HIPAA-aware controls
- RAG on PDFs converted to Markdown (marker) with batch + real-time
- Billing: Stripe subscription + per-token usage (OpenAI/local model)
- Data: Pinecone for vectors, Postgres for app data

## Multi-tenant Isolation
- Logical isolation per-tenant (schema-per-tenant in Postgres) for cost-efficiency
- Pinecone: per-tenant index namespace; per-tenant API key (scoped)
- S3/EBS storage per-tenant prefixes; signed URLs only
- Optional stronger isolation: account-per-tenant or VPC-per-tenant

## Identity / SSO
- ALB OIDC (Azure AD/Okta); app consumes JWT claims for tenant + roles
- Admin console for tenant/user provisioning, role-based access

## Ingestion
- PDFs uploaded -> S3/EBS -> batch job converts with marker to Markdown
- Real-time endpoint: immediate conversion path for urgent policies
- Markdown chunked and embedded to Pinecone under tenant namespace

## RAG
- Retrieve from Pinecone (namespace: tenant)
- Context window & safety prompts tuned for clinical guidance
- Sources returned for auditability

## Billing
- Stripe products:
  - Installation (one-time per site)
  - Subscription (monthly base)
  - Usage (metered, per token, percentage above API cost)
- Server writes usage records per request and reports to Stripe usage

## Data
- Postgres schemas per tenant: users, files, jobs, usage, invoices
- CloudWatch logs + audit table for access traceability

## Operations
- Terraform: VPC, ALB+OIDC, EC2 ASG, EBS, CloudWatch, SSM
- Blue/green via ASG replacement; health checks on /api/health
- Secrets via SSM Parameter Store; CI deploy IAM role
