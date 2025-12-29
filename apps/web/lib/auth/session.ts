import { Buffer } from "node:buffer";
import { headers } from "next/headers";
import { CognitoTenantVerifier, buildTenantSession, extractBearerToken, HeaderMap, TenantSession } from "@ironsight/auth";
import { getTenantSsoConfig } from "./tenant-config";

const verifier = new CognitoTenantVerifier(getTenantSsoConfig);

function headersToRecord(requestHeaders: Headers): HeaderMap {
  const record: HeaderMap = {};
  requestHeaders.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function decodeAlbJwt(encoded?: string): string | undefined {
  if (!encoded) return undefined;
  try {
    return Buffer.from(encoded, "base64").toString("utf8");
  } catch (error) {
    console.warn("Failed to decode ALB JWT", error);
    return undefined;
  }
}

export async function getTenantSession(): Promise<TenantSession | null> {
  const requestHeaders = headers();
  const headerRecord = headersToRecord(requestHeaders);
  let token = extractBearerToken(headerRecord);
  if (!token) {
    token = decodeAlbJwt(requestHeaders.get("x-amzn-oidc-data") ?? undefined);
    if (token) {
      headerRecord.authorization = `Bearer ${token}`;
    }
  }
  try {
    return await buildTenantSession(verifier, headerRecord);
  } catch (error) {
    console.warn("Failed to build tenant session", error);
    return null;
  }
}

export async function requireTenantSession(): Promise<TenantSession> {
  const session = await getTenantSession();
  if (!session) {
    throw new Error("No valid tenant session");
  }
  return session;
}
