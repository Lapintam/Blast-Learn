import "server-only";
import { Tenant } from "@ironsight/common";
import { gatewayFetch } from "../api/gateway";
import { requireTenantSession } from "../auth/session";

export async function getTenant(): Promise<Tenant> {
  const session = await requireTenantSession();
  const tenant = await gatewayFetch<Tenant>("/tenants/current", { method: "GET" }, session);
  return {
    ...tenant,
    createdAt: new Date(tenant.createdAt),
    updatedAt: new Date(tenant.updatedAt),
  };
}
