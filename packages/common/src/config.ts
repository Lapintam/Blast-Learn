import { z } from "zod";

export const BaseConfigSchema = z.object({
  env: z.enum(["development", "test", "staging", "production"]).default("development"),
  serviceName: z.string().min(1).default("ironsight"),
  databaseUrl: z.string().min(1, "DATABASE_URL required"),
  redisUrl: z.string().optional(),
  pineconeApiKey: z.string().optional(),
  pineconeEnvironment: z.string().optional(),
  ollamaGatewayUrl: z.string().url("OLLAMA_GATEWAY_URL must be a valid URL"),
  stripeSecretKey: z.string().optional(),
  stripeWebhookSecret: z.string().optional(),
  telemetryEndpoint: z.string().optional(),
  awsRegion: z.string().default("us-east-1"),
  parameterStorePrefix: z.string().default("/ironsight"),
});

export type BaseConfig = z.infer<typeof BaseConfigSchema>;

export function loadConfig<TSchema extends z.ZodTypeAny>(schema: TSchema, env: NodeJS.ProcessEnv = process.env): z.infer<TSchema> {
  const merged = {
    env: env.NODE_ENV,
    serviceName: env.SERVICE_NAME,
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    pineconeApiKey: env.PINECONE_API_KEY,
    pineconeEnvironment: env.PINECONE_ENVIRONMENT,
    ollamaGatewayUrl: env.OLLAMA_GATEWAY_URL,
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
    telemetryEndpoint: env.TELEMETRY_ENDPOINT,
    awsRegion: env.AWS_REGION,
    parameterStorePrefix: env.PARAMETER_STORE_PREFIX,
  };

  return schema.parse(merged);
}
