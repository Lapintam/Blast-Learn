import { HierarchyUploader } from "@/components/upload/HierarchyUploader";
import { IngestJobList } from "@/components/upload/IngestJobList";
import { getIngestJobs } from "@/lib/data/ingest";

export default async function IngestPage() {
  const jobs = (await getIngestJobs()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ingestion pipeline</h1>
        <p className="text-sm text-slate-500">Upload Markdown hierarchies and monitor deterministic chunking + Pinecone upserts.</p>
      </div>
      <HierarchyUploader />
      <IngestJobList jobs={jobs} />
    </div>
  );
}
