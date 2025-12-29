import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-200",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-900",
  destructive: "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", fullWidth, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
          variantStyles[variant],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
