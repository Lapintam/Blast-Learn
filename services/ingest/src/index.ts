import { buildServer } from "./server";

async function main() {
  const server = buildServer();
  const port = Number(process.env.PORT ?? 4002);
  try {
    await server.listen({ port, host: "0.0.0.0" });
    server.log.info({ port }, "ingest service listening");
  } catch (error) {
    server.log.error({ err: error }, "failed to start ingest service");
    process.exit(1);
  }
}

main();
