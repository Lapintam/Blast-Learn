import { AsyncLocalStorage } from "node:async_hooks";
import pino, { Logger } from "pino";

export type RequestContext = {
  requestId?: string;
  tenantId?: string;
  userId?: string;
  facilityId?: string;
  sessionId?: string;
};

const contextStorage = new AsyncLocalStorage<RequestContext>();

const baseLogger = pino({
  name: "ironsight",
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: ["req.headers.authorization", "password", "token"],
    remove: true,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export function withRequestContext<T>(ctx: RequestContext, fn: () => Promise<T> | T): T {
  return contextStorage.run(ctx, () => fn()) as T;
}

export function getLogger(): Logger {
  const ctx = contextStorage.getStore();
  if (!ctx) {
    return baseLogger;
  }
  return baseLogger.child({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    facilityId: ctx.facilityId,
    requestId: ctx.requestId,
    sessionId: ctx.sessionId,
  });
}

export function traceError(err: unknown, message: string, extra: Record<string, unknown> = {}): void {
  const logger = getLogger();
  logger.error({ err, ...extra }, message);
}

export const logger = baseLogger;
