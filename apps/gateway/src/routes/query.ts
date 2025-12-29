import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { embedQueryWithOllama, querySimilar } from "@ironsight/vectors";
import { getGatewayConfig } from "../config";
import { withTenantTransaction } from "@ironsight/db";
import fetch from "node-fetch";

const QuerySchema = z.object({
  question: z.string().min(5),
  contextNodeIds: z.array(z.string()).optional(),
  facilityId: z.string().optional(),
});

function buildPrompt(question: string, contexts: Array<{ heading: string; excerpt: string }>) {
  const contextText = contexts
    .map((context, index) => `Context ${index + 1}: ${context.heading}\n${context.excerpt}`)
    .join("\n---\n");
  return `You are a compliance assistant for a hospital system. Answer the question using the provided policy context.
Always cite the policy title when available.

${contextText}

Question: ${question}
Answer:`;
}

export function registerQueryRoutes(server: FastifyInstance) {
  server.post("/query", async (request, reply) => {
    const session = request.tenantSession;
    if (!session) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const parsed = QuerySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const { question } = parsed.data;
    const config = request.server.gatewayConfig ?? getGatewayConfig();

    const embedding = await embedQueryWithOllama(question, {
      baseUrl: config.ollamaGatewayUrl,
      model: config.embeddingModel,
    });

    const matches = await querySimilar(
      {
        apiKey: config.pineconeApiKey!,
        environment: config.pineconeEnvironment!,
        index: config.pineconeIndex,
      },
      embedding,
      session.tenantId,
      { topK: 6 },
    );

    const chunkIds = matches.map((match) => match.id).filter(Boolean);

    const chunks = await withTenantTransaction(session.tenantId, (tx) =>
      tx.policyChunk.findMany({
        where: { pineconeId: { in: chunkIds } },
        include: {
          version: {
            include: {
              document: true,
            },
          },
        },
      }),
    );

    const contexts = chunks.map((chunk) => ({
      heading: chunk.headings.join(" > ") || chunk.version.document.title,
      excerpt: chunk.text,
    }));

    const prompt = buildPrompt(question, contexts);

    const response = await fetch(`${config.ollamaGatewayUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: config.chatModel,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      request.log.error({ status: response.status }, "ollama request failed");
      return reply.code(502).send({ error: "Model request failed" });
    }

    const data = (await response.json()) as { response?: string; total_duration?: number };

    await withTenantTransaction(session.tenantId, (tx) =>
      tx.usageEvent.createMany({
        data: [
          {
            tokenType: "INPUT",
            tokenCount: Math.ceil(question.length / 4),
            model: config.chatModel,
            requestId: request.id,
          },
          {
            tokenType: "OUTPUT",
            tokenCount: Math.ceil((data.response ?? "").length / 4),
            model: config.chatModel,
            requestId: request.id,
          },
        ],
      }),
    );

    return {
      answer: data.response ?? "",
      citations: chunks.map((chunk) => ({
        documentId: chunk.version.documentId,
        versionId: chunk.versionId,
        title: chunk.version.document.title,
        url: chunk.version.document.exportedSourceUrl ?? chunk.version.storageKey,
        excerpt: chunk.text.slice(0, 300),
      })),
      usage: {
        inputTokens: Math.ceil(question.length / 4),
        outputTokens: Math.ceil((data.response ?? "").length / 4),
        totalTokens: Math.ceil(question.length / 4) + Math.ceil((data.response ?? "").length / 4),
      },
    };
  });
}
