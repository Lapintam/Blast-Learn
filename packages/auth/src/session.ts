import { CognitoTenantVerifier } from "./cognito";
import { TenantSession, TenantSessionSchema } from "./types";
import { withRequestContext } from "@ironsight/common";

export type HeaderMap = Record<string, string | string[] | undefined>;

export function extractBearerToken(headers: HeaderMap): string | undefined {
  const header = headers.authorization || headers.Authorization;
  if (!header) return undefined;
  if (Array.isArray(header)) {
    return header
      .map((value) => value.split(" "))
      .find(([scheme]) => scheme.toLowerCase() === "bearer")?.[1];
  }
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return undefined;
  return token;
}

export async function buildTenantSession(
  verifier: CognitoTenantVerifier,
  headers: HeaderMap,
): Promise<TenantSession> {
  const token = extractBearerToken(headers);
  if (!token) {
    throw new Error("Missing bearer token");
  }
  const hintedTenant = headers["x-tenant-id"] ?? headers["X-Tenant-Id"];
  const hintedTenantId = Array.isArray(hintedTenant) ? hintedTenant[0] : hintedTenant;

  const claims = await verifier.verify(token, hintedTenantId);
  const session = TenantSessionSchema.parse({
    tenantId: claims.tenantId,
    tenantSlug: claims.tenantSlug,
    userId: claims.sub,
    email: claims.email,
    roles: claims.roles,
    token,
    expiresAt: new Date(claims.exp * 1000),
    facilityId: Array.isArray(headers["x-facility-id"]) ? headers["x-facility-id"][0] : (headers["x-facility-id"] as string | undefined),
  });

  return session;
}

export async function withTenantSession<T>(
  verifier: CognitoTenantVerifier,
  headers: HeaderMap,
  fn: (session: TenantSession) => Promise<T>,
): Promise<T> {
  const session = await buildTenantSession(verifier, headers);
  return withRequestContext(
    {
      tenantId: session.tenantId,
      userId: session.userId,
      requestId: Array.isArray(headers["x-request-id"]) ? headers["x-request-id"][0] : (headers["x-request-id"] as string | undefined),
      facilityId: session.facilityId,
    },
    () => fn(session),
  );
}
