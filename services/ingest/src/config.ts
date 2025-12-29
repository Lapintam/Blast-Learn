import { BaseConfigSchema, loadConfig } from "@ironsight/common";
import { z } from "zod";

const IngestConfigSchema = BaseConfigSchema.extend({
  pineconeIndex: z.string().min(1),
  pineconeEnvironment: z.string().min(1),
  pineconeApiKey: z.string().min(1),
  embeddingModel: z.string().default("mxbai-embed-large"),
});

type IngestConfig = z.infer<typeof IngestConfigSchema>;

let cached: IngestConfig | null = null;

export function getIngestConfig(): IngestConfig {
  if (cached) return cached;
  cached = loadConfig(IngestConfigSchema);
  return cached;
}
