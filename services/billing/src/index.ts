import { buildServer } from "./server";
import { getBillingConfig } from "./config";

async function main() {
  const server = buildServer();
  const { port } = getBillingConfig();
  try {
    await server.listen({ port, host: "0.0.0.0" });
    server.log.info({ port }, "billing service listening");
  } catch (error) {
    server.log.error({ err: error }, "failed to start billing service");
    process.exit(1);
  }
}

main();
