import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "outline" | "success" | "warning";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant };

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-900 text-white",
  outline: "border border-slate-300 text-slate-700",
  success: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
