import "server-only";
import { gatewayFetch } from "../api/gateway";
import { requireTenantSession } from "../auth/session";

export type IngestJob = {
  id: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  sourcePath: string;
  queuedBy: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
};

export async function getIngestJobs(): Promise<IngestJob[]> {
  const session = await requireTenantSession();
  return gatewayFetch<IngestJob[]>("/ingest/jobs", { method: "GET" }, session);
}
