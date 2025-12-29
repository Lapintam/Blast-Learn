import { context, trace, SpanKind, SpanStatusCode } from "@opentelemetry/api";

type SpanCallback<T> = () => Promise<T> | T;

export function startActiveSpan<T>(name: string, fn: SpanCallback<T>, kind: SpanKind = SpanKind.INTERNAL): Promise<T> {
  const tracer = trace.getTracer("ironsight");
  return tracer.startActiveSpan(name, { kind }, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.end();
      throw error;
    }
  });
}

export function setSpanAttributes(attributes: Record<string, string | number | boolean>): void {
  const span = trace.getActiveSpan();
  if (!span) return;
  Object.entries(attributes).forEach(([key, value]) => span.setAttribute(key, value));
}

export function bindTraceContext<T>(fn: () => T): T {
  return context.with(trace.setSpan(context.active(), trace.getActiveSpan()!), fn);
}
