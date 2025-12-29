import type { FastifyInstance } from "fastify";
import { withTenantTransaction } from "@ironsight/db";
import fetch from "node-fetch";

export function registerIngestRoutes(server: FastifyInstance) {
  server.get("/ingest/jobs", async (request, reply) => {
    const session = request.tenantSession;
    if (!session) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const jobs = await withTenantTransaction(session.tenantId, (tx) =>
      tx.ingestJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    );

    return jobs;
  });

  server.post("/ingest/hierarchy", async (request, reply) => {
    const session = request.tenantSession;
    if (!session) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    if (!request.isMultipart()) {
      return reply.code(400).send({ error: "Expected multipart form" });
    }

    const files: { filename: string; content: string }[] = [];
    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === "file") {
        const buffer = await part.toBuffer();
        files.push({ filename: part.filename, content: buffer.toString("base64") });
      }
    }

    if (files.length === 0) {
      return reply.code(400).send({ error: "No files uploaded" });
    }

    const job = await withTenantTransaction(session.tenantId, (tx) =>
      tx.ingestJob.create({
        data: {
          tenantId: session.tenantId,
          status: "QUEUED",
          sourcePath: files[0]?.filename ?? "hierarchy",
          sourceHash: "pending",
          queuedBy: session.email,
        },
      }),
    );

    const ingestServiceUrl = server.gatewayConfig.ingestServiceUrl;

    await fetch(`${ingestServiceUrl}/ingest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: job.id,
        tenantId: session.tenantId,
        files,
      }),
    });

    return { jobId: job.id };
  });
}
