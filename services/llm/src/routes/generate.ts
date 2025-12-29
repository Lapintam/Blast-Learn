import type { FastifyInstance } from "fastify";
import { z } from "zod";
import fetch from "node-fetch";

const GenerateSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  stream: z.boolean().default(false),
});

export function registerGenerateRoute(server: FastifyInstance) {
  server.post("/generate", async (request, reply) => {
    const parsed = GenerateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const config = server.llmConfig;
    const { prompt, model, stream } = parsed.data;

    const response = await fetch(`${config.ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        prompt,
        model: model ?? config.defaultModel,
        stream,
      }),
    });

    if (!response.ok) {
      return reply.code(502).send({ error: "Ollama request failed" });
    }

    if (stream) {
      reply.header("content-type", response.headers.get("content-type") ?? "application/json");
      reply.send(response.body);
      return reply;
    }

    const data = await response.json();
    return data;
  });
}
