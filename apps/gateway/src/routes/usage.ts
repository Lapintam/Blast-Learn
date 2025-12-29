import type { FastifyInstance } from "fastify";
import { withTenantTransaction } from "@ironsight/db";

export function registerUsageRoutes(server: FastifyInstance) {
  server.get("/usage/summary", async (request, reply) => {
    const session = request.tenantSession;
    if (!session) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [aggregates, tenant] = await withTenantTransaction(session.tenantId, (tx) =>
      Promise.all([
        tx.usageAggregate.findMany({
          where: { hour: { gte: sevenDaysAgo } },
          orderBy: { hour: "desc" },
        }),
        tx.tenant.findUnique({ where: { id: session.tenantId } }),
      ]),
    );

    return {
      aggregates,
      stripeMeterStatus: tenant?.stripeSubscriptionId
        ? {
            subscriptionId: tenant.stripeSubscriptionId,
            currentPeriodEnd: new Date().toISOString(),
            totalUsage: aggregates.reduce((acc, aggregate) => acc + aggregate.inputTokens + aggregate.outputTokens, 0),
          }
        : undefined,
    };
  });
}
