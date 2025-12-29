import { z } from "zod";

const BillingConfigSchema = z.object({
  port: z.coerce.number().default(4004),
  stripeSecretKey: z.string().min(1, "STRIPE_SECRET_KEY required"),
  stripeWebhookSecret: z.string().optional(),
  stripeMeteredPriceId: z.string().min(1, "STRIPE_METERED_PRICE_ID required"),
});

type BillingConfig = z.infer<typeof BillingConfigSchema>;

let cached: BillingConfig | null = null;

export function getBillingConfig(): BillingConfig {
  if (cached) return cached;
  cached = BillingConfigSchema.parse({
    port: process.env.PORT,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripeMeteredPriceId: process.env.STRIPE_METERED_PRICE_ID,
  });
  return cached;
}
