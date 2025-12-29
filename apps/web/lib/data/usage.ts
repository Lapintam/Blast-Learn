import "server-only";
import { UsageAggregate } from "@ironsight/common";
import { gatewayFetch } from "../api/gateway";
import { requireTenantSession } from "../auth/session";

export type UsageSummary = {
  aggregates: UsageAggregate[];
  stripeMeterStatus?: {
    subscriptionId: string;
    currentPeriodEnd: string;
    totalUsage: number;
  };
};

export async function getUsageSummary(): Promise<UsageSummary> {
  const session = await requireTenantSession();
  const summary = await gatewayFetch<UsageSummary>("/usage/summary", { method: "GET" }, session);
  return {
    ...summary,
    aggregates: summary.aggregates.map((aggregate) => ({
      ...aggregate,
      hour: new Date(aggregate.hour),
    })),
  };
}
