import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import { LRUCache } from "lru-cache";
import { TenantSSOConfig, TenantSSOConfigSchema } from "@ironsight/common";
import { TenantClaims, TenantClaimsSchema } from "./types";
import { Permission, RolePermissions, TenantRole } from "@ironsight/common";

export type TenantConfigProvider = (tenantId: string) => Promise<TenantSSOConfig | undefined>;

const metadataCache = new LRUCache<string, { issuer: string; jwksUri: string; tokenEndpoint: string }>(
  {
    ttl: 1000 * 60 * 15,
    max: 100,
  },
);

const jwksCache = new LRUCache<string, ReturnType<typeof createRemoteJWKSet>>({ ttl: 1000 * 60 * 60, max: 200 });

async function fetchOidcMetadata(config: TenantSSOConfig): Promise<{ issuer: string; jwksUri: string; tokenEndpoint: string }> {
  const cached = metadataCache.get(config.cognitoUserPoolId);
  if (cached) return cached;

  const response = await fetch(`${config.oidcDiscoveryEndpoint}/.well-known/openid-configuration`);
  if (!response.ok) {
    throw new Error(`Failed to fetch OIDC metadata for ${config.cognitoUserPoolId}`);
  }
  const body = await response.json();
  const metadata = {
    issuer: body.issuer as string,
    jwksUri: body.jwks_uri as string,
    tokenEndpoint: body.token_endpoint as string,
  };
  metadataCache.set(config.cognitoUserPoolId, metadata);
  return metadata;
}

function coerceRoles(groups: string[], config: TenantSSOConfig): TenantRole[] {
  const roles = new Set<TenantRole>();
  groups.forEach((group) => {
    const mapped = config.mappedGroups[group];
    if (!mapped) return;
    mapped.forEach((value) => {
      if ((RolePermissions as Record<string, Permission[]>)[value as TenantRole]) {
        roles.add(value as TenantRole);
      }
    });
  });
  if (roles.size === 0) {
    roles.add(config.defaultRole as TenantRole);
  }
  return Array.from(roles);
}

export class CognitoTenantVerifier {
  constructor(private readonly getTenantConfig: TenantConfigProvider) {}

  async verify(token: string, hintedTenantId?: string): Promise<TenantClaims> {
    const unverifiedHeader = decodeProtectedHeader(token);
    if (!unverifiedHeader.kid) {
      throw new Error("Missing kid in JWT header");
    }

    const tenantId = hintedTenantId ?? this.extractTenantId(token);
    if (!tenantId) {
      throw new Error("Unable to resolve tenant id from token");
    }

    const tenantConfig = await this.getTenantConfig(tenantId);
    if (!tenantConfig) {
      throw new Error(`No Cognito configuration found for tenant ${tenantId}`);
    }

    TenantSSOConfigSchema.parse(tenantConfig);

    const metadata = await fetchOidcMetadata(tenantConfig);

    const jwksKey = `${tenantConfig.cognitoUserPoolId}:${metadata.jwksUri}`;
    let jwks = jwksCache.get(jwksKey);
    if (!jwks) {
      jwks = createRemoteJWKSet(new URL(metadata.jwksUri));
      jwksCache.set(jwksKey, jwks);
    }

    const verification = await jwtVerify(token, jwks, {
      issuer: metadata.issuer,
      audience: tenantConfig.cognitoAppClientId,
    });

    const payload = TenantClaimsSchema.parse({
      ...verification.payload,
      tenantId: (verification.payload["custom:tenant_id"] || verification.payload.tenant_id) as string,
      tenantSlug: (verification.payload["custom:tenant_slug"] || verification.payload.tenant_slug) as string,
      roles: coerceRoles((verification.payload["cognito:groups"] as string[]) ?? [], tenantConfig),
      groups: ((verification.payload["cognito:groups"] as string[]) ?? []).filter(Boolean),
    });

    return payload;
  }

  extractTenantId(token: string): string | undefined {
    const [, payload] = token.split(".");
    if (!payload) return undefined;
    try {
      const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      return (parsed["custom:tenant_id"] || parsed.tenant_id) as string | undefined;
    } catch (error) {
      return undefined;
    }
  }
}
