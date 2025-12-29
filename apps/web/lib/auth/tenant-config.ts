import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { TenantSSOConfig, TenantSSOConfigSchema } from "@ironsight/common";
import { getServerConfig } from "../config";

const cache = new Map<string, TenantSSOConfig>();
let ssm: SSMClient | null = null;

async function fetchFromSsm(parameterName: string): Promise<TenantSSOConfig | null> {
  if (!ssm) {
    const config = getServerConfig();
    ssm = new SSMClient({ region: config.awsRegion });
  }
  try {
    const response = await ssm!.send(new GetParameterCommand({ Name: parameterName, WithDecryption: true }));
    if (!response.Parameter?.Value) {
      return null;
    }
    const parsed = JSON.parse(response.Parameter.Value);
    return TenantSSOConfigSchema.parse(parsed);
  } catch (error) {
    console.warn(`Failed to fetch SSO config from SSM: ${parameterName}`, error);
    return null;
  }
}

function fallbackConfig(): TenantSSOConfig | null {
  const config = getServerConfig();
  if (config.fallbackUserPoolId && config.fallbackAppClientId && config.fallbackCognitoDomain && config.fallbackOidcDiscoveryEndpoint) {
    return TenantSSOConfigSchema.parse({
      cognitoUserPoolId: config.fallbackUserPoolId,
      cognitoAppClientId: config.fallbackAppClientId,
      cognitoDomain: config.fallbackCognitoDomain,
      oidcDiscoveryEndpoint: config.fallbackOidcDiscoveryEndpoint,
      mappedGroups: {},
      defaultRole: "system_admin",
    });
  }
  return null;
}

export async function getTenantSsoConfig(tenantId: string): Promise<TenantSSOConfig> {
  if (cache.has(tenantId)) {
    return cache.get(tenantId)!;
  }
  const config = getServerConfig();
  const parameterName = `${config.parameterStorePrefix}/tenants/${tenantId}/sso`;
  const fromSsm = await fetchFromSsm(parameterName);
  if (fromSsm) {
    cache.set(tenantId, fromSsm);
    return fromSsm;
  }
  const fallback = fallbackConfig();
  if (!fallback) {
    throw new Error(`Unable to load SSO configuration for tenant ${tenantId}`);
  }
  cache.set(tenantId, fallback);
  return fallback;
}
