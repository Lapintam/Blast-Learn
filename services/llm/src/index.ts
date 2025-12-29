import { buildServer } from "./server";
import { getLlmConfig } from "./config";

async function main() {
  const server = buildServer();
  const { port } = getLlmConfig();
  try {
    await server.listen({ port, host: "0.0.0.0" });
    server.log.info({ port }, "llm service listening");
  } catch (error) {
    server.log.error({ err: error }, "failed to start llm service");
    process.exit(1);
  }
}

main();
