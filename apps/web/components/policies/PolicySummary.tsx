import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import type { PolicyDocumentDetail } from "@/lib/data/policies";
import { format } from "date-fns";

export function PolicySummary({ detail }: { detail: PolicyDocumentDetail }) {
  const { document, breadcrumbs, relatedPolicies } = detail;
  const latest = document.latestVersion;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{document.title}</CardTitle>
          <CardDescription>{document.summary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Category: {document.category}</Badge>
            <Badge variant="outline">Owner: {document.ownerEmail}</Badge>
            {document.facilityId ? <Badge variant="success">Site-specific</Badge> : <Badge variant="success">System</Badge>}
          </div>
          <div>Effective: {format(document.effectiveAt, "PPP")}</div>
          {document.reviewAt ? <div>Review by: {format(document.reviewAt, "PPP")}</div> : null}
          {latest ? (
            <div>
              Version {latest.versionNumber} · Uploaded by {latest.ingestedBy} on {format(latest.ingestedAt, "PPPpp")}
            </div>
          ) : null}
          <div className="text-xs uppercase tracking-wide text-slate-500">Path</div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {breadcrumbs.map((node) => (
              <Badge key={node.id} variant="outline">
                {node.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Related Policies</CardTitle>
          <CardDescription>Other guidance relevant to this topic.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-700">
            {relatedPolicies.map((policy) => (
              <li key={policy.id} className="rounded-md border border-slate-200 p-3">
                <div className="font-medium">{policy.title}</div>
                <div className="text-xs text-slate-500">Category: {policy.category}</div>
              </li>
            ))}
            {relatedPolicies.length === 0 ? (
              <li className="text-xs text-slate-500">No related policies configured.</li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
