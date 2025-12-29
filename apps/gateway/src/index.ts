import { buildServer } from "./server";
import { getGatewayConfig } from "./config";

async function main() {
  const server = buildServer();
  const config = getGatewayConfig();
  try {
    await server.listen({ port: config.port, host: "0.0.0.0" });
    server.log.info({ port: config.port }, "gateway listening");
  } catch (error) {
    server.log.error({ err: error }, "failed to start gateway");
    process.exit(1);
  }
}

main();
