import Fastify from "fastify";
import sensible from "@fastify/sensible";
import { getBillingConfig, type BillingConfig } from "./config";
import { registerWebhookRoute } from "./routes/webhook";
import { registerUsageRoutes } from "./routes/usage";

declare module "fastify" {
  interface FastifyInstance {
    billingConfig: BillingConfig;
  }
}

export function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
    },
  });
  server.decorate("billingConfig", getBillingConfig());
  server.register(sensible);
  registerWebhookRoute(server);
  registerUsageRoutes(server);
  return server;
}
