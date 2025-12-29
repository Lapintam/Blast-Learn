import { Pinecone, type ScoredVector } from "@pinecone-database/pinecone";
import type { VectorRecord } from "./embedder";

export type PineconeConfig = {
  apiKey: string;
  environment: string;
  index: string;
};

const clientCache = new Map<string, Pinecone>();

export function getPineconeClient(config: PineconeConfig): Pinecone {
  const cacheKey = `${config.apiKey}:${config.environment}`;
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }

  const client = new Pinecone({ apiKey: config.apiKey });
  clientCache.set(cacheKey, client);
  return client;
}

export function tenantNamespace(tenantId: string): string {
  return tenantId.replace(/[^a-zA-Z0-9-_]/g, "-");
}

export async function upsertVectors(
  config: PineconeConfig,
  records: VectorRecord[],
  tenantId: string,
): Promise<void> {
  if (records.length === 0) return;
  const client = getPineconeClient(config);
  const namespace = tenantNamespace(tenantId);
  const index = client.index(config.index).namespace(namespace);
  await index.upsert(records);
}

export type QueryOptions = {
  topK: number;
  includeMetadata?: boolean;
  filter?: Record<string, unknown>;
};

export async function querySimilar(
  config: PineconeConfig,
  vector: number[],
  tenantId: string,
  options: QueryOptions,
): Promise<ScoredVector[]> {
  const client = getPineconeClient(config);
  const namespace = tenantNamespace(tenantId);
  const index = client.index(config.index).namespace(namespace);
  const response = await index.query({
    topK: options.topK,
    vector,
    includeMetadata: options.includeMetadata ?? true,
    filter: options.filter,
  });
  return response.matches ?? [];
}
