import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import type { UsageSummary } from "@/lib/data/usage";
import { format } from "date-fns";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function UsageSummaryPanel({ summary }: { summary: UsageSummary }) {
  const { aggregates, stripeMeterStatus } = summary;
  const totalInput = aggregates.reduce((acc, aggregate) => acc + aggregate.inputTokens, 0);
  const totalOutput = aggregates.reduce((acc, aggregate) => acc + aggregate.outputTokens, 0);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Usage totals</CardTitle>
          <CardDescription>Token consumption by hour (last 7 days).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase text-slate-500">Input tokens</div>
              <div className="text-lg font-semibold text-slate-900">{formatNumber(totalInput)}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase text-slate-500">Output tokens</div>
              <div className="text-lg font-semibold text-slate-900">{formatNumber(totalOutput)}</div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200">
            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>Hour</span>
              <span className="text-right">Input</span>
              <span className="text-right">Output</span>
            </div>
            <div className="max-h-64 overflow-y-auto text-xs">
              {aggregates.map((aggregate) => (
                <div key={aggregate.hour.toString()} className="grid grid-cols-3 border-b border-slate-100 px-3 py-2">
                  <span>{format(aggregate.hour, "MMM d, HH:mm")}</span>
                  <span className="text-right">{formatNumber(aggregate.inputTokens)}</span>
                  <span className="text-right">{formatNumber(aggregate.outputTokens)}</span>
                </div>
              ))}
              {aggregates.length === 0 ? (
                <div className="px-3 py-4 text-center text-slate-400">No usage events yet.</div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Stripe metering</CardTitle>
          <CardDescription>Realtime linkage to metered Stripe subscription.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          {stripeMeterStatus ? (
            <>
              <div>
                <span className="font-medium text-slate-900">Subscription:</span> {stripeMeterStatus.subscriptionId}
              </div>
              <div>
                <span className="font-medium text-slate-900">Current period ends:</span>{" "}
                {format(new Date(stripeMeterStatus.currentPeriodEnd), "PPPpp")}
              </div>
              <div>
                <span className="font-medium text-slate-900">Metered usage this period:</span> {formatNumber(stripeMeterStatus.totalUsage)} tokens
              </div>
            </>
          ) : (
            <div className="text-slate-500">Stripe metering is not configured for this tenant yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
