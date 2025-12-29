import type { FastifyInstance } from "fastify";

export function registerHealthRoute(server: FastifyInstance) {
  server.get("/health", async () => ({ status: "ok" }));
}
