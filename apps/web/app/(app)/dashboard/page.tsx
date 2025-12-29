import { getTenant } from "@/lib/data/tenant";
import { getPolicyTree } from "@/lib/data/policies";
import { getUsageSummary } from "@/lib/data/usage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
  const [tenant, tree, usage] = await Promise.all([getTenant(), getPolicyTree(), getUsageSummary()]);
  const totalPolicies = tree.filter((node) => node.document).length;
  const sitePolicies = tree.filter((node) => node.document && node.scope === "FACILITY").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {tenant.name}</h1>
        <p className="text-sm text-slate-500">Monitor your policy catalogue and knowledge usage.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-slate-900">{totalPolicies}</div>
            <div className="text-xs text-slate-500">Includes system-wide + site-specific documents</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Site-specific policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-slate-900">{sitePolicies}</div>
            <div className="text-xs text-slate-500">Scoped to facilities within the system</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Usage (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-slate-900">{usage.aggregates.length}</div>
            <div className="text-xs text-slate-500">Hourly aggregates processed by billing service</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {usage.aggregates.slice(0, 5).map((aggregate) => (
              <div key={aggregate.hour.toISOString()} className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3">
                <div className="text-sm font-medium text-slate-700">
                  {formatDistanceToNow(aggregate.hour, { addSuffix: true })}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Badge variant="outline">Input {aggregate.inputTokens}</Badge>
                  <Badge variant="outline">Output {aggregate.outputTokens}</Badge>
                </div>
              </div>
            ))}
            {usage.aggregates.length === 0 ? <div className="text-sm text-slate-500">No usage yet.</div> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
