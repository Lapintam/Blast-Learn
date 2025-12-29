# Billing & Metering Runbook

## Stripe Integration
- Webhook endpoint: `services/billing /webhook` with secret `${STRIPE_WEBHOOK_SECRET}`.
- Metered price ID stored in Terraform variable `stripe_metered_price_id`.
- Usage reconciliation endpoint: `POST /usage/reconcile` with payload `{ "tenantId": "<TENANT_ID>" }`.

## Daily Checks
- Ensure hourly `UsageAggregate` rows exist for each active tenant (view via SQL: `select tenant_id, hour from "UsageAggregate" order by hour desc limit 20;`).
- Confirm Stripe usage records were created (Stripe Dashboard → Subscriptions → Usage records).

## Manual Reconciliation
1. Pull gateway logs for `usageEvent.createMany` to gather token totals.
2. Call `/usage/reconcile` endpoint to replay aggregation.
3. Verify resulting Stripe usage record timestamp matches aggregation hour.

## Common Issues
- **Stripe 400 errors**: Typically missing subscription item matching `STRIPE_METERED_PRICE_ID`. Update tenant subscription to include metered price.
- **Usage gaps**: Check `services/gateway` `/query` logs; ensure question/answer tokens persisted. Inspect `UsageEvent` table for gaps.
- **Webhook failures**: Use Stripe CLI `stripe listen --forward-to localhost:4004/webhook` during debugging.
