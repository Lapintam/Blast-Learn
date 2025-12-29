import { z } from "zod";
import { TenantIdSchema, TenantRoleSchema } from "@ironsight/common";

export const TenantClaimsSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  tenantId: TenantIdSchema,
  tenantSlug: z.string(),
  roles: z.array(TenantRoleSchema),
  iss: z.string().url(),
  aud: z.array(z.string()).or(z.string()),
  exp: z.number(),
  iat: z.number(),
  jti: z.string().optional(),
  groups: z.array(z.string()).default([]),
});

export type TenantClaims = z.infer<typeof TenantClaimsSchema>;

export const TenantSessionSchema = z.object({
  tenantId: TenantIdSchema,
  tenantSlug: z.string(),
  facilityId: z.string().optional(),
  userId: z.string(),
  email: z.string().email(),
  roles: z.array(TenantRoleSchema),
  token: z.string(),
  expiresAt: z.coerce.date(),
});

export type TenantSession = z.infer<typeof TenantSessionSchema>;
