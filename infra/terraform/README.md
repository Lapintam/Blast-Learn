# Ironsight Terraform

This directory defines the AWS infrastructure for the Ironsight multi-tenant hospital SaaS. The modules are designed to be reusable across environments (`dev`, `staging`, `prod`) and follow a least-privilege, defense-in-depth approach.

## Modules

- `network`: VPC, subnets, NAT gateways, routing
- `edge`: Internet-facing ALB with WAF + Cognito OIDC setup
- `ecs_web`: Fargate cluster/service for the Next.js application
- `ollama_asg`: GPU auto scaling group for the Ollama inference nodes
- `rds`: PostgreSQL with encryption and RLS-ready security group
- `tenant_store`: S3 bucket and KMS CMK for policy storage
- `ops`: CloudWatch, SSM, and shared observability primitives

Each environment in `envs/` wires these modules together and should be initialised with `terraform init` using an S3 + DynamoDB backend. Copy the provided `terraform.tfvars.example`, adjust values, and run `terraform plan` / `terraform apply` per environment.

> ⚠️ Sensitive secrets such as database passwords must be stored in AWS Secrets Manager or SSM Parameter Store. The Terraform variables are placeholders and should reference secure parameters rather than inline secrets in production.
