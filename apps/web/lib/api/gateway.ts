import "server-only";
import { TenantSession } from "@ironsight/auth";
import { getServerConfig } from "../config";

const { gatewayUrl } = getServerConfig();

export async function gatewayFetch<T>(path: string, init: RequestInit, session: TenantSession): Promise<T> {
  const headers = new Headers(init.headers as HeadersInit);
  headers.set("Authorization", `Bearer ${session.token}`);
  headers.set("x-tenant-id", session.tenantId);
  if (session.facilityId) {
    headers.set("x-facility-id", session.facilityId);
  }
  if (!(init.body instanceof FormData) && !headers.has("content-type") && init.method && init.method !== "GET") {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${gatewayUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gateway request failed: ${response.status} ${text}`);
  }

  return (await response.json()) as T;
}
