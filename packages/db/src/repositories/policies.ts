import type { PrismaClient, PolicyNodeType, PolicyScope } from "@prisma/client";

export type CreatePolicyNodeInput = {
  name: string;
  slug: string;
  parentId?: string;
  scope: PolicyScope;
  facilityId?: string | null;
  type: PolicyNodeType;
};

export async function createPolicyNode(tx: PrismaClient, input: CreatePolicyNodeInput) {
  const parent = input.parentId
    ? await tx.policyNode.findUniqueOrThrow({ where: { id: input.parentId } })
    : null;

  const path = parent ? [...parent.path, parent.slug, input.slug] : [input.slug];
  const depth = path.length;

  return tx.policyNode.create({
    data: {
      name: input.name,
      slug: input.slug,
      parentId: input.parentId,
      scope: input.scope,
      facilityId: input.facilityId ?? null,
      type: input.type,
      path,
      depth,
    },
  });
}

export type CreatePolicyDocumentInput = {
  nodeId: string;
  title: string;
  summary?: string;
  category: string;
  tags?: string[];
  ownerEmail: string;
  effectiveAt: Date;
  reviewAt?: Date;
  facilityId?: string | null;
};

export async function createPolicyDocument(tx: PrismaClient, input: CreatePolicyDocumentInput) {
  return tx.policyDocument.create({
    data: {
      nodeId: input.nodeId,
      title: input.title,
      summary: input.summary,
      category: input.category,
      tags: input.tags ?? [],
      ownerEmail: input.ownerEmail,
      effectiveAt: input.effectiveAt,
      reviewAt: input.reviewAt,
      facilityId: input.facilityId ?? null,
    },
    include: {
      node: true,
    },
  });
}

export type CreatePolicyVersionInput = {
  documentId: string;
  versionNumber: number;
  checksum: string;
  storageKey: string;
  markdownSizeBytes: number;
  ingestedBy: string;
  exportedSourceUrl?: string;
  changeSummary?: string;
};

export async function createPolicyVersion(tx: PrismaClient, input: CreatePolicyVersionInput) {
  const version = await tx.policyVersion.create({
    data: {
      documentId: input.documentId,
      versionNumber: input.versionNumber,
      checksum: input.checksum,
      storageKey: input.storageKey,
      markdownSizeBytes: input.markdownSizeBytes,
      ingestedBy: input.ingestedBy,
      exportedSourceUrl: input.exportedSourceUrl,
      changeSummary: input.changeSummary,
    },
  });

  await tx.policyDocument.update({
    where: { id: input.documentId },
    data: { latestVersionId: version.id },
  });

  return version;
}

export async function getPolicyTree(tx: PrismaClient) {
  return tx.policyNode.findMany({
    include: {
      document: {
        include: {
          latestVersion: true,
        },
      },
    },
    orderBy: [{ depth: "asc" }, { name: "asc" }],
  });
}

export async function recordPolicyChunks(
  tx: PrismaClient,
  versionId: string,
  chunks: {
    pineconeId: string;
    pineconeNamespace: string;
    text: string;
    tokenCount: number;
    headings: string[];
    path: string[];
    chunkIndex: number;
    facilityId?: string | null;
  }[],
) {
  if (chunks.length === 0) return;

  await tx.policyChunk.deleteMany({ where: { versionId } });
  await tx.policyChunk.createMany({
    data: chunks.map((chunk) => ({
      versionId,
      pineconeId: chunk.pineconeId,
      pineconeNamespace: chunk.pineconeNamespace,
      text: chunk.text,
      tokenCount: chunk.tokenCount,
      headings: chunk.headings,
      path: chunk.path,
      chunkIndex: chunk.chunkIndex,
      facilityId: chunk.facilityId ?? null,
    })),
  });
}

export async function markDocumentInactive(tx: PrismaClient, documentId: string) {
  await tx.policyDocument.update({
    where: { id: documentId },
    data: { isActive: false },
  });
}
