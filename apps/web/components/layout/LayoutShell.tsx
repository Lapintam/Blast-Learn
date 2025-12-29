"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
  exact?: boolean;
};

type LayoutShellProps = {
  tenantName: string;
  tenantSlug: string;
  userEmail: string;
  userRoles: string[];
  nav: NavItem[];
  children: ReactNode;
};

export function LayoutShell({ tenantName, tenantSlug, userEmail, userRoles, nav, children }: LayoutShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={cn(
          "fixed inset-y-0 z-30 w-64 transform border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">{tenantSlug}</div>
        </div>
        <div className="space-y-1 p-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                isActive(item)
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </aside>
      <div className="flex w-full flex-col lg:ml-0">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="lg:hidden"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <div className="text-sm font-semibold text-slate-900">{tenantName}</div>
              <div className="text-xs text-slate-500">{userEmail}</div>
            </div>
          </div>
          <div className="text-xs uppercase tracking-wider text-slate-500">Roles: {userRoles.join(", ") || "viewer"}</div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
