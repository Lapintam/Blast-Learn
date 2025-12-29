import { chunkMarkdown, ChunkerOptions, HierarchicalChunk } from "./chunker";
import { embedChunksWithOllama, EmbeddingConfig, VectorRecord } from "./embedder";
import { PineconeConfig, upsertVectors } from "./pinecone";

export type IngestResult = {
  chunks: HierarchicalChunk[];
  vectors: VectorRecord[];
};

export type IngestMarkdownOptions = {
  markdown: string;
  chunker: ChunkerOptions;
  embedding: EmbeddingConfig;
  pinecone: PineconeConfig;
};

export async function ingestMarkdown(options: IngestMarkdownOptions): Promise<IngestResult> {
  const chunks = await chunkMarkdown(options.markdown, options.chunker);
  const vectors = await embedChunksWithOllama(chunks, options.embedding);
  await upsertVectors(options.pinecone, vectors, options.chunker.tenantId);
  return { chunks, vectors };
}
