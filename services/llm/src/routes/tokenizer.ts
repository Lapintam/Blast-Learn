import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getEncoding } from "@dqbd/tiktoken";

const encoding = getEncoding("cl100k_base");

const TokenizerSchema = z.object({ text: z.string() });

export function registerTokenizerRoute(server: FastifyInstance) {
  server.post("/tokenizer", async (request, reply) => {
    const parsed = TokenizerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const tokens = encoding.encode(parsed.data.text);
    return { tokens: tokens.length };
  });
}
