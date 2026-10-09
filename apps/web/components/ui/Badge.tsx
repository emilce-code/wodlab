import type { HTMLAttributes, ReactNode } from "react";

type BadgeVariant =
  "default" | "accent" | "success" | "error" | "warning" | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default: "border-border bg-surface-elevated text-muted",

  success: "border-accent/30 bg-accent/10 text-accent",
  error: "border-red-400/30 bg-red-400/10 text-red-400",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  info: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  accent: "border-accent/40 bg-accent/10 text-accent",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-md border px-2 py-1",
        "text-[11px] font-semibold uppercase tracking-wide",
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
