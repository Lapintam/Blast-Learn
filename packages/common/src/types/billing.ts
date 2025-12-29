import { z } from "zod";
import { TenantIdSchema, FacilityIdSchema } from "./tenant";

export const UsageMetricSchema = z.enum(["input_tokens", "output_tokens"]);
export type UsageMetric = z.infer<typeof UsageMetricSchema>;

export const UsageEventSchema = z.object({
  id: z.string().uuid(),
  tenantId: TenantIdSchema,
  facilityId: FacilityIdSchema.optional(),
  sessionId: z.string().optional(),
  metric: UsageMetricSchema,
  quantity: z.number().int().nonnegative(),
  model: z.string().min(1),
  occurredAt: z.coerce.date(),
  requestId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const UsageAggregateSchema = z.object({
  tenantId: TenantIdSchema,
  hour: z.coerce.date(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  totalCostCents: z.number().int().nonnegative(),
});

export type UsageEvent = z.infer<typeof UsageEventSchema>;
export type UsageAggregate = z.infer<typeof UsageAggregateSchema>;
