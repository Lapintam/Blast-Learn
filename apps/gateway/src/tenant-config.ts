import LRUCache from "lru-cache";
import { TenantSSOConfig, TenantSSOConfigSchema } from "@ironsight/common";
import { withTenantTransaction } from "@ironsight/db";

const cache = new LRUCache<string, TenantSSOConfig>({ max: 500, ttl: 1000 * 60 * 15 });

export async function getTenantSsoConfig(tenantId: string): Promise<TenantSSOConfig | undefined> {
  if (cache.has(tenantId)) {
    return cache.get(tenantId);
  }
  try {
    const record = await withTenantTransaction(tenantId, (tx) =>
      tx.tenant.findUnique({ where: { id: tenantId }, select: { ssoConfig: true } }),
    );
    if (!record?.ssoConfig) {
      return undefined;
    }
    const config = TenantSSOConfigSchema.parse(record.ssoConfig);
    cache.set(tenantId, config);
    return config;
  } catch (error) {
    return undefined;
  }
}
