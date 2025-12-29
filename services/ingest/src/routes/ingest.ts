import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { chunkMarkdown, embedChunksWithOllama, tenantNamespace, upsertVectors } from "@ironsight/vectors";
import {
  withTenantTransaction,
  createPolicyNode,
  createPolicyDocument,
  createPolicyVersion,
  recordPolicyChunks,
} from "@ironsight/db";
import { PolicyNodeType, PolicyScope } from "@prisma/client";
import { slugify, sha256 } from "../utils";
import { getIngestConfig } from "../config";
import { getLogger } from "@ironsight/common";

const IngestPayloadSchema = z.object({
  jobId: z.string(),
  tenantId: z.string(),
  files: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string(),
      }),
    )
    .min(1),
});

type NodeCache = Map<string, { id: string; scope: PolicyScope; facilityId: string | null }>;

type ParsedPath = {
  scope: PolicyScope;
  facilityId: string | null;
  segments: string[];
  documentName: string;
};

function parsePath(filename: string): ParsedPath {
  const parts = filename.split("/").filter(Boolean);
  if (parts.length === 0) {
    return { scope: PolicyScope.SYSTEM, facilityId: null, segments: [], documentName: filename };
  }
  const baseName = parts[parts.length - 1];

  if (parts[0].toLowerCase() === "sites" && parts.length > 2) {
    const facilityCode = slugify(parts[1]);
    const segments = parts.slice(2, -1);
    return {
      scope: PolicyScope.FACILITY,
      facilityId: facilityCode,
      segments,
      documentName: baseName,
    };
  }

  const segments = parts.slice(1, -1);
  return {
    scope: PolicyScope.SYSTEM,
    facilityId: null,
    segments,
    documentName: baseName,
  };
}

async function ensureFacility(tx: any, tenantId: string, facilityCode: string | null) {
  if (!facilityCode) return null;
  const facility = await tx.facility.findFirst({ where: { tenantId, code: facilityCode } });
  if (facility) return facility.id;
  const created = await tx.facility.create({
    data: {
      tenantId,
      code: facilityCode,
      name: facilityCode,
      timezone: "UTC",
    },
  });
  return created.id;
}

async function ensureNode(
  tx: any,
  cache: NodeCache,
  key: string,
  attrs: {
    name: string;
    slug: string;
    parentId?: string;
    scope: PolicyScope;
    facilityId: string | null;
    type: PolicyNodeType;
  },
) {
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  const existing = await tx.policyNode.findFirst({
    where: {
      slug: attrs.slug,
      parentId: attrs.parentId ?? null,
    },
  });
  if (existing) {
    const result = { id: existing.id, scope: existing.scope, facilityId: existing.facilityId };
    cache.set(key, result);
    return result;
  }
  const created = await createPolicyNode(tx, {
    name: attrs.name,
    slug: attrs.slug,
    parentId: attrs.parentId,
    scope: attrs.scope,
    facilityId: attrs.facilityId,
    type: attrs.type,
  });
  const result = { id: created.id, scope: created.scope, facilityId: created.facilityId };
  cache.set(key, result);
  return result;
}

