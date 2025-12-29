import { z } from "zod";

export const TenantIdSchema = z.string().min(1, "tenant id required");

export const TenantStatusSchema = z.enum(["active", "suspended", "trial", "deprovisioning"]);

export const FacilityIdSchema = z.string().min(1, "facility id required");

export const TenantSSOConfigSchema = z.object({
  cognitoUserPoolId: z.string().min(1, "user pool required"),
  cognitoAppClientId: z.string().min(1, "app client required"),
  cognitoDomain: z.string().url("valid cognito domain"),
  oidcDiscoveryEndpoint: z.string().url("valid OIDC discovery URL"),
  mappedGroups: z.record(z.string(), z.array(z.string())),
  defaultRole: z.string().min(1),
});

export const FacilitySchema = z.object({
  id: FacilityIdSchema,
  tenantId: TenantIdSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  timezone: z.string().min(1),
  address: z
    .object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string().length(2),
    })
    .optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const TenantSettingsSchema = z.object({
  defaultFacilityId: FacilityIdSchema.optional(),
  dataRetentionDays: z.number().min(30).default(180),
  enableUsageAlerts: z.boolean().default(true),
  notificationEmails: z.array(z.string().email()).default([]),
  allowedOrigins: z.array(z.string().url()).default([]),
});

export const TenantSchema = z.object({
  id: TenantIdSchema,
  slug: z.string().min(1),
  name: z.string().min(1),
  status: TenantStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sso: TenantSSOConfigSchema,
  settings: TenantSettingsSchema,
});

export type TenantStatus = z.infer<typeof TenantStatusSchema>;
export type TenantSSOConfig = z.infer<typeof TenantSSOConfigSchema>;
export type Tenant = z.infer<typeof TenantSchema>;
export type TenantSettings = z.infer<typeof TenantSettingsSchema>;
export type Facility = z.infer<typeof FacilitySchema>;
