import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { IngestJob } from "@/lib/data/ingest";
import { formatDistanceToNow } from "date-fns";

const statusVariant: Record<IngestJob["status"], "default" | "outline" | "success" | "warning"> = {
  QUEUED: "outline",
  RUNNING: "warning",
  COMPLETED: "success",
  FAILED: "warning",
};

export function IngestJobList({ jobs }: { jobs: IngestJob[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent ingestion jobs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="rounded-md border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-700">{job.sourcePath}</div>
              <Badge variant={statusVariant[job.status]}>{job.status}</Badge>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Started {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
              {job.completedAt ? ` • Completed ${formatDistanceToNow(new Date(job.completedAt), { addSuffix: true })}` : null}
            </div>
            {job.error ? <div className="mt-2 text-xs text-red-600">{job.error}</div> : null}
          </div>
        ))}
        {jobs.length === 0 ? <div className="text-sm text-slate-500">No ingestion jobs yet.</div> : null}
      </CardContent>
    </Card>
  );
}
