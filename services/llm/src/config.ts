import { z } from "zod";

const LlmConfigSchema = z.object({
  port: z.coerce.number().default(4003),
  ollamaBaseUrl: z.string().url().default("http://127.0.0.1:11434"),
  defaultModel: z.string().default("llama3"),
});

type LlmConfig = z.infer<typeof LlmConfigSchema>;

let cached: LlmConfig | null = null;

export function getLlmConfig(): LlmConfig {
  if (cached) return cached;
  cached = LlmConfigSchema.parse({
    port: process.env.PORT,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
    defaultModel: process.env.OLLAMA_MODEL,
  });
  return cached;
}
