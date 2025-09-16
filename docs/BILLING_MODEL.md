# Billing Model (Stripe)

## Products
- Installation Fee (one-time per site)
- Subscription (monthly per site)
- Usage (metered): tokens processed

## Usage Reporting
- Server records tokens for:
  - PDF conversion (per page tokens for OCR/embedding)
  - RAG queries (prompt + completion tokens)
  - Local model training time (GPU hours)
- Report via Stripe Usage Records API per subscription item (daily/hourly)

## Pricing Strategy
- Pass-through model/API cost + fixed % (e.g., +30%) to cover ops
- Volume tiers per customer

## Invoices
- Installation fee upfront
- Monthly subscription in advance
- Usage proration at month-end
