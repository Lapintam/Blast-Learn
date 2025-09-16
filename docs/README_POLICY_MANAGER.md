# Policy Manager (Enterprise, Healthcare)

A multi-tenant policy management platform (Ellucid-like) for hospitals.

## Features
- Enterprise SSO (ALB OIDC)
- Tenant isolation (schema-per-tenant), Pinecone namespaces
- PDF -> Markdown conversion using `datalab-to/marker`
- Batch and real-time ingestion
- RAG over Pinecone; Postgres for app data
- Stripe: installation fee, subscriptions, and metered usage
- Optional cloud fine-tuning with autoscaling; bill % above AWS cost

## Getting Started
1. Terraform
   - cd infra/terraform
   - Copy `terraform.tfvars.example` to `terraform.tfvars`
   - `terraform init && terraform apply`
2. App
   - Set SSM parameters for secrets (Stripe, Pinecone, OpenAI)
   - Deploy app artifact to ASG launch template AMI or user-data

## Docs
- HARDENING_CHECKLIST.md
- SIZING_CHEETSHEET.md
- POLICY_MANAGER_ARCHITECTURE.md
