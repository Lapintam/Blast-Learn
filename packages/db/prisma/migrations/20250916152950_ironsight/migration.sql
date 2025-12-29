-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL', 'DEPROVISIONING');

-- CreateEnum
CREATE TYPE "PolicyScope" AS ENUM ('SYSTEM', 'FACILITY');

-- CreateEnum
CREATE TYPE "PolicyNodeType" AS ENUM ('FOLDER', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "IngestStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ChatMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "UsageTokenType" AS ENUM ('INPUT', 'OUTPUT');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "settings" JSONB NOT NULL,
    "ssoConfig" JSONB NOT NULL,
    "features" JSONB NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantUser" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "roles" TEXT[],
    "facilities" TEXT[],
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashedKey" TEXT NOT NULL,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyNode" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "parentId" TEXT,
    "facilityId" TEXT,
    "scope" "PolicyScope" NOT NULL DEFAULT 'SYSTEM',
    "type" "PolicyNodeType" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "path" TEXT[],
    "depth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "facilityId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "ownerEmail" TEXT NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "reviewAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "latestVersionId" TEXT,

    CONSTRAINT "PolicyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "markdownSizeBytes" INTEGER NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingestedBy" TEXT NOT NULL,
    "exportedSourceUrl" TEXT,
    "changeSummary" TEXT,

    CONSTRAINT "PolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyChunk" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "facilityId" TEXT,
    "chunkIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "embeddingModel" TEXT NOT NULL,
    "pineconeNamespace" TEXT NOT NULL,
    "pineconeId" TEXT NOT NULL,
    "headings" TEXT[],
    "path" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "facilityId" TEXT,
    "documentId" TEXT,
    "status" "IngestStatus" NOT NULL DEFAULT 'QUEUED',
    "sourcePath" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "queuedBy" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "facilityId" TEXT,
    "userId" TEXT NOT NULL,
    "topic" TEXT,
    "contextNodeIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sources" JSONB,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "facilityId" TEXT,
    "sessionId" TEXT,
    "tokenType" "UsageTokenType" NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageAggregate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hour" TIMESTAMP(3) NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCostCents" INTEGER NOT NULL DEFAULT 0,
    "stripeMeterEventId" TEXT,

    CONSTRAINT "UsageAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT,
    "facilityId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_stripeCustomerId_key" ON "Tenant"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Facility_tenantId_code_idx" ON "Facility"("tenantId", "code");

-- CreateIndex
CREATE INDEX "TenantUser_tenantId_email_idx" ON "TenantUser"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "TenantUser_tenantId_sub_key" ON "TenantUser"("tenantId", "sub");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_tenantId_name_key" ON "ApiKey"("tenantId", "name");

-- CreateIndex
CREATE INDEX "PolicyNode_tenantId_slug_idx" ON "PolicyNode"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "PolicyNode_tenantId_path_idx" ON "PolicyNode"("tenantId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDocument_nodeId_key" ON "PolicyDocument"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDocument_latestVersionId_key" ON "PolicyDocument"("latestVersionId");

-- CreateIndex
CREATE INDEX "PolicyDocument_tenantId_category_idx" ON "PolicyDocument"("tenantId", "category");

-- CreateIndex
CREATE INDEX "PolicyDocument_tenantId_facilityId_idx" ON "PolicyDocument"("tenantId", "facilityId");

-- CreateIndex
CREATE INDEX "PolicyVersion_tenantId_checksum_idx" ON "PolicyVersion"("tenantId", "checksum");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyVersion_documentId_versionNumber_key" ON "PolicyVersion"("documentId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyChunk_pineconeId_key" ON "PolicyChunk"("pineconeId");

-- CreateIndex
CREATE INDEX "PolicyChunk_tenantId_pineconeNamespace_idx" ON "PolicyChunk"("tenantId", "pineconeNamespace");

-- CreateIndex
CREATE INDEX "IngestJob_tenantId_status_idx" ON "IngestJob"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ChatSession_tenantId_userId_idx" ON "ChatSession"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "ChatMessage_tenantId_sessionId_idx" ON "ChatMessage"("tenantId", "sessionId");

-- CreateIndex
CREATE INDEX "UsageEvent_tenantId_occurredAt_idx" ON "UsageEvent"("tenantId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "UsageAggregate_tenantId_hour_key" ON "UsageAggregate"("tenantId", "hour");

-- CreateIndex
CREATE INDEX "AuditEvent_tenantId_createdAt_idx" ON "AuditEvent"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantUser" ADD CONSTRAINT "TenantUser_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyNode" ADD CONSTRAINT "PolicyNode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyNode" ADD CONSTRAINT "PolicyNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PolicyNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyNode" ADD CONSTRAINT "PolicyNode_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyDocument" ADD CONSTRAINT "PolicyDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyDocument" ADD CONSTRAINT "PolicyDocument_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "PolicyNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyDocument" ADD CONSTRAINT "PolicyDocument_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyDocument" ADD CONSTRAINT "PolicyDocument_latestVersionId_fkey" FOREIGN KEY ("latestVersionId") REFERENCES "PolicyVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyVersion" ADD CONSTRAINT "PolicyVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "PolicyDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyVersion" ADD CONSTRAINT "PolicyVersion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyChunk" ADD CONSTRAINT "PolicyChunk_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PolicyVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyChunk" ADD CONSTRAINT "PolicyChunk_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyChunk" ADD CONSTRAINT "PolicyChunk_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestJob" ADD CONSTRAINT "IngestJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestJob" ADD CONSTRAINT "IngestJob_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestJob" ADD CONSTRAINT "IngestJob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "PolicyDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageAggregate" ADD CONSTRAINT "UsageAggregate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
