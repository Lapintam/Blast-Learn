import { PrismaClient } from "@prisma/client";
import { getLogger } from "@ironsight/common";

export * from "@prisma/client";
export * from "./repositories/policies";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function withTenantTransaction<T>(tenantId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
  const logger = getLogger();
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`select set_config('app.tenant_id', ${tenantId}, true)`;
    logger.debug({ tenantId }, "set tenant context");
    const result = await fn(tx);
    return result;
  });
}

export function tenantScopedClient(tenantId: string) {
  return {
    async run<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
      return withTenantTransaction(tenantId, fn);
    },
    get raw() {
      throw new Error("Use run() to execute tenant scoped operations");
    },
  };
}

export async function healthcheck(): Promise<boolean> {
  try {
    await prisma.$queryRaw`select 1`;
    return true;
  } catch (error) {
    getLogger().error({ err: error }, "database healthcheck failed");
    return false;
  }
}
