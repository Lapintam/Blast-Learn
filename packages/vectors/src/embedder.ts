import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { HierarchicalChunk } from "./chunker";

export type EmbeddingConfig = {
  baseUrl: string;
  model: string;
  keepAlive?: string;
};

export type VectorRecord = {
  id: string;
  values: number[];
  metadata: Record<string, string | number | boolean>;
};

function serializeMetadata(chunk: HierarchicalChunk): Record<string, string | number | boolean> {
  const { metadata } = chunk;
  return {
    tenantId: metadata.tenantId,
    documentId: metadata.documentId,
    versionId: metadata.versionId,
    scope: metadata.scope,
    facilityId: metadata.facilityId ?? "",
    chunkIndex: metadata.chunkIndex,
    headings: JSON.stringify(metadata.headings),
    path: JSON.stringify(metadata.path),
    tokenCount: chunk.tokenCount,
  };
}

export async function embedChunksWithOllama(
  chunks: HierarchicalChunk[],
  config: EmbeddingConfig,
): Promise<VectorRecord[]> {
  if (chunks.length === 0) return [];
  const embeddings = new OllamaEmbeddings({
    model: config.model,
    baseUrl: config.baseUrl,
    keepAlive: config.keepAlive ?? "5m",
  });
  const vectors = await embeddings.embedDocuments(chunks.map((chunk) => chunk.text));
  return chunks.map((chunk, index) => ({
    id: chunk.id,
    values: vectors[index],
    metadata: serializeMetadata(chunk),
  }));
}

export async function embedQueryWithOllama(question: string, config: EmbeddingConfig): Promise<number[]> {
  const embeddings = new OllamaEmbeddings({
    model: config.model,
    baseUrl: config.baseUrl,
    keepAlive: config.keepAlive ?? "5m",
  });
  return embeddings.embedQuery(question);
}
