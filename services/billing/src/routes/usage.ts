import type { FastifyInstance } from "fastify";
import { z } from "zod";
import Stripe from "stripe";
import { withTenantTransaction } from "@ironsight/db";
import { getLogger } from "@ironsight/common";

const ReconcileSchema = z.object({
  tenantId: z.string(),
  since: z.string().datetime().optional(),
});

function truncateHour(date: Date): Date {
  const truncated = new Date(date);
  truncated.setMinutes(0, 0, 0);
  return truncated;
}

export function registerUsageRoutes(server: FastifyInstance) {
  const config = server.billingConfig;
  const stripe = new Stripe(config.stripeSecretKey, { apiVersion: "2023-10-16" });
  const logger = getLogger();

  server.post("/usage/reconcile", async (request, reply) => {
    const parsed = ReconcileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const { tenantId, since } = parsed.data;
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const tenant = await withTenantTransaction(tenantId, (tx) =>
      tx.tenant.findUnique({ where: { id: tenantId } }),
    );

    if (!tenant) {
      return reply.code(404).send({ error: "Tenant not found" });
    }

    const events = await withTenantTransaction(tenantId, (tx) =>
      tx.usageEvent.findMany({
        where: { occurredAt: { gte: sinceDate } },
        orderBy: { occurredAt: "asc" },
      }),
    );

    const aggregates = new Map<string, { hour: Date; input: number; output: number }>();

    for (const event of events) {
      const hour = truncateHour(event.occurredAt);
      const key = hour.toISOString();
      if (!aggregates.has(key)) {
        aggregates.set(key, { hour, input: 0, output: 0 });
      }
      const bucket = aggregates.get(key)!;
      if (event.tokenType === "INPUT") {
        bucket.input += event.tokenCount;
      } else {
        bucket.output += event.tokenCount;
      }
    }

    await withTenantTransaction(tenantId, async (tx) => {
      for (const aggregate of aggregates.values()) {
        await tx.usageAggregate.upsert({
          where: {
            tenantId_hour: {
              tenantId,
              hour: aggregate.hour,
            },
          },
          update: {
            inputTokens: aggregate.input,
            outputTokens: aggregate.output,
            totalCostCents: Math.round((aggregate.input + aggregate.output) / 1000),
          },
          create: {
            hour: aggregate.hour,
            inputTokens: aggregate.input,
            outputTokens: aggregate.output,
            totalCostCents: Math.round((aggregate.input + aggregate.output) / 1000),
          },
        });
      }
    });

    if (tenant.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
        const item = subscription.items.data.find((entry) => entry.price.id === config.stripeMeteredPriceId);
        if (item) {
          for (const aggregate of aggregates.values()) {
            await stripe.subscriptionItems.createUsageRecord(item.id, {
              action: "set",
              quantity: aggregate.input + aggregate.output,
              timestamp: Math.floor(aggregate.hour.getTime() / 1000),
            });
          }
        }
      } catch (error) {
        logger.error({ err: error }, "Failed to push usage to Stripe");
      }
    }

    return reply.send({ processed: aggregates.size });
  });
}
