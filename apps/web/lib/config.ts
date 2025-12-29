import { z } from "zod";

const ServerConfigSchema = z.object({
  nodeEnv: z.enum(["development", "test", "staging", "production"]).default("development"),
  gatewayUrl: z.string().url("NEXT_PUBLIC_GATEWAY_URL is required"),
  internalGatewayUrl: z.string().url().optional(),
  stripePublishableKey: z.string().optional(),
  ollamaGatewayUrl: z.string().url("OLLAMA_GATEWAY_URL required"),
  pineconeIndex: z.string().optional(),
  pineconeEnvironment: z.string().optional(),
  pineconeApiKey: z.string().optional(),
  awsRegion: z.string().default("us-east-1"),
  parameterStorePrefix: z.string().default("/ironsight"),
  fallbackUserPoolId: z.string().optional(),
  fallbackAppClientId: z.string().optional(),
  fallbackCognitoDomain: z.string().optional(),
  fallbackOidcDiscoveryEndpoint: z.string().optional(),
});

type ServerConfig = z.infer<typeof ServerConfigSchema>;

let cached: ServerConfig | null = null;

export function getServerConfig(): ServerConfig {
  if (cached) return cached;
  cached = ServerConfigSchema.parse({
    nodeEnv: process.env.NODE_ENV,
    gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL,
    internalGatewayUrl: process.env.GATEWAY_INTERNAL_URL,
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    ollamaGatewayUrl: process.env.OLLAMA_GATEWAY_URL,
    pineconeIndex: process.env.PINECONE_INDEX,
    pineconeEnvironment: process.env.PINECONE_ENVIRONMENT,
    pineconeApiKey: process.env.PINECONE_API_KEY,
    awsRegion: process.env.AWS_REGION,
    parameterStorePrefix: process.env.PARAMETER_STORE_PREFIX,
    fallbackUserPoolId: process.env.DEV_COGNITO_USER_POOL_ID,
    fallbackAppClientId: process.env.DEV_COGNITO_APP_CLIENT_ID,
    fallbackCognitoDomain: process.env.DEV_COGNITO_DOMAIN,
    fallbackOidcDiscoveryEndpoint: process.env.DEV_COGNITO_DISCOVERY_ENDPOINT,
  });
  return cached;
}

if (!process.env.NEXT_PUBLIC_GATEWAY_URL) {
  throw new Error("NEXT_PUBLIC_GATEWAY_URL must be defined");
}

export const clientConfig = {
  gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
};
