import Fastify from "fastify";
import sensible from "@fastify/sensible";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import authPlugin from "./plugins/auth";
import { getGatewayConfig, type GatewayConfig } from "./config";
import { registerHealthRoutes } from "./routes/health";
import { registerTenantRoutes } from "./routes/tenants";
import { registerPolicyRoutes } from "./routes/policies";
import { registerQueryRoutes } from "./routes/query";
import { registerUsageRoutes } from "./routes/usage";
import { registerIngestRoutes } from "./routes/ingest";

declare module "fastify" {
  interface FastifyInstance {
    gatewayConfig: GatewayConfig;
  }
}

export function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
    },
  });

  const config = getGatewayConfig();
  server.decorate("gatewayConfig", config);

  server.register(helmet, { global: true });
  server.register(cors, { origin: true, credentials: true });
  server.register(sensible);
  server.register(multipart, { limits: { fileSize: 25 * 1024 * 1024, files: 50 } });

  server.register(authPlugin);

  registerHealthRoutes(server);
  registerTenantRoutes(server);
  registerPolicyRoutes(server);
  registerQueryRoutes(server);
  registerIngestRoutes(server);
  registerUsageRoutes(server);

  return server;
}
