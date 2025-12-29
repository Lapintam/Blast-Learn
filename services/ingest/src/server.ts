import Fastify from "fastify";
import sensible from "@fastify/sensible";
import { registerIngestRoute } from "./routes/ingest";

export function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
    },
  });

  server.register(sensible);
  registerIngestRoute(server);

  return server;
}