export function registerIngestRoute(server: FastifyInstance) {
  const config = getIngestConfig();
  const logger = getLogger();

  server.post("/ingest", async (request, reply) => {
    const parsed = IngestPayloadSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const { jobId, tenantId, files } = parsed.data;

    await withTenantTransaction(tenantId, (tx) =>
      tx.ingestJob.update({
        where: { id: jobId },
        data: { status: "RUNNING", startedAt: new Date() },
      }),
    );

    try {
      const nodeCache: NodeCache = new Map();
      const overallHash = sha256(files.map((file) => file.content).join(""));

      await withTenantTransaction(tenantId, async (tx) => {
        const facilityCache = new Map<string, string>();

        for (const file of files) {
          const markdown = Buffer.from(file.content, "base64").toString("utf8");
          const parsedPath = parsePath(file.filename);
          let facilityId: string | null = null;
          if (parsedPath.facilityId) {
            if (facilityCache.has(parsedPath.facilityId)) {
              facilityId = facilityCache.get(parsedPath.facilityId)!;
            } else {
              facilityId = await ensureFacility(tx, tenantId, parsedPath.facilityId);
              if (facilityId) facilityCache.set(parsedPath.facilityId, facilityId);
            }
          }

          let parentId: string | undefined;
          for (const segment of parsedPath.segments) {
            const slug = slugify(segment);
            const key = `${parentId ?? "root"}/${slug}`;
            const node = await ensureNode(tx, nodeCache, key, {
              name: segment,
              slug,
              parentId,
              scope: parsedPath.scope,
              facilityId,
              type: PolicyNodeType.FOLDER,
            });
            parentId = node.id;
          }

          const docName = parsedPath.documentName.replace(/\.md$/i, "");
          const docSlug = slugify(docName);
          const docKey = `${parentId ?? "root"}/${docSlug}`;
          const docNode = await ensureNode(tx, nodeCache, docKey, {
            name: docName,
            slug: docSlug,
            parentId,
            scope: parsedPath.scope,
            facilityId,
            type: PolicyNodeType.DOCUMENT,
          });

          const existingDocument = await tx.policyDocument.findFirst({
            where: { nodeId: docNode.id },
            include: { latestVersion: true },
          });

          const checksum = sha256(markdown);
          if (existingDocument?.latestVersion?.checksum === checksum) {
            logger.info({ documentId: existingDocument.id }, "Skipping unchanged policy");
            continue;
          }

          const document =
            existingDocument ??
            (await createPolicyDocument(tx, {
              nodeId: docNode.id,
              title: docName.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              category: parsedPath.scope === PolicyScope.SYSTEM ? "system" : parsedPath.facilityId ?? "facility",
              ownerEmail: "ingest@ironsight",
              effectiveAt: new Date(),
              facilityId,
            }));

          const versionNumber = (existingDocument?.latestVersion?.versionNumber ?? 0) + 1;
          const version = await createPolicyVersion(tx, {
            documentId: document.id,
            versionNumber,
            checksum,
            storageKey: `s3://tenants/${tenantId}/${file.filename}`,
            markdownSizeBytes: Buffer.byteLength(markdown),
            ingestedBy: "ingest-service",
          });

          const chunks = await chunkMarkdown(markdown, {
            tenantId,
            documentId: document.id,
            versionId: version.id,
            facilityId,
            scope: parsedPath.scope,
          });

          const vectors = await embedChunksWithOllama(chunks, {
            baseUrl: config.ollamaGatewayUrl,
            model: config.embeddingModel,
          });

          await upsertVectors(
            {
              apiKey: config.pineconeApiKey!,
              environment: config.pineconeEnvironment!,
              index: config.pineconeIndex,
            },
            vectors,
            tenantId,
          );

          await recordPolicyChunks(
            tx,
            version.id,
            chunks.map((chunk) => ({
              pineconeId: vectors.find((vector) => vector.id === chunk.id)?.id ?? chunk.id,
              pineconeNamespace: tenantNamespace(tenantId),
              text: chunk.text,
              tokenCount: chunk.tokenCount,
              headings: chunk.metadata.headings,
              path: chunk.metadata.path,
              chunkIndex: chunk.metadata.chunkIndex,
              facilityId,
            })),
          );
        }

        await tx.ingestJob.update({
          where: { id: jobId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            sourceHash: overallHash,
          },
        });
      });

      return reply.send({ success: true });
    } catch (error) {
      logger.error({ err: error }, "Ingestion failed");
      await withTenantTransaction(tenantId, (tx) =>
        tx.ingestJob.update({
          where: { id: jobId },
          data: {
            status: "FAILED",
            completedAt: new Date(),
            error: String(error),
          },
        }),
      );
      return reply.code(500).send({ error: "Ingestion failed" });
    }
  });
}
