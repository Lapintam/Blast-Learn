import { NextRequest, NextResponse } from "next/server";

function inferTenantFromHost(host?: string | null): string | undefined {
  if (!host) return undefined;
  const parts = host.split(".");
  if (parts.length < 3) {
    return undefined;
  }
  return parts[0];
}

export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  let tenantId = headers.get("x-tenant-id");
  if (!tenantId) {
    tenantId = inferTenantFromHost(request.headers.get("host"));
    if (tenantId) {
      headers.set("x-tenant-id", tenantId);
    }
  }
  const response = NextResponse.next({ request: { headers } });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
