import { getUsageSummary } from "@/lib/data/usage";
import { UsageSummaryPanel } from "@/components/usage/UsageSummaryPanel";

export default async function UsagePage() {
  const summary = await getUsageSummary();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Usage & billing</h1>
        <p className="text-sm text-slate-500">Stripe metering, hourly aggregates, and compliance exports.</p>
      </div>
      <UsageSummaryPanel summary={summary} />
    </div>
  );
}
