import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { LayoutShell, type NavItem } from "@/components/layout/LayoutShell";
import { getTenant } from "@/lib/data/tenant";
import { requireTenantSession } from "@/lib/auth/session";
import type { TenantSession } from "@ironsight/auth";

const nav: NavItem[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/documents", label: "Policy library" },
  { href: "/chat", label: "Ask policies" },
  { href: "/ingest", label: "Ingestion" },
  { href: "/admin/usage", label: "Usage & billing" },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  let session: TenantSession;
  try {
    session = await requireTenantSession();
  } catch (error) {
    redirect("/");
  }
  const tenant = await getTenant();

  return (
    <LayoutShell
      tenantName={tenant.name}
      tenantSlug={tenant.slug}
      userEmail={session.email}
      userRoles={session.roles}
      nav={nav}
    >
      {children}
    </LayoutShell>
  );
}
