import Fastify from "fastify";
import sensible from "@fastify/sensible";
import { registerHealthRoute } from "./routes/health";
import { registerGenerateRoute } from "./routes/generate";
import { registerTokenizerRoute } from "./routes/tokenizer";
import { getLlmConfig, type LlmConfig } from "./config";

declare module "fastify" {
  interface FastifyInstance {
    llmConfig: LlmConfig;
  }
}

export function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
    },
  });

  server.decorate("llmConfig", getLlmConfig());
  server.register(sensible);
  registerHealthRoute(server);
  registerGenerateRoute(server);
  registerTokenizerRoute(server);

  return server;
}
