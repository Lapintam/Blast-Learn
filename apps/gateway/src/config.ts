import { BaseConfigSchema, loadConfig } from "@ironsight/common";
import { z } from "zod";

const GatewayConfigSchema = BaseConfigSchema.extend({
  port: z.coerce.number().default(3000),
  pineconeIndex: z.string().min(1, "PINECONE_INDEX required"),
  pineconeEnvironment: z.string().min(1, "PINECONE_ENVIRONMENT required"),
  pineconeApiKey: z.string().min(1, "PINECONE_API_KEY required"),
  jwtAudience: z.string().optional(),
  jwtIssuer: z.string().optional(),
  redisUrl: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  stripeMeteredPriceId: z.string().optional(),
  usageTopicArn: z.string().optional(),
  embeddingModel: z.string().default("mxbai-embed-large"),
  chatModel: z.string().default("llama3"),
  ingestServiceUrl: z.string().url("INGEST_SERVICE_URL must be a valid URL"),
});

export type GatewayConfig = z.infer<typeof GatewayConfigSchema>;

let cached: GatewayConfig | null = null;

export function getGatewayConfig(): GatewayConfig {
  if (cached) return cached;
  cached = loadConfig(GatewayConfigSchema);
  return cached;
}
