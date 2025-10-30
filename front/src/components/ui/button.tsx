import * as React from "react";
import { clsx } from "clsx";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
    default: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
    destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
    ghost: "bg-transparent hover:bg-muted/20",
    outline: "border border-border bg-transparent hover:bg-background/50",
  };

  const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "h-9 px-3",
    md: "h-10 px-4",
    lg: "h-11 px-6",
  };

  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium",
        "ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
