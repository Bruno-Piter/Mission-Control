import * as React from "react";
import { clsx } from "clsx";
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("rounded-lg border bg-card text-card-foreground shadow-card p-6", className)} {...props} />;
}