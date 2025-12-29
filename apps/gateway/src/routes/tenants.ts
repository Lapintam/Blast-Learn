import type { FastifyInstance } from "fastify";
import { withTenantTransaction } from "@ironsight/db";

export function registerTenantRoutes(server: FastifyInstance) {
  server.get("/tenants/current", async (request, reply) => {
    const session = request.tenantSession;
    if (!session) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const tenant = await withTenantTransaction(session.tenantId, (tx) =>
      tx.tenant.findUnique({
        where: { id: session.tenantId },
        include: {
          facilities: true,
        },
      }),
    );

    if (!tenant) {
      return reply.code(404).send({ error: "Tenant not found" });
    }

    return tenant;
  });
}
