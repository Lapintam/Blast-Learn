import { z } from "zod";
import { FacilityIdSchema, TenantIdSchema } from "./tenant";

export const PolicyScopeSchema = z.enum(["system", "facility"]);
export type PolicyScope = z.infer<typeof PolicyScopeSchema>;

export const PolicyNodeTypeSchema = z.enum(["folder", "document"]);
export type PolicyNodeType = z.infer<typeof PolicyNodeTypeSchema>;

export const PolicyNodeSchema = z.object({
  id: z.string().uuid(),
  tenantId: TenantIdSchema,
  parentId: z.string().uuid().nullable(),
  scope: PolicyScopeSchema,
  facilityId: FacilityIdSchema.nullable(),
  name: z.string().min(1),
  slug: z.string().min(1),
  type: PolicyNodeTypeSchema,
  path: z.array(z.string()),
  depth: z.number().int().nonnegative(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const PolicyDocumentSchema = z.object({
  id: z.string().uuid(),
  nodeId: z.string().uuid(),
  tenantId: TenantIdSchema,
  facilityId: FacilityIdSchema.nullable(),
  title: z.string().min(1),
  summary: z.string().optional(),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  effectiveAt: z.coerce.date(),
  reviewAt: z.coerce.date().optional(),
  ownerEmail: z.string().email(),
  isActive: z.boolean().default(true),
  latestVersionId: z.string().uuid(),
});

export const PolicyVersionSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  tenantId: TenantIdSchema,
  versionNumber: z.number().int().positive(),
  checksum: z.string().min(16),
  storageKey: z.string().min(1),
  markdownSizeBytes: z.number().int().nonnegative(),
  ingestedAt: z.coerce.date(),
  ingestedBy: z.string().min(1),
  exportedSourceUrl: z.string().url().optional(),
  changeSummary: z.string().optional(),
});

export const PolicyChunkSchema = z.object({
  id: z.string().uuid(),
  versionId: z.string().uuid(),
  tenantId: TenantIdSchema,
  facilityId: FacilityIdSchema.nullable(),
  chunkIndex: z.number().int().nonnegative(),
  text: z.string(),
  tokenCount: z.number().int().nonnegative(),
  embeddingModel: z.string(),
  pineconeNamespace: z.string(),
  pineconeId: z.string(),
  headings: z.array(z.string()).default([]),
  path: z.array(z.string()).default([]),
});

export const PolicySourceSchema = z.object({
  versionId: z.string().uuid(),
  title: z.string(),
  url: z.string().url(),
  excerpt: z.string(),
  chunkId: z.string().uuid(),
});

export type PolicyNode = z.infer<typeof PolicyNodeSchema>;
export type PolicyDocument = z.infer<typeof PolicyDocumentSchema>;
export type PolicyVersion = z.infer<typeof PolicyVersionSchema>;
export type PolicyChunk = z.infer<typeof PolicyChunkSchema>;
export type PolicySource = z.infer<typeof PolicySourceSchema>;
