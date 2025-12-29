import { z } from "zod";

export const TenantRoleSchema = z.enum([
  "system_admin",
  "compliance_officer",
  "clinical_lead",
  "operational_manager",
  "read_only_auditor",
]);

export type TenantRole = z.infer<typeof TenantRoleSchema>;

export const PermissionSchema = z.enum([
  "policy.read",
  "policy.write",
  "policy.publish",
  "policy.archive",
  "chat.request",
  "chat.moderate",
  "usage.view",
  "usage.export",
  "billing.manage",
  "tenant.configure",
]);

export type Permission = z.infer<typeof PermissionSchema>;

export const RolePermissions: Record<TenantRole, Permission[]> = {
  system_admin: [
    "policy.read",
    "policy.write",
    "policy.publish",
    "policy.archive",
    "chat.request",
    "chat.moderate",
    "usage.view",
    "usage.export",
    "billing.manage",
    "tenant.configure",
  ],
  compliance_officer: [
    "policy.read",
    "policy.write",
    "policy.publish",
    "policy.archive",
    "chat.request",
    "chat.moderate",
    "usage.view",
    "usage.export",
  ],
  clinical_lead: ["policy.read", "chat.request"],
  operational_manager: ["policy.read", "chat.request", "usage.view"],
  read_only_auditor: ["policy.read", "usage.view"],
};

export function roleHasPermission(role: TenantRole, permission: Permission): boolean {
  return RolePermissions[role]?.includes(permission) ?? false;
}
