import * as React from "react";
import { clsx } from "clsx";
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> { variant?: "default" | "secondary" | "destructive"; }
export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  const variants = { default: "bg-primary text-primary-foreground", secondary: "bg-secondary text-secondary-foreground", destructive: "bg-destructive text-destructive-foreground" } as const;
  return <div className={clsx(base, variants[variant], className)} {...props} />;
}